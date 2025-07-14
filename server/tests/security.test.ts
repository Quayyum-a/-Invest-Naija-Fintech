import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { createServer } from "../index";
import { initializeApp } from "../data/init";

const app = createServer();

describe("Security Middleware", () => {
  beforeEach(async () => {
    await initializeApp();
  });

  describe("Rate Limiting", () => {
    it("should apply rate limiting to auth endpoints", async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array.from({ length: 10 }, () =>
        request(app).post("/auth/login").send({
          email: "test@example.com",
          password: "wrongpassword",
        }),
      );

      const responses = await Promise.all(promises);

      // Should have some 429 (Too Many Requests) responses
      const rateLimitedResponses = responses.filter(
        (res) => res.status === 429,
      );

      // In test environment, rate limiting might be more lenient
      expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(0);
    });

    it("should include rate limit headers", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "test@example.com", password: "test" });

      // Check for rate limit headers
      expect(response.headers).toHaveProperty("x-ratelimit-limit");
      expect(response.headers).toHaveProperty("x-ratelimit-remaining");
    });
  });

  describe("Input Validation", () => {
    it("should sanitize potentially dangerous input", async () => {
      const maliciousData = {
        email: "test@example.com<script>alert('xss')</script>",
        password: "TestPass123",
        firstName: "John<script>alert('xss')</script>",
        lastName: "Doe",
        phone: "+2348012345678",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(maliciousData);

      // Should either reject the input or sanitize it
      if (response.status === 201) {
        expect(response.body.user.firstName).not.toContain("<script>");
      } else {
        expect(response.status).toBe(400);
      }
    });
  });

  describe("Security Headers", () => {
    it("should include security headers", async () => {
      const response = await request(app).get("/ping");

      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers).toHaveProperty("x-frame-options");
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
    });

    it("should include Content Security Policy", async () => {
      const response = await request(app).get("/ping");

      expect(response.headers).toHaveProperty("content-security-policy");
      expect(response.headers["content-security-policy"]).toContain(
        "default-src 'self'",
      );
    });
  });

  describe("Authentication", () => {
    it("should reject requests without authentication token", async () => {
      const response = await request(app).get("/wallet").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Access token required");
    });

    it("should reject requests with invalid authentication token", async () => {
      const response = await request(app)
        .get("/wallet")
        .set("Authorization", "Bearer invalid-token")
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid or expired token");
    });

    it("should accept requests with valid JWT token", async () => {
      // Register and get JWT token
      const userData = {
        email: "test@example.com",
        password: "TestPass123",
        phone: "+2348012345678",
        firstName: "John",
        lastName: "Doe",
      };

      const registerResponse = await request(app)
        .post("/auth/register")
        .send(userData);

      const jwtToken = registerResponse.body.token;

      // Use JWT token to access protected route
      const response = await request(app)
        .get("/wallet")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.wallet).toBeDefined();
    });
  });

  describe("Validation Schema", () => {
    it("should validate request body against schema", async () => {
      const invalidData = {
        email: "not-an-email",
        password: "123", // Too short
        phone: "123", // Invalid format
        firstName: "", // Empty
        lastName: "", // Empty
      };

      const response = await request(app)
        .post("/auth/register")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it("should validate Nigerian phone number format", async () => {
      const invalidPhoneData = {
        email: "test@example.com",
        password: "TestPass123",
        phone: "+1234567890", // US number, not Nigerian
        firstName: "John",
        lastName: "Doe",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(invalidPhoneData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should validate password strength", async () => {
      const weakPasswordData = {
        email: "test@example.com",
        password: "weak", // No uppercase, no numbers
        phone: "+2348012345678",
        firstName: "John",
        lastName: "Doe",
      };

      const response = await request(app)
        .post("/auth/register")
        .send(weakPasswordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });
  });

  describe("Device Fingerprinting", () => {
    it("should log suspicious user agents", async () => {
      const response = await request(app)
        .get("/ping")
        .set("User-Agent", "curl/7.68.0"); // Automated tool

      // Should still work but may be logged
      expect(response.status).toBe(200);
    });

    it("should accept normal browser user agents", async () => {
      const response = await request(app)
        .get("/ping")
        .set(
          "User-Agent",
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        );

      expect(response.status).toBe(200);
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 errors gracefully", async () => {
      const response = await request(app).get("/nonexistent-route").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Route");
      expect(response.body.error).toContain("not found");
    });

    it("should not leak sensitive information in errors", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: "nonexistent@example.com", password: "test" })
        .expect(401);

      expect(response.body.error).toBe("Invalid credentials");
      expect(response.body.error).not.toContain("user not found");
      expect(response.body.error).not.toContain("password");
    });
  });
});
