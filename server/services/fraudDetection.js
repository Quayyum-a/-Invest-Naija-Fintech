"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fraudDetectionService = void 0;
const connection_1 = __importDefault(require("../database/connection"));
class FraudDetectionService {
    constructor() {
        this.db = connection_1.default.getInstance();
    }
    // Main fraud detection method
    analyzeTransaction(transactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let riskScore = 0;
                const flaggedReasons = [];
                // Get user's transaction history
                const userHistory = yield this.getUserTransactionHistory(transactionData.userId, 30); // Last 30 days
                // 1. Amount-based risk assessment
                const amountRisk = yield this.assessAmountRisk(transactionData, userHistory);
                riskScore += amountRisk.score;
                flaggedReasons.push(...amountRisk.reasons);
                // 2. Velocity checks (frequency and pattern analysis)
                const velocityRisk = yield this.assessVelocityRisk(transactionData, userHistory);
                riskScore += velocityRisk.score;
                flaggedReasons.push(...velocityRisk.reasons);
                // 3. Location-based risk assessment
                const locationRisk = yield this.assessLocationRisk(transactionData, userHistory);
                riskScore += locationRisk.score;
                flaggedReasons.push(...locationRisk.reasons);
                // 4. Device and IP analysis
                const deviceRisk = yield this.assessDeviceRisk(transactionData);
                riskScore += deviceRisk.score;
                flaggedReasons.push(...deviceRisk.reasons);
                // 5. Behavioral pattern analysis
                const behaviorRisk = yield this.assessBehavioralRisk(transactionData, userHistory);
                riskScore += behaviorRisk.score;
                flaggedReasons.push(...behaviorRisk.reasons);
                // 6. Account-based risk factors
                const accountRisk = yield this.assessAccountRisk(transactionData.userId);
                riskScore += accountRisk.score;
                flaggedReasons.push(...accountRisk.reasons);
                // 7. External blacklist checks
                const blacklistRisk = yield this.checkBlacklists(transactionData);
                riskScore += blacklistRisk.score;
                flaggedReasons.push(...blacklistRisk.reasons);
                // 8. Machine learning model prediction (simplified)
                const mlRisk = yield this.getMachineLearningRisk(transactionData, userHistory);
                riskScore += mlRisk.score;
                flaggedReasons.push(...mlRisk.reasons);
                // Determine risk level and recommended action
                const riskLevel = this.calculateRiskLevel(riskScore);
                const recommendedAction = this.getRecommendedAction(riskLevel, riskScore, flaggedReasons);
                const additionalVerification = this.getAdditionalVerification(riskLevel, flaggedReasons);
                // Store fraud assessment for future reference
                yield this.storeFraudAssessment(transactionData, riskScore, riskLevel, flaggedReasons, recommendedAction);
                return {
                    riskScore: Math.min(riskScore, 100),
                    riskLevel,
                    flaggedReasons: flaggedReasons.filter(Boolean),
                    recommendedAction,
                    additionalVerification,
                };
            }
            catch (error) {
                console.error("Fraud detection error:", error);
                // Return high risk if analysis fails
                return {
                    riskScore: 75,
                    riskLevel: "HIGH",
                    flaggedReasons: ["System error during fraud analysis"],
                    recommendedAction: "REVIEW",
                };
            }
        });
    }
    // Real-time monitoring for suspicious patterns
    monitorRealTimePatterns(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const alerts = [];
                let maxRiskLevel = "LOW";
                // Check for rapid-fire transactions
                const recentTransactions = yield this.db.query(`SELECT COUNT(*) as count, SUM(amount) as total_amount
         FROM transactions 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'`, [userId]);
                if (recentTransactions.rows[0].count > 5) {
                    alerts.push("Multiple transactions in short time period");
                    maxRiskLevel = "HIGH";
                }
                // Check for unusual amounts
                const avgTransaction = yield this.db.query(`SELECT AVG(amount) as avg_amount, STDDEV(amount) as stddev_amount
         FROM transactions 
         WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`, [userId]);
                const recentLarge = yield this.db.query(`SELECT COUNT(*) as count
         FROM transactions 
         WHERE user_id = $1 
         AND amount > $2 
         AND created_at > NOW() - INTERVAL '1 hour'`, [
                    userId,
                    (avgTransaction.rows[0].avg_amount || 0) +
                        3 * (avgTransaction.rows[0].stddev_amount || 0),
                ]);
                if (recentLarge.rows[0].count > 0) {
                    alerts.push("Unusually large transaction amounts detected");
                    maxRiskLevel = "MEDIUM";
                }
                // Check for failed login attempts
                const failedLogins = yield this.db.query(`SELECT login_attempts FROM users WHERE id = $1`, [userId]);
                if (((_a = failedLogins.rows[0]) === null || _a === void 0 ? void 0 : _a.login_attempts) > 3) {
                    alerts.push("Multiple failed login attempts");
                    maxRiskLevel = "HIGH";
                }
                return {
                    alerts,
                    riskLevel: maxRiskLevel,
                };
            }
            catch (error) {
                console.error("Real-time monitoring error:", error);
                return {
                    alerts: ["Monitoring system error"],
                    riskLevel: "MEDIUM",
                };
            }
        });
    }
    // Account takeover detection
    detectAccountTakeover(userId, loginData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const riskFactors = [];
                let riskScore = 0;
                // Check login patterns
                const recentLogins = yield this.db.query(`SELECT metadata FROM transactions 
         WHERE user_id = $1 
         AND transaction_type = 'login'
         AND created_at > NOW() - INTERVAL '30 days'
         ORDER BY created_at DESC LIMIT 10`, [userId]);
                // Analyze IP addresses
                const knownIPs = new Set(recentLogins.rows.map((row) => { var _a; return (_a = row.metadata) === null || _a === void 0 ? void 0 : _a.ipAddress; }).filter(Boolean));
                if (!knownIPs.has(loginData.ipAddress) && knownIPs.size > 0) {
                    riskFactors.push("Login from new IP address");
                    riskScore += 30;
                }
                // Analyze user agents
                const knownUserAgents = new Set(recentLogins.rows.map((row) => { var _a; return (_a = row.metadata) === null || _a === void 0 ? void 0 : _a.userAgent; }).filter(Boolean));
                if (!knownUserAgents.has(loginData.userAgent) &&
                    knownUserAgents.size > 0) {
                    riskFactors.push("Login from new device/browser");
                    riskScore += 25;
                }
                // Geographic analysis
                if (loginData.location) {
                    const knownLocations = recentLogins.rows
                        .map((row) => { var _a; return (_a = row.metadata) === null || _a === void 0 ? void 0 : _a.location; })
                        .filter(Boolean);
                    const isNewLocation = !knownLocations.some((loc) => this.isLocationSimilar(loc, loginData.location));
                    if (isNewLocation && knownLocations.length > 0) {
                        riskFactors.push("Login from unusual geographic location");
                        riskScore += 40;
                    }
                }
                // Time-based analysis
                const lastLogin = yield this.db.query("SELECT last_login FROM users WHERE id = $1", [userId]);
                if ((_a = lastLogin.rows[0]) === null || _a === void 0 ? void 0 : _a.last_login) {
                    const timeSinceLastLogin = Date.now() - new Date(lastLogin.rows[0].last_login).getTime();
                    const hoursSinceLastLogin = timeSinceLastLogin / (1000 * 60 * 60);
                    if (hoursSinceLastLogin > 24 * 7) {
                        // More than a week
                        riskFactors.push("Login after extended period of inactivity");
                        riskScore += 15;
                    }
                }
                // Check for impossible travel
                if (recentLogins.rows.length > 0) {
                    const lastKnownLocation = (_b = recentLogins.rows[0].metadata) === null || _b === void 0 ? void 0 : _b.location;
                    const lastLoginTime = new Date(recentLogins.rows[0].created_at);
                    if (lastKnownLocation &&
                        loginData.location &&
                        this.isImpossibleTravel(lastKnownLocation, loginData.location, lastLoginTime, new Date())) {
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
            }
            catch (error) {
                console.error("Account takeover detection error:", error);
                return {
                    isSuspicious: true,
                    riskFactors: ["Error in security analysis"],
                    recommendedAction: "REQUIRE_2FA",
                };
            }
        });
    }
    // Private assessment methods
    assessAmountRisk(transaction, history) {
        return __awaiter(this, void 0, void 0, function* () {
            let score = 0;
            const reasons = [];
            // Calculate user's typical transaction amounts
            const amounts = history.map((t) => parseFloat(t.amount));
            const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length || 0;
            const maxAmount = Math.max(...amounts, 0);
            // Large amount flags
            if (transaction.amount > 1000000) {
                // > 1M NGN
                score += 30;
                reasons.push("Very large transaction amount");
            }
            else if (transaction.amount > avgAmount * 5) {
                score += 20;
                reasons.push("Amount significantly higher than user average");
            }
            else if (transaction.amount > maxAmount * 1.5) {
                score += 15;
                reasons.push("Amount exceeds typical maximum");
            }
            // Round number flags (often associated with fraud)
            if (transaction.amount % 1000 === 0 && transaction.amount >= 10000) {
                score += 5;
                reasons.push("Round number transaction");
            }
            return { score, reasons };
        });
    }
    assessVelocityRisk(transaction, history) {
        return __awaiter(this, void 0, void 0, function* () {
            let score = 0;
            const reasons = [];
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            // Count recent transactions
            const lastHourTxns = history.filter((t) => new Date(t.created_at) > oneHourAgo);
            const lastDayTxns = history.filter((t) => new Date(t.created_at) > oneDayAgo);
            // Velocity flags
            if (lastHourTxns.length > 10) {
                score += 40;
                reasons.push("Excessive transactions in last hour");
            }
            else if (lastHourTxns.length > 5) {
                score += 20;
                reasons.push("High transaction frequency");
            }
            if (lastDayTxns.length > 50) {
                score += 30;
                reasons.push("Excessive daily transaction volume");
            }
            // Amount velocity
            const lastHourAmount = lastHourTxns.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            if (lastHourAmount > 5000000) {
                // > 5M NGN in an hour
                score += 35;
                reasons.push("High monetary velocity");
            }
            return { score, reasons };
        });
    }
    assessLocationRisk(transaction, history) {
        return __awaiter(this, void 0, void 0, function* () {
            let score = 0;
            const reasons = [];
            if (!transaction.location)
                return { score, reasons };
            // Get user's typical locations
            const recentLocations = history
                .map((t) => { var _a; return (_a = t.metadata) === null || _a === void 0 ? void 0 : _a.location; })
                .filter(Boolean)
                .slice(0, 20);
            if (recentLocations.length === 0)
                return { score, reasons };
            // Check if current location is typical
            const isTypicalLocation = recentLocations.some((loc) => this.isLocationSimilar(loc, transaction.location));
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
        });
    }
    assessDeviceRisk(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let score = 0;
            const reasons = [];
            // Get user's device history
            const deviceHistory = yield this.db.query(`SELECT DISTINCT metadata->>'deviceFingerprint' as device,
              metadata->>'userAgent' as user_agent
       FROM transactions 
       WHERE user_id = $1 
       AND metadata->>'deviceFingerprint' IS NOT NULL
       AND created_at > NOW() - INTERVAL '60 days'`, [transaction.userId]);
            const knownDevices = deviceHistory.rows.map((r) => r.device);
            const knownUserAgents = deviceHistory.rows.map((r) => r.user_agent);
            // New device flags
            if (transaction.deviceFingerprint &&
                !knownDevices.includes(transaction.deviceFingerprint)) {
                score += 20;
                reasons.push("Transaction from new device");
            }
            if (transaction.userAgent &&
                !knownUserAgents.includes(transaction.userAgent)) {
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
        });
    }
    assessBehavioralRisk(transaction, history) {
        return __awaiter(this, void 0, void 0, function* () {
            let score = 0;
            const reasons = [];
            // Time-based behavior analysis
            const transactionHour = transaction.timestamp.getHours();
            const historicalHours = history.map((t) => new Date(t.created_at).getHours());
            const typicalHours = [...new Set(historicalHours)];
            if (typicalHours.length > 0 && !typicalHours.includes(transactionHour)) {
                // Check if it's significantly outside normal hours
                const avgHour = historicalHours.reduce((a, b) => a + b, 0) / historicalHours.length;
                const hourDiff = Math.abs(transactionHour - avgHour);
                if (hourDiff > 6) {
                    score += 15;
                    reasons.push("Transaction at unusual time");
                }
            }
            // Channel behavior
            const channelHistory = history.map((t) => t.channel);
            const typicalChannels = [...new Set(channelHistory)];
            if (typicalChannels.length > 0 &&
                !typicalChannels.includes(transaction.channel)) {
                score += 10;
                reasons.push("Transaction via unusual channel");
            }
            // Recipient analysis
            if (transaction.recipientAccount) {
                const recipientHistory = history.filter((t) => t.recipient_account === transaction.recipientAccount);
                if (recipientHistory.length === 0) {
                    score += 15;
                    reasons.push("Transfer to new recipient");
                }
            }
            return { score, reasons };
        });
    }
    assessAccountRisk(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let score = 0;
            const reasons = [];
            // Get user account details
            const userDetails = yield this.db.query("SELECT kyc_status, status, created_at, login_attempts FROM users WHERE id = $1", [userId]);
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
            const accountAge = (Date.now() - new Date(user.created_at).getTime()) /
                (1000 * 60 * 60 * 24);
            if (accountAge < 7) {
                score += 30;
                reasons.push("New account (less than 7 days old)");
            }
            else if (accountAge < 30) {
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
        });
    }
    checkBlacklists(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            let score = 0;
            const reasons = [];
            // Check if recipient account is blacklisted
            if (transaction.recipientAccount) {
                const blacklistedAccount = yield this.db.query("SELECT reason FROM blacklisted_accounts WHERE account_number = $1", [transaction.recipientAccount]);
                if (blacklistedAccount.rows.length > 0) {
                    score += 80;
                    reasons.push("Transfer to blacklisted account");
                }
            }
            // Check IP blacklist
            if (transaction.ipAddress) {
                const blacklistedIP = yield this.db.query("SELECT reason FROM blacklisted_ips WHERE ip_address = $1", [transaction.ipAddress]);
                if (blacklistedIP.rows.length > 0) {
                    score += 60;
                    reasons.push("Transaction from blacklisted IP");
                }
            }
            return { score, reasons };
        });
    }
    getMachineLearningRisk(transaction, history) {
        return __awaiter(this, void 0, void 0, function* () {
            // Simplified ML model - in production, this would use real ML models
            let score = 0;
            const reasons = [];
            // Feature extraction
            const features = {
                amountPercentile: this.calculatePercentile(transaction.amount, history.map((t) => parseFloat(t.amount))),
                hourOfDay: transaction.timestamp.getHours(),
                dayOfWeek: transaction.timestamp.getDay(),
                transactionTypeFrequency: history.filter((t) => t.transaction_type === transaction.transactionType).length / history.length,
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
        });
    }
    // Helper methods
    getUserTransactionHistory(userId, days) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.query(`SELECT * FROM transactions 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`, [userId]);
            return result.rows;
        });
    }
    calculateRiskLevel(riskScore) {
        if (riskScore >= 80)
            return "CRITICAL";
        if (riskScore >= 60)
            return "HIGH";
        if (riskScore >= 30)
            return "MEDIUM";
        return "LOW";
    }
    getRecommendedAction(riskLevel, riskScore, reasons) {
        if (riskLevel === "CRITICAL" || riskScore >= 90)
            return "DECLINE";
        if (riskLevel === "HIGH" || riskScore >= 70)
            return "REVIEW";
        if (riskLevel === "MEDIUM" || riskScore >= 40)
            return "REQUIRE_OTP";
        return "APPROVE";
    }
    getAdditionalVerification(riskLevel, reasons) {
        const verification = [];
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
    getAccountTakeoverAction(riskScore) {
        if (riskScore >= 70)
            return "BLOCK_ACCOUNT";
        if (riskScore >= 50)
            return "REQUIRE_2FA";
        if (riskScore >= 30)
            return "REQUIRE_EMAIL_VERIFICATION";
        return "ALLOW";
    }
    isLocationSimilar(loc1, loc2) {
        if (!loc1 || !loc2)
            return false;
        // Simple distance calculation - in production, use proper geo calculations
        const latDiff = Math.abs((loc1.latitude || 0) - (loc2.latitude || 0));
        const lonDiff = Math.abs((loc1.longitude || 0) - (loc2.longitude || 0));
        return latDiff < 0.1 && lonDiff < 0.1; // ~10km tolerance
    }
    isHighRiskLocation(location) {
        // Define high-risk locations based on your risk appetite
        const highRiskCountries = ["XX", "YY"]; // Placeholder
        return highRiskCountries.includes(location.country);
    }
    isImpossibleTravel(loc1, loc2, time1, time2) {
        if (!loc1 || !loc2)
            return false;
        // Calculate distance and time
        const distance = this.calculateDistance(loc1, loc2);
        const timeDiff = (time2.getTime() - time1.getTime()) / (1000 * 60 * 60); // hours
        // Assume maximum travel speed of 1000 km/h (airplane)
        const maxPossibleDistance = timeDiff * 1000;
        return distance > maxPossibleDistance;
    }
    calculateDistance(loc1, loc2) {
        // Haversine formula for distance calculation
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(loc2.latitude - loc1.latitude);
        const dLon = this.toRadians(loc2.longitude - loc1.longitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(loc1.latitude)) *
                Math.cos(this.toRadians(loc2.latitude)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    isSuspiciousUserAgent(userAgent) {
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
    calculatePercentile(value, array) {
        if (array.length === 0)
            return 0;
        const sorted = array.sort((a, b) => a - b);
        const index = sorted.findIndex((v) => v >= value);
        return index === -1 ? 100 : (index / sorted.length) * 100;
    }
    calculateAvgDaysBetween(transactions) {
        if (transactions.length < 2)
            return 0;
        const dates = transactions
            .map((t) => new Date(t.created_at).getTime())
            .sort((a, b) => a - b);
        let totalDays = 0;
        for (let i = 1; i < dates.length; i++) {
            totalDays += (dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24);
        }
        return totalDays / (dates.length - 1);
    }
    storeFraudAssessment(transaction, riskScore, riskLevel, reasons, recommendedAction) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.db.query(`INSERT INTO fraud_assessments (
          user_id, transaction_type, amount, risk_score, risk_level,
          flagged_reasons, recommended_action, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`, [
                    transaction.userId,
                    transaction.transactionType,
                    transaction.amount,
                    riskScore,
                    riskLevel,
                    JSON.stringify(reasons),
                    recommendedAction,
                ]);
            }
            catch (error) {
                console.error("Failed to store fraud assessment:", error);
            }
        });
    }
}
exports.fraudDetectionService = new FraudDetectionService();
