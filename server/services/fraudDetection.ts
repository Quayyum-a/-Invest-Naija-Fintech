import DatabaseManager from "../database/connection";
import { kycVerificationService } from "./kycVerification";

interface TransactionData {
  userId: string;
  accountId: string;
  amount: number;
  transactionType: string;
  recipientAccount?: string;
  recipientBank?: string;
  location?: any;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  channel: string;
  timestamp: Date;
}

interface FraudRisk {
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  flaggedReasons: string[];
  recommendedAction: "APPROVE" | "REVIEW" | "DECLINE" | "REQUIRE_OTP";
  additionalVerification?: string[];
}

class FraudDetectionService {
  private db: DatabaseManager;

  constructor() {
    this.db = DatabaseManager.getInstance();
  }

  // Main fraud detection method
  async analyzeTransaction(
    transactionData: TransactionData,
  ): Promise<FraudRisk> {
    try {
      let riskScore = 0;
      const flaggedReasons: string[] = [];

      // Get user's transaction history
      const userHistory = await this.getUserTransactionHistory(
        transactionData.userId,
        30,
      ); // Last 30 days

      // 1. Amount-based risk assessment
      const amountRisk = await this.assessAmountRisk(
        transactionData,
        userHistory,
      );
      riskScore += amountRisk.score;
      flaggedReasons.push(...amountRisk.reasons);

      // 2. Velocity checks (frequency and pattern analysis)
      const velocityRisk = await this.assessVelocityRisk(
        transactionData,
        userHistory,
      );
      riskScore += velocityRisk.score;
      flaggedReasons.push(...velocityRisk.reasons);

      // 3. Location-based risk assessment
      const locationRisk = await this.assessLocationRisk(
        transactionData,
        userHistory,
      );
      riskScore += locationRisk.score;
      flaggedReasons.push(...locationRisk.reasons);

      // 4. Device and IP analysis
      const deviceRisk = await this.assessDeviceRisk(transactionData);
      riskScore += deviceRisk.score;
      flaggedReasons.push(...deviceRisk.reasons);

      // 5. Behavioral pattern analysis
      const behaviorRisk = await this.assessBehavioralRisk(
        transactionData,
        userHistory,
      );
      riskScore += behaviorRisk.score;
      flaggedReasons.push(...behaviorRisk.reasons);

      // 6. Account-based risk factors
      const accountRisk = await this.assessAccountRisk(transactionData.userId);
      riskScore += accountRisk.score;
      flaggedReasons.push(...accountRisk.reasons);

      // 7. External blacklist checks
      const blacklistRisk = await this.checkBlacklists(transactionData);
      riskScore += blacklistRisk.score;
      flaggedReasons.push(...blacklistRisk.reasons);

      // 8. Machine learning model prediction (simplified)
      const mlRisk = await this.getMachineLearningRisk(
        transactionData,
        userHistory,
      );
      riskScore += mlRisk.score;
      flaggedReasons.push(...mlRisk.reasons);

      // Determine risk level and recommended action
      const riskLevel = this.calculateRiskLevel(riskScore);
      const recommendedAction = this.getRecommendedAction(
        riskLevel,
        riskScore,
        flaggedReasons,
      );
      const additionalVerification = this.getAdditionalVerification(
        riskLevel,
        flaggedReasons,
      );

      // Store fraud assessment for future reference
      await this.storeFraudAssessment(
        transactionData,
        riskScore,
        riskLevel,
        flaggedReasons,
        recommendedAction,
      );

      return {
        riskScore: Math.min(riskScore, 100),
        riskLevel,
        flaggedReasons: flaggedReasons.filter(Boolean),
        recommendedAction,
        additionalVerification,
      };
    } catch (error) {
      console.error("Fraud detection error:", error);
      // Return high risk if analysis fails
      return {
        riskScore: 75,
        riskLevel: "HIGH",
        flaggedReasons: ["System error during fraud analysis"],
        recommendedAction: "REVIEW",
      };
    }
  }

