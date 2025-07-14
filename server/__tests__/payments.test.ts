import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createServer } from "../index";
import { getUserByEmail, deleteUser, getUserWallet } from "../data/storage";
import { paymentService } from "../services/payments";

const app = createServer();

describe("Payment System", () => {
  const testUser = {
    email: "payment-test@example.com",
    password: "TestPassword123!",
    phone: "08012345678",
    firstName: "Payment",
    lastName: "Test",
  };

  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    // Register and login test user
    const registerResponse = await request(app)
      .post("/auth/register")
      .send(testUser);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterEach(async () => {
    // Clean up test user
    const user = getUserByEmail(testUser.email);
    if (user) {
      deleteUser(user.id);
    }
  });

  describe("GET /payments/banks", () => {
    it("should return list of Nigerian banks", async () => {
      const response = await request(app)
        .get("/payments/banks")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);

      // Check for common Nigerian banks
      const bankCodes = response.body.data.map((bank: any) => bank.code);
      expect(bankCodes).toContain("058"); // GTBank
      expect(bankCodes).toContain("011"); // First Bank
      expect(bankCodes).toContain("044"); // Access Bank
    });
  });

  describe("POST /payments/verify-account", () => {
    it("should verify valid account number", async () => {
      const response = await request(app)
        .post("/payments/verify-account")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          account_number: "0123456789",
          bank_code: "058",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should reject invalid account number format", async () => {
      const response = await request(app)
        .post("/payments/verify-account")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          account_number: "123",
          bank_code: "058",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject missing bank code", async () => {
      const response = await request(app)
        .post("/payments/verify-account")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          account_number: "0123456789",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /wallet/fund", () => {
    it("should initialize wallet funding", async () => {
      const response = await request(app)
        .post("/wallet/fund")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 10000,
          callback_url: "https://example.com/callback",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authorization_url).toBeDefined();
      expect(response.body.data.reference).toBeDefined();
      expect(response.body.transaction).toBeDefined();
    });

    it("should reject funding below minimum amount", async () => {
      const response = await request(app)
        .post("/wallet/fund")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 50, // Below minimum
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("100");
    });

    it("should reject funding above maximum amount", async () => {
      const response = await request(app)
        .post("/wallet/fund")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 2000000, // Above maximum
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Payment Service Unit Tests", () => {
    it("should check if any payment service is enabled", () => {
      const isEnabled = paymentService.isAnyServiceEnabled();
      expect(typeof isEnabled).toBe("boolean");
    });

    it("should get fallback banks when APIs are unavailable", async () => {
      const banks = await paymentService.getBanks();
      expect(banks.status).toBe(true);
      expect(banks.data).toBeInstanceOf(Array);
      expect(banks.data.length).toBeGreaterThan(0);
    });

    it("should handle payment initialization gracefully", async () => {
      const result = await paymentService.initializePayment({
        email: "test@example.com",
        amount: 10000,
        currency: "NGN",
        reference: "test_ref",
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(true);
    });

    it("should handle payment verification gracefully", async () => {
      const result = await paymentService.verifyPayment("demo_ref");

      expect(result).toBeDefined();
      expect(result.status).toBe(true);
    });
  });

  describe("Virtual Account Generation", () => {
    it("should generate valid virtual account", async () => {
      const response = await request(app)
        .post("/payments/virtual-account")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.account_number).toMatch(/^\d{10}$/);
      expect(response.body.data.bank_name).toBeDefined();
      expect(response.body.data.account_name).toBeDefined();
    });
  });

  describe("Transfer Functionality", () => {
    beforeEach(async () => {
      // Add some balance to wallet for transfer tests
      const wallet = getUserWallet(userId);
      if (wallet) {
        wallet.balance = 50000; // Add ₦50,000 for testing
      }
    });

    it("should handle bank transfer initiation", async () => {
      const response = await request(app)
        .post("/payments/bank-transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 10000,
          account_number: "0123456789",
          bank_code: "058",
          account_name: "Test Recipient",
          narration: "Test transfer",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should reject transfer with insufficient balance", async () => {
      // Set wallet balance to low amount
      const wallet = getUserWallet(userId);
      if (wallet) {
        wallet.balance = 100;
      }

      const response = await request(app)
        .post("/payments/bank-transfer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          amount: 10000,
          account_number: "0123456789",
          bank_code: "058",
          account_name: "Test Recipient",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Insufficient");
    });
  });

  describe("BVN/NIN Verification", () => {
    it("should handle BVN verification", async () => {
      const response = await request(app)
        .post("/payments/verify-bvn")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          bvn: "22234567890",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should reject invalid BVN format", async () => {
      const response = await request(app)
        .post("/payments/verify-bvn")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          bvn: "123", // Invalid format
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should handle NIN verification", async () => {
      const response = await request(app)
        .post("/payments/verify-nin")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          nin: "12345678901",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should reject invalid NIN format", async () => {
      const response = await request(app)
        .post("/payments/verify-nin")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          nin: "123", // Invalid format
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
