import { describe, it, expect, beforeEach } from "vitest";
import { securityService } from "../services/securityService";

describe("Security Service", () => {
  describe("Encryption/Decryption", () => {
    it("should encrypt and decrypt data correctly", () => {
      const testData = "sensitive-information-123";
      const encrypted = securityService.encrypt(testData);

      expect(encrypted.encrypted).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.encrypted).not.toBe(testData);

      const decrypted = securityService.decrypt(encrypted);
      expect(decrypted).toBe(testData);
    });

    it("should handle sensitive data encryption", () => {
      const bvn = "12345678901";
      const encrypted = securityService.encryptSensitiveData(bvn);

      expect(encrypted).not.toBe(bvn);
      expect(encrypted).toContain(":");

      const decrypted = securityService.decryptSensitiveData(encrypted);
      expect(decrypted).toBe(bvn);
    });

    it("should throw error for invalid encrypted data", () => {
      expect(() => {
        securityService.decrypt({
          encrypted: "invalid",
          iv: "invalid",
          tag: "invalid",
        });
      }).toThrow();
    });
  });

  describe("Password Security", () => {
    it("should hash and verify passwords correctly", () => {
      const password = "TestPassword123!";
      const { hash, salt } = securityService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      expect(hash).not.toBe(password);

      const isValid = securityService.verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);

      const isInvalid = securityService.verifyPassword(
        "WrongPassword",
        hash,
        salt,
      );
      expect(isInvalid).toBe(false);
    });
  });

  describe("Token Generation", () => {
    it("should generate secure tokens", () => {
      const token = securityService.generateSecureToken(32);
      expect(token).toHaveLength(64); // 32 bytes = 64 hex chars
      expect(token).toMatch(/^[a-f0-9]+$/);
    });

    it("should generate OTPs", () => {
      const otp = securityService.generateOTP(6);
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d+$/);

      const otp4 = securityService.generateOTP(4);
      expect(otp4).toHaveLength(4);
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests within limits", () => {
      const identifier = "test-user-1";
      const windowMs = 60000; // 1 minute
      const maxRequests = 5;

      for (let i = 0; i < maxRequests; i++) {
        const result = securityService.checkRateLimit(
          identifier,
          windowMs,
          maxRequests,
        );
        expect(result.allowed).toBe(true);
      }
    });

    it("should block requests exceeding limits", () => {
      const identifier = "test-user-2";
      const windowMs = 60000;
      const maxRequests = 3;

      // Make max allowed requests
      for (let i = 0; i < maxRequests; i++) {
        securityService.checkRateLimit(identifier, windowMs, maxRequests);
      }

      // Next request should be blocked
      const result = securityService.checkRateLimit(
        identifier,
        windowMs,
        maxRequests,
      );
      expect(result.allowed).toBe(false);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });
  });

  describe("Fraud Detection", () => {
    it("should detect low-risk transactions", () => {
      const lowRiskTransaction = {
        userId: "user1",
        amount: 5000,
        type: "transfer",
        recipient: "known-user",
        location: "Lagos",
        timeOfDay: 14, // 2 PM
      };

      const riskAnalysis =
        securityService.analyzeTransactionRisk(lowRiskTransaction);

      expect(riskAnalysis.score).toBeLessThan(40);
      expect(riskAnalysis.action).toBe("allow");
    });

    it("should detect high-risk transactions", () => {
      const highRiskTransaction = {
        userId: "user2",
        amount: 1500000, // Very high amount
        type: "transfer",
        recipient: "unknown-user",
        location: "Unknown Location",
        timeOfDay: 3, // 3 AM
      };

      const riskAnalysis =
        securityService.analyzeTransactionRisk(highRiskTransaction);

      expect(riskAnalysis.score).toBeGreaterThan(70);
      expect(riskAnalysis.action).toBe("block");
      expect(riskAnalysis.factors).toContain("Very high amount transaction");
      expect(riskAnalysis.factors).toContain("Unusual transaction time");
    });

    it("should detect medium-risk transactions", () => {
      const mediumRiskTransaction = {
        userId: "user3",
        amount: 600000, // High amount
        type: "transfer",
        recipient: "new-user",
        location: "Lagos",
        timeOfDay: 10,
      };

      const riskAnalysis = securityService.analyzeTransactionRisk(
        mediumRiskTransaction,
      );

      expect(riskAnalysis.score).toBeGreaterThanOrEqual(40);
      expect(riskAnalysis.score).toBeLessThan(70);
      expect(riskAnalysis.action).toBe("review");
    });
  });

  describe("Security Event Logging", () => {
    it("should log security events", () => {
      const event = {
        userId: "user1",
        event: "login",
        details: { ipAddress: "192.168.1.1", userAgent: "Test Browser" },
        risk_score: 10,
      };

      // Should not throw
      expect(() => {
        securityService.logSecurityEvent(event);
      }).not.toThrow();
    });

    it("should trigger alerts for high-risk events", () => {
      const highRiskEvent = {
        userId: "user1",
        event: "suspicious_activity",
        details: { reason: "Multiple failed login attempts" },
        risk_score: 85,
      };

      // Should not throw and should log alert
      expect(() => {
        securityService.logSecurityEvent(highRiskEvent);
      }).not.toThrow();
    });
  });

  describe("Data Masking", () => {
    it("should mask sensitive fields", () => {
      const sensitiveData = {
        name: "John Doe",
        email: "john@example.com",
        bvn: "12345678901",
        account_number: "0123456789",
        password: "secret123",
        normal_field: "public data",
      };

      const masked = securityService.maskSensitiveData(sensitiveData);

      expect(masked.name).toBe("John Doe");
      expect(masked.email).toBe("john@example.com");
      expect(masked.normal_field).toBe("public data");

      expect(masked.bvn).not.toBe("12345678901");
      expect(masked.account_number).not.toBe("0123456789");
      expect(masked.password).not.toBe("secret123");

      expect(masked.bvn).toContain("*");
      expect(masked.account_number).toContain("*");
    });

    it("should handle nested objects", () => {
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

      const masked = securityService.maskSensitiveData(nestedData);

      expect(masked.user.name).toBe("John");
      expect(masked.user.bvn).not.toBe("12345678901");
      expect(masked.transaction.amount).toBe(10000);
      expect(masked.transaction.account_number).not.toBe("0123456789");
    });
  });

  describe("Session Validation", () => {
    it("should validate active sessions", () => {
      const validSession = {
        userId: "user1",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        lastActivity: new Date().toISOString(),
      };

      const result = securityService.validateSession(validSession);
      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should invalidate expired sessions", () => {
      const expiredSession = {
        userId: "user1",
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        lastActivity: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago
      };

      const result = securityService.validateSession(expiredSession);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Session expired");
    });
  });

  describe("Device Fingerprinting", () => {
    it("should generate consistent device fingerprints", () => {
      const mockRequest = {
        headers: {
          "user-agent": "Mozilla/5.0 Chrome/91.0",
          "accept-language": "en-US,en;q=0.9",
          "accept-encoding": "gzip, deflate",
        },
        ip: "192.168.1.1",
      };

      const fingerprint1 =
        securityService.generateDeviceFingerprint(mockRequest);
      const fingerprint2 =
        securityService.generateDeviceFingerprint(mockRequest);

      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(64); // SHA256 hash
    });

    it("should generate different fingerprints for different devices", () => {
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

      const fingerprint1 = securityService.generateDeviceFingerprint(device1);
      const fingerprint2 = securityService.generateDeviceFingerprint(device2);

      expect(fingerprint1).not.toBe(fingerprint2);
    });
  });

  describe("Security Metrics", () => {
    it("should return security metrics", () => {
      const metrics = securityService.getSecurityMetrics();

      expect(metrics).toHaveProperty("totalEvents");
      expect(metrics).toHaveProperty("highRiskEvents");
      expect(metrics).toHaveProperty("blockedTransactions");
      expect(metrics).toHaveProperty("activeUsers");

      expect(typeof metrics.totalEvents).toBe("number");
      expect(typeof metrics.highRiskEvents).toBe("number");
      expect(typeof metrics.blockedTransactions).toBe("number");
      expect(typeof metrics.activeUsers).toBe("number");
    });
  });

  describe("Security Status", () => {
    it("should return security status assessment", () => {
      const status = securityService.getSecurityStatus();

      expect(status).toHaveProperty("status");
      expect(status).toHaveProperty("issues");
      expect(status).toHaveProperty("recommendations");

      expect(["secure", "warning", "critical"]).toContain(status.status);
      expect(Array.isArray(status.issues)).toBe(true);
      expect(Array.isArray(status.recommendations)).toBe(true);
    });
  });

  describe("Security Questions", () => {
    it("should generate security questions", () => {
      const questions = securityService.generateSecurityQuestions();

      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);

      questions.forEach((question) => {
        expect(question).toHaveProperty("id");
        expect(question).toHaveProperty("question");
        expect(typeof question.id).toBe("string");
        expect(typeof question.question).toBe("string");
      });
    });
  });
});