  // Real-time monitoring for suspicious patterns
  async monitorRealTimePatterns(userId: string): Promise<{
    alerts: string[];
    riskLevel: string;
  }> {
    try {
      const alerts: string[] = [];
      let maxRiskLevel = "LOW";

      // Check for rapid-fire transactions
      const recentTransactions = await this.db.query(
        `SELECT COUNT(*) as count, SUM(amount) as total_amount
         FROM transactions 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'`,
        [userId],
      );

      if (recentTransactions.rows[0].count > 5) {
        alerts.push("Multiple transactions in short time period");
        maxRiskLevel = "HIGH";
      }

      // Check for unusual amounts
      const avgTransaction = await this.db.query(
        `SELECT AVG(amount) as avg_amount, STDDEV(amount) as stddev_amount
         FROM transactions 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
        [userId],
      );

      const recentLarge = await this.db.query(
        `SELECT COUNT(*) as count
         FROM transactions 
         WHERE user_id = $1 
         AND amount > $2 
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [
          userId,
          (avgTransaction.rows[0].avg_amount || 0) +
            3 * (avgTransaction.rows[0].stddev_amount || 0),
        ],
      );

      if (recentLarge.rows[0].count > 0) {
        alerts.push("Unusually large transaction amounts detected");
        maxRiskLevel = "MEDIUM";
      }

      // Check for failed login attempts
      const failedLogins = await this.db.query(
        `SELECT login_attempts FROM users WHERE id = $1`,
        [userId],
      );

      if (failedLogins.rows[0]?.login_attempts > 3) {
        alerts.push("Multiple failed login attempts");
        maxRiskLevel = "HIGH";
      }

      return {
        alerts,
        riskLevel: maxRiskLevel,
      };
    } catch (error) {
      console.error("Real-time monitoring error:", error);
      return {
        alerts: ["Monitoring system error"],
        riskLevel: "MEDIUM",
      };
    }
  }

  // Account takeover detection
  async detectAccountTakeover(
    userId: string,
    loginData: {
      ipAddress: string;
      userAgent: string;
      deviceFingerprint?: string;
      location?: any;
    },
  ): Promise<{
    isSuspicious: boolean;
    riskFactors: string[];
    recommendedAction: string;
  }> {
    try {
      const riskFactors: string[] = [];
      let riskScore = 0;

      // Check login patterns
      const recentLogins = await this.db.query(
        `SELECT metadata FROM transactions 
         WHERE user_id = $1 
         AND transaction_type = 'login'
         AND created_at > NOW() - INTERVAL '30 days'
         ORDER BY created_at DESC LIMIT 10`,
        [userId],
      );

      // Analyze IP addresses
      const knownIPs = new Set(
        recentLogins.rows.map((row) => row.metadata?.ipAddress).filter(Boolean),
      );

      if (!knownIPs.has(loginData.ipAddress) && knownIPs.size > 0) {
        riskFactors.push("Login from new IP address");
        riskScore += 30;
      }

      // Analyze user agents
      const knownUserAgents = new Set(
        recentLogins.rows.map((row) => row.metadata?.userAgent).filter(Boolean),
      );

      if (
        !knownUserAgents.has(loginData.userAgent) &&
        knownUserAgents.size > 0
      ) {
        riskFactors.push("Login from new device/browser");
        riskScore += 25;
      }

      // Geographic analysis
      if (loginData.location) {
        const knownLocations = recentLogins.rows
          .map((row) => row.metadata?.location)
          .filter(Boolean);

        const isNewLocation = !knownLocations.some((loc) =>
          this.isLocationSimilar(loc, loginData.location),
        );

        if (isNewLocation && knownLocations.length > 0) {
          riskFactors.push("Login from unusual geographic location");
          riskScore += 40;
        }
      }

      // Time-based analysis
      const lastLogin = await this.db.query(
        "SELECT last_login FROM users WHERE id = $1",
        [userId],
      );

      if (lastLogin.rows[0]?.last_login) {
        const timeSinceLastLogin =
          Date.now() - new Date(lastLogin.rows[0].last_login).getTime();
        const hoursSinceLastLogin = timeSinceLastLogin / (1000 * 60 * 60);

        if (hoursSinceLastLogin > 24 * 7) {
          // More than a week
          riskFactors.push("Login after extended period of inactivity");
          riskScore += 15;
        }
      }

      // Check for impossible travel
      if (recentLogins.rows.length > 0) {
        const lastKnownLocation = recentLogins.rows[0].metadata?.location;
        const lastLoginTime = new Date(recentLogins.rows[0].created_at);

        if (
          lastKnownLocation &&
          loginData.location &&
          this.isImpossibleTravel(
            lastKnownLocation,
            loginData.location,
            lastLoginTime,
            new Date(),
          )
        ) {
          riskFactors.push("Impossible travel detected");
          riskScore += 50;
        }
      }

      const isSuspicious = riskScore >= 40;
      const recommendedAction = this.getAccountTakeoverAction(riskScore);

      return {
        isSuspicious,
        riskFactors,
        recommendedAction,
      };
    } catch (error) {
      console.error("Account takeover detection error:", error);
      return {
        isSuspicious: true,
        riskFactors: ["Error in security analysis"],
        recommendedAction: "REQUIRE_2FA",
      };
    }
  }

