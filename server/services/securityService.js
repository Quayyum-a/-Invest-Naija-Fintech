"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const storage_1 = require("../data/storage");
class SecurityService {
    constructor() {
        this.algorithm = "aes-256-gcm";
        this.securityEvents = [];
        this.suspiciousActivities = new Map();
        this.key = Buffer.from(env_1.env.ENCRYPTION_KEY, "utf8").slice(0, 32);
    }
    // Data Encryption/Decryption
    encrypt(text) {
        try {
            const iv = crypto_1.default.randomBytes(16);
            const cipher = crypto_1.default.createCipher(this.algorithm, this.key);
            let encrypted = cipher.update(text, "utf8", "hex");
            encrypted += cipher.final("hex");
            return {
                encrypted,
                iv: iv.toString("hex"),
                tag: cipher.getAuthTag ? cipher.getAuthTag().toString("hex") : "",
            };
        }
        catch (error) {
            console.error("Encryption error:", error);
            throw new Error("Encryption failed");
        }
    }
    decrypt(encryptedData) {
        try {
            const decipher = crypto_1.default.createDecipher(this.algorithm, this.key);
            if (encryptedData.tag && decipher.setAuthTag) {
                decipher.setAuthTag(Buffer.from(encryptedData.tag, "hex"));
            }
            let decrypted = decipher.update(encryptedData.encrypted, "hex", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        }
        catch (error) {
            console.error("Decryption error:", error);
            throw new Error("Decryption failed");
        }
    }
    // Sensitive data encryption (BVN, NIN, etc.)
    encryptSensitiveData(data) {
        const encrypted = this.encrypt(data);
        return `${encrypted.encrypted}:${encrypted.iv}:${encrypted.tag}`;
    }
    decryptSensitiveData(encryptedString) {
        const [encrypted, iv, tag] = encryptedString.split(":");
        return this.decrypt({ encrypted, iv, tag });
    }
    // Password hashing with salt
    hashPassword(password) {
        const salt = crypto_1.default.randomBytes(32).toString("hex");
        const hash = crypto_1.default
            .pbkdf2Sync(password, salt, 10000, 64, "sha512")
            .toString("hex");
        return { hash, salt };
    }
    verifyPassword(password, hash, salt) {
        const hashVerify = crypto_1.default
            .pbkdf2Sync(password, salt, 10000, 64, "sha512")
            .toString("hex");
        return hash === hashVerify;
    }
    // Generate secure tokens
    generateSecureToken(length = 32) {
        return crypto_1.default.randomBytes(length).toString("hex");
    }
    generateOTP(length = 6) {
        const digits = "0123456789";
        let otp = "";
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        return otp;
    }
    // Rate limiting and fraud detection
    checkRateLimit(identifier, windowMs, maxRequests) {
        const now = Date.now();
        const windowStart = now - windowMs;
        // In production, use Redis for distributed rate limiting
        const key = `rate_limit:${identifier}`;
        // For now, use in-memory tracking (should be replaced with Redis)
        if (!this.suspiciousActivities.has(key)) {
            this.suspiciousActivities.set(key, 0);
        }
        const currentCount = this.suspiciousActivities.get(key) || 0;
        if (currentCount >= maxRequests) {
            return {
                allowed: false,
                resetTime: windowStart + windowMs,
            };
        }
        this.suspiciousActivities.set(key, currentCount + 1);
        // Reset counter after window
        setTimeout(() => {
            this.suspiciousActivities.delete(key);
        }, windowMs);
        return {
            allowed: true,
            resetTime: windowStart + windowMs,
        };
    }
    // Fraud detection
    analyzeTransactionRisk(transactionData) {
        let riskScore = 0;
        const riskFactors = [];
        // Amount-based risk
        if (transactionData.amount > 500000) {
            riskScore += 30;
            riskFactors.push("High amount transaction");
        }
        if (transactionData.amount > 1000000) {
            riskScore += 50;
            riskFactors.push("Very high amount transaction");
        }
        // Time-based risk (unusual hours)
        const hour = new Date().getHours();
        if (hour < 6 || hour > 23) {
            riskScore += 20;
            riskFactors.push("Unusual transaction time");
        }
        // Frequency-based risk
        const userActivity = this.getUserActivityScore(transactionData.userId);
        if (userActivity > 10) {
            riskScore += 25;
            riskFactors.push("High frequency transactions");
        }
        // New recipient risk
        if (transactionData.recipient &&
            !this.isKnownRecipient(transactionData.userId, transactionData.recipient)) {
            riskScore += 15;
            riskFactors.push("New recipient");
        }
        // Device/location risk
        if (transactionData.location &&
            !this.isKnownLocation(transactionData.userId, transactionData.location)) {
            riskScore += 20;
            riskFactors.push("New location");
        }
        // Determine action based on risk score
        let action = "allow";
        if (riskScore >= 70) {
            action = "block";
        }
        else if (riskScore >= 40) {
            action = "review";
        }
        return {
            score: riskScore,
            factors: riskFactors,
            action,
        };
    }
    getUserActivityScore(userId) {
        // Count recent transactions in the last hour
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return this.securityEvents.filter((event) => event.userId === userId &&
            event.event === "transaction" &&
            new Date(event.timestamp).getTime() > oneHourAgo).length;
    }
    isKnownRecipient(userId, recipient) {
        // Check if user has sent money to this recipient before
        return this.securityEvents.some((event) => event.userId === userId &&
            event.event === "transaction" &&
            event.details.recipient === recipient);
    }
    isKnownLocation(userId, location) {
        // Check if user has transacted from this location before
        return this.securityEvents.some((event) => event.userId === userId && event.details.location === location);
    }
    // Security event logging
    logSecurityEvent(event) {
        const securityEvent = Object.assign(Object.assign({}, event), { timestamp: new Date().toISOString() });
        this.securityEvents.push(securityEvent);
        // Keep only last 10000 events in memory
        if (this.securityEvents.length > 10000) {
            this.securityEvents = this.securityEvents.slice(-10000);
        }
        // Log to database/external service in production
        console.log("🔒 Security Event:", securityEvent);
        // Trigger alerts for high-risk events
        if (event.risk_score && event.risk_score > 70) {
            this.triggerSecurityAlert(securityEvent);
        }
    }
    triggerSecurityAlert(event) {
        console.log("🚨 HIGH RISK SECURITY ALERT:", event);
        // In production:
        // - Send to security team via email/Slack
        // - Create incident in monitoring system
        // - Possibly block user account temporarily
    }
    // Account security
    generateSecurityQuestions() {
        return [
            { id: "mother_maiden", question: "What is your mother's maiden name?" },
            {
                id: "first_school",
                question: "What was the name of your first school?",
            },
            { id: "first_pet", question: "What was the name of your first pet?" },
            { id: "birth_city", question: "In which city were you born?" },
            { id: "favorite_book", question: "What is your favorite book?" },
        ];
    }
    // Device fingerprinting
    generateDeviceFingerprint(req) {
        const userAgent = req.headers["user-agent"] || "";
        const acceptLanguage = req.headers["accept-language"] || "";
        const acceptEncoding = req.headers["accept-encoding"] || "";
        const ipAddress = req.ip || req.connection.remoteAddress || "";
        const fingerprint = crypto_1.default
            .createHash("sha256")
            .update(`${userAgent}${acceptLanguage}${acceptEncoding}${ipAddress}`)
            .digest("hex");
        return fingerprint;
    }
    // Session security
    validateSession(sessionData) {
        const lastActivity = new Date(sessionData.lastActivity);
        const now = new Date();
        const sessionAge = now.getTime() - lastActivity.getTime();
        // Session timeout (24 hours)
        if (sessionAge > 24 * 60 * 60 * 1000) {
            return { valid: false, reason: "Session expired" };
        }
        // Check for suspicious activity
        const recentEvents = this.securityEvents.filter((event) => event.userId === sessionData.userId &&
            new Date(event.timestamp).getTime() > now.getTime() - 60 * 60 * 1000);
        const suspiciousEvents = recentEvents.filter((event) => event.risk_score && event.risk_score > 50);
        if (suspiciousEvents.length > 0) {
            return { valid: false, reason: "Suspicious activity detected" };
        }
        return { valid: true };
    }
    // Data masking for logs and responses
    maskSensitiveData(data) {
        if (typeof data !== "object" || data === null) {
            return data;
        }
        const sensitiveFields = [
            "password",
            "bvn",
            "nin",
            "account_number",
            "card_number",
            "cvv",
            "pin",
        ];
        const masked = Object.assign({}, data);
        Object.keys(masked).forEach((key) => {
            if (sensitiveFields.includes(key.toLowerCase())) {
                if (typeof masked[key] === "string") {
                    masked[key] = this.maskString(masked[key]);
                }
            }
            else if (typeof masked[key] === "object") {
                masked[key] = this.maskSensitiveData(masked[key]);
            }
        });
        return masked;
    }
    maskString(str) {
        if (str.length <= 4) {
            return "*".repeat(str.length);
        }
        const start = str.substring(0, 2);
        const end = str.substring(str.length - 2);
        const middle = "*".repeat(str.length - 4);
        return `${start}${middle}${end}`;
    }
    // Compliance and audit
    generateAuditLog(userId, action, details) {
        const auditEntry = {
            userId,
            action,
            details: this.maskSensitiveData(details),
            timestamp: new Date().toISOString(),
            ipAddress: details.ipAddress,
            userAgent: details.userAgent,
        };
        // Store in audit database
        console.log("📋 Audit Log:", auditEntry);
        // Create audit transaction for important actions
        if (["login", "kyc_update", "large_transaction"].includes(action)) {
            (0, storage_1.createTransaction)({
                userId,
                type: "audit",
                amount: 0,
                description: `Audit: ${action}`,
                status: "completed",
                metadata: {
                    audit_action: action,
                    audit_details: this.maskSensitiveData(details),
                },
            });
        }
    }
    // Security metrics
    getSecurityMetrics() {
        const now = Date.now();
        const last24Hours = now - 24 * 60 * 60 * 1000;
        const recentEvents = this.securityEvents.filter((event) => new Date(event.timestamp).getTime() > last24Hours);
        const highRiskEvents = recentEvents.filter((event) => event.risk_score && event.risk_score > 70);
        const blockedTransactions = recentEvents.filter((event) => event.event === "transaction_blocked");
        const activeUsers = new Set(recentEvents.map((event) => event.userId).filter(Boolean)).size;
        return {
            totalEvents: recentEvents.length,
            highRiskEvents: highRiskEvents.length,
            blockedTransactions: blockedTransactions.length,
            activeUsers,
        };
    }
    // Security status check
    getSecurityStatus() {
        const issues = [];
        const recommendations = [];
        // Check for recent high-risk activities
        const recentHighRisk = this.securityEvents.filter((event) => event.risk_score &&
            event.risk_score > 70 &&
            new Date(event.timestamp).getTime() > Date.now() - 60 * 60 * 1000);
        if (recentHighRisk.length > 10) {
            issues.push("High number of high-risk activities in the last hour");
            recommendations.push("Review and potentially tighten security controls");
        }
        // Check rate limiting effectiveness
        if (this.suspiciousActivities.size > 1000) {
            issues.push("High number of rate-limited requests");
            recommendations.push("Consider implementing stricter rate limits");
        }
        let status = "secure";
        if (issues.length > 2) {
            status = "critical";
        }
        else if (issues.length > 0) {
            status = "warning";
        }
        return {
            status,
            issues,
            recommendations,
        };
    }
}
exports.securityService = new SecurityService();
exports.default = SecurityService;
