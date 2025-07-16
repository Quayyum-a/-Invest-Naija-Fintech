"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const securityService_1 = require("../services/securityService");
(0, vitest_1.describe)("Security Service", () => {
    (0, vitest_1.describe)("Encryption/Decryption", () => {
        (0, vitest_1.it)("should encrypt and decrypt data correctly", () => {
            const testData = "sensitive-information-123";
            const encrypted = securityService_1.securityService.encrypt(testData);
            (0, vitest_1.expect)(encrypted.encrypted).toBeDefined();
            (0, vitest_1.expect)(encrypted.iv).toBeDefined();
            (0, vitest_1.expect)(encrypted.encrypted).not.toBe(testData);
            const decrypted = securityService_1.securityService.decrypt(encrypted);
            (0, vitest_1.expect)(decrypted).toBe(testData);
        });
        (0, vitest_1.it)("should handle sensitive data encryption", () => {
            const bvn = "12345678901";
            const encrypted = securityService_1.securityService.encryptSensitiveData(bvn);
            (0, vitest_1.expect)(encrypted).not.toBe(bvn);
            (0, vitest_1.expect)(encrypted).toContain(":");
            const decrypted = securityService_1.securityService.decryptSensitiveData(encrypted);
            (0, vitest_1.expect)(decrypted).toBe(bvn);
        });
        (0, vitest_1.it)("should throw error for invalid encrypted data", () => {
            (0, vitest_1.expect)(() => {
                securityService_1.securityService.decrypt({
                    encrypted: "invalid",
                    iv: "invalid",
                    tag: "invalid",
                });
            }).toThrow();
        });
    });
    (0, vitest_1.describe)("Password Security", () => {
        (0, vitest_1.it)("should hash and verify passwords correctly", () => {
            const password = "TestPassword123!";
            const { hash, salt } = securityService_1.securityService.hashPassword(password);
            (0, vitest_1.expect)(hash).toBeDefined();
            (0, vitest_1.expect)(salt).toBeDefined();
            (0, vitest_1.expect)(hash).not.toBe(password);
            const isValid = securityService_1.securityService.verifyPassword(password, hash, salt);
            (0, vitest_1.expect)(isValid).toBe(true);
            const isInvalid = securityService_1.securityService.verifyPassword("WrongPassword", hash, salt);
            (0, vitest_1.expect)(isInvalid).toBe(false);
        });
    });
    (0, vitest_1.describe)("Token Generation", () => {
        (0, vitest_1.it)("should generate secure tokens", () => {
            const token = securityService_1.securityService.generateSecureToken(32);
            (0, vitest_1.expect)(token).toHaveLength(64); // 32 bytes = 64 hex chars
            (0, vitest_1.expect)(token).toMatch(/^[a-f0-9]+$/);
        });
        (0, vitest_1.it)("should generate OTPs", () => {
            const otp = securityService_1.securityService.generateOTP(6);
            (0, vitest_1.expect)(otp).toHaveLength(6);
            (0, vitest_1.expect)(otp).toMatch(/^\d+$/);
            const otp4 = securityService_1.securityService.generateOTP(4);
            (0, vitest_1.expect)(otp4).toHaveLength(4);
        });
    });
    (0, vitest_1.describe)("Rate Limiting", () => {
        (0, vitest_1.it)("should allow requests within limits", () => {
            const identifier = "test-user-1";
            const windowMs = 60000; // 1 minute
            const maxRequests = 5;
            for (let i = 0; i < maxRequests; i++) {
                const result = securityService_1.securityService.checkRateLimit(identifier, windowMs, maxRequests);
                (0, vitest_1.expect)(result.allowed).toBe(true);
            }
        });
        (0, vitest_1.it)("should block requests exceeding limits", () => {
            const identifier = "test-user-2";
            const windowMs = 60000;
            const maxRequests = 3;
            // Make max allowed requests
            for (let i = 0; i < maxRequests; i++) {
                securityService_1.securityService.checkRateLimit(identifier, windowMs, maxRequests);
            }
            // Next request should be blocked
            const result = securityService_1.securityService.checkRateLimit(identifier, windowMs, maxRequests);
            (0, vitest_1.expect)(result.allowed).toBe(false);
            (0, vitest_1.expect)(result.resetTime).toBeGreaterThan(Date.now());
        });
    });
    (0, vitest_1.describe)("Fraud Detection", () => {
        (0, vitest_1.it)("should detect low-risk transactions", () => {
            const lowRiskTransaction = {
                userId: "user1",
                amount: 5000,
                type: "transfer",
                recipient: "known-user",
                location: "Lagos",
                timeOfDay: 14, // 2 PM
            };
            const riskAnalysis = securityService_1.securityService.analyzeTransactionRisk(lowRiskTransaction);
            (0, vitest_1.expect)(riskAnalysis.score).toBeLessThan(40);
            (0, vitest_1.expect)(riskAnalysis.action).toBe("allow");
        });
        (0, vitest_1.it)("should detect high-risk transactions", () => {
            const highRiskTransaction = {
                userId: "user2",
                amount: 1500000, // Very high amount
                type: "transfer",
                recipient: "unknown-user",
                location: "Unknown Location",
                timeOfDay: 3, // 3 AM
            };
            const riskAnalysis = securityService_1.securityService.analyzeTransactionRisk(highRiskTransaction);
            (0, vitest_1.expect)(riskAnalysis.score).toBeGreaterThan(70);
            (0, vitest_1.expect)(riskAnalysis.action).toBe("block");
            (0, vitest_1.expect)(riskAnalysis.factors).toContain("Very high amount transaction");
            (0, vitest_1.expect)(riskAnalysis.factors).toContain("Unusual transaction time");
        });
        (0, vitest_1.it)("should detect medium-risk transactions", () => {
            const mediumRiskTransaction = {
                userId: "user3",
                amount: 600000, // High amount
                type: "transfer",
                recipient: "new-user",
                location: "Lagos",
                timeOfDay: 10,
            };
            const riskAnalysis = securityService_1.securityService.analyzeTransactionRisk(mediumRiskTransaction);
            (0, vitest_1.expect)(riskAnalysis.score).toBeGreaterThanOrEqual(40);
            (0, vitest_1.expect)(riskAnalysis.score).toBeLessThan(70);
            (0, vitest_1.expect)(riskAnalysis.action).toBe("review");
        });
    });
    (0, vitest_1.describe)("Security Event Logging", () => {
        (0, vitest_1.it)("should log security events", () => {
            const event = {
                userId: "user1",
                event: "login",
                details: { ipAddress: "192.168.1.1", userAgent: "Test Browser" },
                risk_score: 10,
            };
            // Should not throw
            (0, vitest_1.expect)(() => {
                securityService_1.securityService.logSecurityEvent(event);
            }).not.toThrow();
        });
        (0, vitest_1.it)("should trigger alerts for high-risk events", () => {
            const highRiskEvent = {
                userId: "user1",
                event: "suspicious_activity",
                details: { reason: "Multiple failed login attempts" },
                risk_score: 85,
            };
            // Should not throw and should log alert
            (0, vitest_1.expect)(() => {
                securityService_1.securityService.logSecurityEvent(highRiskEvent);
            }).not.toThrow();
        });
    });
    (0, vitest_1.describe)("Data Masking", () => {
        (0, vitest_1.it)("should mask sensitive fields", () => {
            const sensitiveData = {
                name: "John Doe",
                email: "john@example.com",
                bvn: "12345678901",
                account_number: "0123456789",
                password: "secret123",
                normal_field: "public data",
            };
            const masked = securityService_1.securityService.maskSensitiveData(sensitiveData);
            (0, vitest_1.expect)(masked.name).toBe("John Doe");
            (0, vitest_1.expect)(masked.email).toBe("john@example.com");
            (0, vitest_1.expect)(masked.normal_field).toBe("public data");
            (0, vitest_1.expect)(masked.bvn).not.toBe("12345678901");
            (0, vitest_1.expect)(masked.account_number).not.toBe("0123456789");
            (0, vitest_1.expect)(masked.password).not.toBe("secret123");
            (0, vitest_1.expect)(masked.bvn).toContain("*");
            (0, vitest_1.expect)(masked.account_number).toContain("*");
        });
        (0, vitest_1.it)("should handle nested objects", () => {
            const nestedData = {
                user: {
                    name: "John",
                    bvn: "12345678901",
                },
                transaction: {
                    amount: 10000,
                    account_number: "0123456789",
                },
            };
            const masked = securityService_1.securityService.maskSensitiveData(nestedData);
            (0, vitest_1.expect)(masked.user.name).toBe("John");
            (0, vitest_1.expect)(masked.user.bvn).not.toBe("12345678901");
            (0, vitest_1.expect)(masked.transaction.amount).toBe(10000);
            (0, vitest_1.expect)(masked.transaction.account_number).not.toBe("0123456789");
        });
    });
    (0, vitest_1.describe)("Session Validation", () => {
        (0, vitest_1.it)("should validate active sessions", () => {
            const validSession = {
                userId: "user1",
                ipAddress: "192.168.1.1",
                userAgent: "Chrome",
                lastActivity: new Date().toISOString(),
            };
            const result = securityService_1.securityService.validateSession(validSession);
            (0, vitest_1.expect)(result.valid).toBe(true);
            (0, vitest_1.expect)(result.reason).toBeUndefined();
        });
        (0, vitest_1.it)("should invalidate expired sessions", () => {
            const expiredSession = {
                userId: "user1",
                ipAddress: "192.168.1.1",
                userAgent: "Chrome",
                lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
            };
            const result = securityService_1.securityService.validateSession(expiredSession);
            (0, vitest_1.expect)(result.valid).toBe(false);
            (0, vitest_1.expect)(result.reason).toBe("Session expired");
        });
    });
    (0, vitest_1.describe)("Device Fingerprinting", () => {
        (0, vitest_1.it)("should generate consistent device fingerprints", () => {
            const mockRequest = {
                headers: {
                    "user-agent": "Mozilla/5.0 Chrome/91.0",
                    "accept-language": "en-US,en;q=0.9",
                    "accept-encoding": "gzip, deflate",
                },
                ip: "192.168.1.1",
            };
            const fingerprint1 = securityService_1.securityService.generateDeviceFingerprint(mockRequest);
            const fingerprint2 = securityService_1.securityService.generateDeviceFingerprint(mockRequest);
            (0, vitest_1.expect)(fingerprint1).toBe(fingerprint2);
            (0, vitest_1.expect)(fingerprint1).toHaveLength(64); // SHA256 hash
        });
        (0, vitest_1.it)("should generate different fingerprints for different devices", () => {
            const device1 = {
                headers: {
                    "user-agent": "Mozilla/5.0 Chrome/91.0",
                    "accept-language": "en-US",
                },
                ip: "192.168.1.1",
            };
            const device2 = {
                headers: {
                    "user-agent": "Mozilla/5.0 Firefox/89.0",
                    "accept-language": "en-US",
                },
                ip: "192.168.1.2",
            };
            const fingerprint1 = securityService_1.securityService.generateDeviceFingerprint(device1);
            const fingerprint2 = securityService_1.securityService.generateDeviceFingerprint(device2);
            (0, vitest_1.expect)(fingerprint1).not.toBe(fingerprint2);
        });
    });
    (0, vitest_1.describe)("Security Metrics", () => {
        (0, vitest_1.it)("should return security metrics", () => {
            const metrics = securityService_1.securityService.getSecurityMetrics();
            (0, vitest_1.expect)(metrics).toHaveProperty("totalEvents");
            (0, vitest_1.expect)(metrics).toHaveProperty("highRiskEvents");
            (0, vitest_1.expect)(metrics).toHaveProperty("blockedTransactions");
            (0, vitest_1.expect)(metrics).toHaveProperty("activeUsers");
            (0, vitest_1.expect)(typeof metrics.totalEvents).toBe("number");
            (0, vitest_1.expect)(typeof metrics.highRiskEvents).toBe("number");
            (0, vitest_1.expect)(typeof metrics.blockedTransactions).toBe("number");
            (0, vitest_1.expect)(typeof metrics.activeUsers).toBe("number");
        });
    });
    (0, vitest_1.describe)("Security Status", () => {
        (0, vitest_1.it)("should return security status assessment", () => {
            const status = securityService_1.securityService.getSecurityStatus();
            (0, vitest_1.expect)(status).toHaveProperty("status");
            (0, vitest_1.expect)(status).toHaveProperty("issues");
            (0, vitest_1.expect)(status).toHaveProperty("recommendations");
            (0, vitest_1.expect)(["secure", "warning", "critical"]).toContain(status.status);
            (0, vitest_1.expect)(Array.isArray(status.issues)).toBe(true);
            (0, vitest_1.expect)(Array.isArray(status.recommendations)).toBe(true);
        });
    });
    (0, vitest_1.describe)("Security Questions", () => {
        (0, vitest_1.it)("should generate security questions", () => {
            const questions = securityService_1.securityService.generateSecurityQuestions();
            (0, vitest_1.expect)(Array.isArray(questions)).toBe(true);
            (0, vitest_1.expect)(questions.length).toBeGreaterThan(0);
            questions.forEach((question) => {
                (0, vitest_1.expect)(question).toHaveProperty("id");
                (0, vitest_1.expect)(question).toHaveProperty("question");
                (0, vitest_1.expect)(typeof question.id).toBe("string");
                (0, vitest_1.expect)(typeof question.question).toBe("string");
            });
        });
    });
});