  // Private assessment methods

  private async assessAmountRisk(
    transaction: TransactionData,
    history: any[],
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Calculate user's typical transaction amounts
    const amounts = history.map((t) => parseFloat(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length || 0;
    const maxAmount = Math.max(...amounts, 0);

    // Large amount flags
    if (transaction.amount > 1000000) {
      // > 1M NGN
      score += 30;
      reasons.push("Very large transaction amount");
    } else if (transaction.amount > avgAmount * 5) {
      score += 20;
      reasons.push("Amount significantly higher than user average");
    } else if (transaction.amount > maxAmount * 1.5) {
      score += 15;
      reasons.push("Amount exceeds typical maximum");
    }

    // Round number flags (often associated with fraud)
    if (transaction.amount % 1000 === 0 && transaction.amount >= 10000) {
      score += 5;
      reasons.push("Round number transaction");
    }

    return { score, reasons };
  }

  private async assessVelocityRisk(
    transaction: TransactionData,
    history: any[],
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Count recent transactions
    const lastHourTxns = history.filter(
      (t) => new Date(t.created_at) > oneHourAgo,
    );
    const lastDayTxns = history.filter(
      (t) => new Date(t.created_at) > oneDayAgo,
    );

    // Velocity flags
    if (lastHourTxns.length > 10) {
      score += 40;
      reasons.push("Excessive transactions in last hour");
    } else if (lastHourTxns.length > 5) {
      score += 20;
      reasons.push("High transaction frequency");
    }

    if (lastDayTxns.length > 50) {
      score += 30;
      reasons.push("Excessive daily transaction volume");
    }

    // Amount velocity
    const lastHourAmount = lastHourTxns.reduce(
      (sum, t) => sum + parseFloat(t.amount),
      0,
    );
    if (lastHourAmount > 5000000) {
      // > 5M NGN in an hour
      score += 35;
      reasons.push("High monetary velocity");
    }

    return { score, reasons };
  }

  private async assessLocationRisk(
    transaction: TransactionData,
    history: any[],
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    if (!transaction.location) return { score, reasons };

    // Get user's typical locations
    const recentLocations = history
      .map((t) => t.metadata?.location)
      .filter(Boolean)
      .slice(0, 20);

    if (recentLocations.length === 0) return { score, reasons };

    // Check if current location is typical
    const isTypicalLocation = recentLocations.some((loc) =>
      this.isLocationSimilar(loc, transaction.location),
    );

    if (!isTypicalLocation) {
      score += 25;
      reasons.push("Transaction from unusual location");

      // Check if it's from a high-risk country
      if (this.isHighRiskLocation(transaction.location)) {
        score += 30;
        reasons.push("Transaction from high-risk geographic area");
      }
    }

    return { score, reasons };
  }

  private async assessDeviceRisk(
    transaction: TransactionData,
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Get user's device history
    const deviceHistory = await this.db.query(
      `SELECT DISTINCT metadata->>'deviceFingerprint' as device,
              metadata->>'userAgent' as user_agent
       FROM transactions 
       WHERE user_id = $1 
       AND metadata->>'deviceFingerprint' IS NOT NULL
       AND created_at > NOW() - INTERVAL '60 days'`,
      [transaction.userId],
    );

    const knownDevices = deviceHistory.rows.map((r) => r.device);
    const knownUserAgents = deviceHistory.rows.map((r) => r.user_agent);

    // New device flags
    if (
      transaction.deviceFingerprint &&
      !knownDevices.includes(transaction.deviceFingerprint)
    ) {
      score += 20;
      reasons.push("Transaction from new device");
    }

    if (
      transaction.userAgent &&
      !knownUserAgents.includes(transaction.userAgent)
    ) {
      score += 15;
      reasons.push("Transaction from new browser/app");
    }

    // Suspicious user agent patterns
    if (transaction.userAgent) {
      if (this.isSuspiciousUserAgent(transaction.userAgent)) {
        score += 25;
        reasons.push("Suspicious browser/device characteristics");
      }
    }

    return { score, reasons };
  }

  private async assessBehavioralRisk(
    transaction: TransactionData,
    history: any[],
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Time-based behavior analysis
    const transactionHour = transaction.timestamp.getHours();
    const historicalHours = history.map((t) =>
      new Date(t.created_at).getHours(),
    );

    const typicalHours = [...new Set(historicalHours)];
    if (typicalHours.length > 0 && !typicalHours.includes(transactionHour)) {
      // Check if it's significantly outside normal hours
      const avgHour =
        historicalHours.reduce((a, b) => a + b, 0) / historicalHours.length;
      const hourDiff = Math.abs(transactionHour - avgHour);

      if (hourDiff > 6) {
        score += 15;
        reasons.push("Transaction at unusual time");
      }
    }

    // Channel behavior
    const channelHistory = history.map((t) => t.channel);
    const typicalChannels = [...new Set(channelHistory)];

    if (
      typicalChannels.length > 0 &&
      !typicalChannels.includes(transaction.channel)
    ) {
      score += 10;
      reasons.push("Transaction via unusual channel");
    }

    // Recipient analysis
    if (transaction.recipientAccount) {
      const recipientHistory = history.filter(
        (t) => t.recipient_account === transaction.recipientAccount,
      );

      if (recipientHistory.length === 0) {
        score += 15;
        reasons.push("Transfer to new recipient");
      }
    }

    return { score, reasons };
  }

  private async assessAccountRisk(
    userId: string,
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Get user account details
    const userDetails = await this.db.query(
      "SELECT kyc_status, status, created_at, login_attempts FROM users WHERE id = $1",
      [userId],
    );

    if (userDetails.rows.length === 0) {
      return { score: 100, reasons: ["User account not found"] };
    }

    const user = userDetails.rows[0];

    // KYC status risk
    if (user.kyc_status !== "verified") {
      score += 25;
      reasons.push("Unverified KYC status");
    }

    // Account age risk
    const accountAge =
      (Date.now() - new Date(user.created_at).getTime()) /
      (1000 * 60 * 60 * 24);
    if (accountAge < 7) {
      score += 30;
      reasons.push("New account (less than 7 days old)");
    } else if (accountAge < 30) {
      score += 15;
      reasons.push("Recent account (less than 30 days old)");
    }

    // Login attempt risks
    if (user.login_attempts > 3) {
      score += 20;
      reasons.push("Multiple failed login attempts");
    }

    // Account status
    if (user.status !== "active") {
      score += 50;
      reasons.push("Account not in active status");
    }

    return { score, reasons };
  }

  private async checkBlacklists(
    transaction: TransactionData,
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Check if recipient account is blacklisted
    if (transaction.recipientAccount) {
      const blacklistedAccount = await this.db.query(
        "SELECT reason FROM blacklisted_accounts WHERE account_number = $1",
        [transaction.recipientAccount],
      );

      if (blacklistedAccount.rows.length > 0) {
        score += 80;
        reasons.push("Transfer to blacklisted account");
      }
    }

    // Check IP blacklist
    if (transaction.ipAddress) {
      const blacklistedIP = await this.db.query(
        "SELECT reason FROM blacklisted_ips WHERE ip_address = $1",
        [transaction.ipAddress],
      );

      if (blacklistedIP.rows.length > 0) {
        score += 60;
        reasons.push("Transaction from blacklisted IP");
      }
    }

    return { score, reasons };
  }

  private async getMachineLearningRisk(
    transaction: TransactionData,
    history: any[],
  ): Promise<{ score: number; reasons: string[] }> {
    // Simplified ML model - in production, this would use real ML models
    let score = 0;
    const reasons: string[] = [];

    // Feature extraction
    const features = {
      amountPercentile: this.calculatePercentile(
        transaction.amount,
        history.map((t) => parseFloat(t.amount)),
      ),
      hourOfDay: transaction.timestamp.getHours(),
      dayOfWeek: transaction.timestamp.getDay(),
      transactionTypeFrequency:
        history.filter(
          (t) => t.transaction_type === transaction.transactionType,
        ).length / history.length,
      avgDaysBetweenTransactions: this.calculateAvgDaysBetween(history),
    };

    // Simple scoring based on features
    if (features.amountPercentile > 95) {
      score += 20;
      reasons.push("Amount in top 5% of user transactions");
    }

    if (features.hourOfDay < 6 || features.hourOfDay > 23) {
      score += 10;
      reasons.push("Transaction during unusual hours");
    }

    if (features.transactionTypeFrequency < 0.1) {
      score += 15;
      reasons.push("Unusual transaction type for user");
    }

    return { score, reasons };
  }

  // Helper methods

  private async getUserTransactionHistory(
    userId: string,
    days: number,
  ): Promise<any[]> {
    const result = await this.db.query(
      `SELECT * FROM transactions 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows;
  }

  private calculateRiskLevel(
    riskScore: number,
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    if (riskScore >= 80) return "CRITICAL";
    if (riskScore >= 60) return "HIGH";
    if (riskScore >= 30) return "MEDIUM";
    return "LOW";
  }

  private getRecommendedAction(
    riskLevel: string,
    riskScore: number,
    reasons: string[],
  ): "APPROVE" | "REVIEW" | "DECLINE" | "REQUIRE_OTP" {
    if (riskLevel === "CRITICAL" || riskScore >= 90) return "DECLINE";
    if (riskLevel === "HIGH" || riskScore >= 70) return "REVIEW";
    if (riskLevel === "MEDIUM" || riskScore >= 40) return "REQUIRE_OTP";
    return "APPROVE";
  }

  private getAdditionalVerification(
    riskLevel: string,
    reasons: string[],
  ): string[] {
    const verification: string[] = [];

    if (riskLevel === "HIGH" || riskLevel === "CRITICAL") {
      verification.push("SMS_OTP", "DOCUMENT_VERIFICATION");
    }

    if (reasons.includes("Transaction from new device")) {
      verification.push("DEVICE_VERIFICATION");
    }

    if (reasons.includes("Transaction from unusual location")) {
      verification.push("LOCATION_CONFIRMATION");
    }

    return verification;
  }

  private getAccountTakeoverAction(riskScore: number): string {
    if (riskScore >= 70) return "BLOCK_ACCOUNT";
    if (riskScore >= 50) return "REQUIRE_2FA";
    if (riskScore >= 30) return "REQUIRE_EMAIL_VERIFICATION";
    return "ALLOW";
  }

  private isLocationSimilar(loc1: any, loc2: any): boolean {
    if (!loc1 || !loc2) return false;
    // Simple distance calculation - in production, use proper geo calculations
    const latDiff = Math.abs((loc1.latitude || 0) - (loc2.latitude || 0));
    const lonDiff = Math.abs((loc1.longitude || 0) - (loc2.longitude || 0));
    return latDiff < 0.1 && lonDiff < 0.1; // ~10km tolerance
  }

  private isHighRiskLocation(location: any): boolean {
    // Define high-risk locations based on your risk appetite
    const highRiskCountries = ["XX", "YY"]; // Placeholder
    return highRiskCountries.includes(location.country);
  }

  private isImpossibleTravel(
    loc1: any,
    loc2: any,
    time1: Date,
    time2: Date,
  ): boolean {
    if (!loc1 || !loc2) return false;

    // Calculate distance and time
    const distance = this.calculateDistance(loc1, loc2);
    const timeDiff = (time2.getTime() - time1.getTime()) / (1000 * 60 * 60); // hours

    // Assume maximum travel speed of 1000 km/h (airplane)
    const maxPossibleDistance = timeDiff * 1000;

    return distance > maxPossibleDistance;
  }

  private calculateDistance(loc1: any, loc2: any): number {
    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.latitude)) *
        Math.cos(this.toRadians(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /curl/i,
      /wget/i,
      /python/i,
    ];
    return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
  }

  private calculatePercentile(value: number, array: number[]): number {
    if (array.length === 0) return 0;
    const sorted = array.sort((a, b) => a - b);
    const index = sorted.findIndex((v) => v >= value);
    return index === -1 ? 100 : (index / sorted.length) * 100;
  }

  private calculateAvgDaysBetween(transactions: any[]): number {
    if (transactions.length < 2) return 0;

    const dates = transactions
      .map((t) => new Date(t.created_at).getTime())
      .sort((a, b) => a - b);

    let totalDays = 0;
    for (let i = 1; i < dates.length; i++) {
      totalDays += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
    }

    return totalDays / (dates.length - 1);
  }

  private async storeFraudAssessment(
    transaction: TransactionData,
    riskScore: number,
    riskLevel: string,
    reasons: string[],
    recommendedAction: string,
  ): Promise<void> {
    try {
      await this.db.query(
        `INSERT INTO fraud_assessments (
          user_id, transaction_type, amount, risk_score, risk_level,
          flagged_reasons, recommended_action, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          transaction.userId,
          transaction.transactionType,
          transaction.amount,
          riskScore,
          riskLevel,
          JSON.stringify(reasons),
          recommendedAction,
        ],
      );
    } catch (error) {
      console.error("Failed to store fraud assessment:", error);
    }
  }
}

export const fraudDetectionService = new FraudDetectionService();
