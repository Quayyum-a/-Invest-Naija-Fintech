import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { createServer } from "../index";
import { initializeApp } from "../data/init";

const app = createServer();

describe("Wallet API", () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    await initializeApp();

    // Register and login to get auth token
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

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe("GET /wallet", () => {
    it("should get user wallet with valid token", async () => {
      const response = await request(app)
        .get("/wallet")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.wallet).toBeDefined();
      expect(response.body.wallet.balance).toBe(5000); // Initial balance from init
      expect(response.body.wallet.userId).toBe(userId);
    });

    it("should reject request without authentication", async () => {
      const response = await request(app).get("/wallet").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Access token required");
    });
  });

  describe("POST /wallet/fund", () => {
    it("should validate funding amount", async () => {
      const fundData = {
        amount: 50, // Below minimum
        provider: "paystack",
      };

      const response = await request(app)
        .post("/wallet/fund")
        .set("Authorization", `Bearer ${authToken}`)
        .send(fundData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should accept valid funding request", async () => {
      const fundData = {
        amount: 1000,
        provider: "paystack",
      };

      const response = await request(app)
        .post("/wallet/fund")
        .set("Authorization", `Bearer ${authToken}`)
        .send(fundData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should reject funding without authentication", async () => {
      const fundData = {
        amount: 1000,
        provider: "paystack",
      };

      const response = await request(app)
        .post("/wallet/fund")
        .send(fundData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /wallet/transfer", () => {
    it("should validate transfer data", async () => {
      const transferData = {
        toUserIdentifier: "test@recipient.com",
        amount: 5, // Below minimum
        description: "Test transfer",
      };

      const response = await request(app)
        .post("/wallet/transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transferData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should accept valid transfer data", async () => {
      const transferData = {
        toUserIdentifier: "test@recipient.com",
        amount: 100,
        description: "Test transfer",
      };

      const response = await request(app)
        .post("/wallet/transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transferData)
        .expect(400); // Will fail due to recipient not found, but validation passes

      // Should get to business logic, not validation error
      expect(response.body.error).not.toBe("Validation error");
    });
  });

  describe("POST /wallet/withdraw", () => {
    it("should validate withdrawal data", async () => {
      const withdrawData = {
        amount: 500, // Below minimum
        bankDetails: {
          accountNumber: "123456789", // Invalid length
          bankCode: "12", // Invalid length
          accountName: "Test User",
        },
      };

      const response = await request(app)
        .post("/wallet/withdraw")
        .set("Authorization", `Bearer ${authToken}`)
        .send(withdrawData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should accept valid withdrawal data", async () => {
      const withdrawData = {
        amount: 2000,
        bankDetails: {
          accountNumber: "1234567890",
          bankCode: "123",
          accountName: "Test User",
        },
      };

      const response = await request(app)
        .post("/wallet/withdraw")
        .set("Authorization", `Bearer ${authToken}`)
        .send(withdrawData)
        .expect(400); // Will fail at business logic, but validation passes

      expect(response.body.error).not.toBe("Validation error");
    });
  });

  describe("POST /wallet/invest", () => {
    it("should validate investment data", async () => {
      const investData = {
        amount: 50, // Below minimum
        investmentType: "invalid_type",
        autoReinvest: true,
      };

      const response = await request(app)
        .post("/wallet/invest")
        .set("Authorization", `Bearer ${authToken}`)
        .send(investData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should accept valid investment data", async () => {
      const investData = {
        amount: 1000,
        investmentType: "money_market",
        autoReinvest: false,
      };

      const response = await request(app)
        .post("/wallet/invest")
        .set("Authorization", `Bearer ${authToken}`)
        .send(investData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.investment).toBeDefined();
      expect(response.body.transaction).toBeDefined();
    });
  });

  describe("GET /transactions", () => {
    it("should get user transactions", async () => {
      const response = await request(app)
        .get("/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toBeDefined();
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    it("should respect transaction limit query", async () => {
      const response = await request(app)
        .get("/transactions?limit=5")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transactions.length).toBeLessThanOrEqual(5);
    });
  });

  describe("GET /transactions/history", () => {
    it("should get transaction history with filters", async () => {
      const response = await request(app)
        .get("/transactions/history?page=1&limit=10&type=deposit")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transactions).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it("should validate query parameters", async () => {
      const response = await request(app)
        .get("/transactions/history?page=invalid&limit=abc")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });
  });

  describe("GET /dashboard", () => {
    it("should get dashboard data", async () => {
      const response = await request(app)
        .get("/dashboard")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.wallet).toBeDefined();
      expect(response.body.data.recentTransactions).toBeDefined();
      expect(response.body.data.investmentGoal).toBeDefined();
    });
  });

  describe("GET /portfolio", () => {
    it("should get portfolio data", async () => {
      const response = await request(app)
        .get("/portfolio")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.wallet).toBeDefined();
      expect(response.body.data.investments).toBeDefined();
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.allocation).toBeDefined();
    });
  });
});
