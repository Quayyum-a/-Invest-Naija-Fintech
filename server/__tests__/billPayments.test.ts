import { describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";
import { createServer } from "../index";
import { getUserByEmail, deleteUser, getUserWallet } from "../data/storage";

const app = createServer();

describe("Bill Payments", () => {
  const testUser = {
    email: "billpay-test@example.com",
    password: "TestPassword123!",
    phone: "08012345678",
    firstName: "BillPay",
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

    // Add balance to wallet for bill payment tests
    const wallet = getUserWallet(userId);
    if (wallet) {
      wallet.balance = 100000; // Add ₦100,000 for testing
    }
  });

  afterEach(async () => {
    // Clean up test user
    const user = getUserByEmail(testUser.email);
    if (user) {
      deleteUser(user.id);
    }
  });

  describe("GET /bills/billers", () => {
    it("should return available billers and services", async () => {
      const response = await request(app)
        .get("/bills/billers")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("airtime");
      expect(response.body.data).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("electricity");
      expect(response.body.data).toHaveProperty("cable_tv");

      // Check airtime providers
      expect(response.body.data.airtime.providers).toBeInstanceOf(Array);
      const providerCodes = response.body.data.airtime.providers.map(
        (p: any) => p.code,
      );
      expect(providerCodes).toContain("mtn");
      expect(providerCodes).toContain("glo");
      expect(providerCodes).toContain("airtel");
      expect(providerCodes).toContain("9mobile");
    });
  });

  describe("Airtime Purchase", () => {
    it("should purchase airtime successfully", async () => {
      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "mtn",
          phone: "08012345678",
          amount: 1000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.wallet).toBeDefined();
      expect(response.body.message).toContain("airtime");

      // Check wallet balance is reduced
      expect(response.body.wallet.balance).toBe(99000); // 100,000 - 1,000
    });

    it("should reject airtime purchase with invalid network", async () => {
      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "invalid",
          phone: "08012345678",
          amount: 1000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("network");
    });

    it("should reject airtime purchase with invalid phone", async () => {
      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "mtn",
          phone: "123", // Invalid Nigerian number
          amount: 1000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("phone");
    });

    it("should reject airtime purchase below minimum amount", async () => {
      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "mtn",
          phone: "08012345678",
          amount: 40, // Below minimum
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("50");
    });

    it("should reject airtime purchase with insufficient balance", async () => {
      // Set wallet balance to low amount
      const wallet = getUserWallet(userId);
      if (wallet) {
        wallet.balance = 500;
      }

      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "mtn",
          phone: "08012345678",
          amount: 1000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Insufficient");
    });
  });

  describe("Data Bundle Purchase", () => {
    it("should purchase data bundle successfully", async () => {
      const response = await request(app)
        .post("/bills/buy-data")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "mtn",
          phone: "08012345678",
          data_plan: "1GB",
          amount: 1000,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.wallet).toBeDefined();
      expect(response.body.message).toContain("data");
    });

    it("should reject data purchase with invalid network", async () => {
      const response = await request(app)
        .post("/bills/buy-data")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "invalid",
          phone: "08012345678",
          data_plan: "1GB",
          amount: 1000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject data purchase with invalid plan", async () => {
      const response = await request(app)
        .post("/bills/buy-data")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "mtn",
          phone: "08012345678",
          data_plan: "invalid_plan",
          amount: 1000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Electricity Bill Payment", () => {
    it("should pay electricity bill successfully", async () => {
      const response = await request(app)
        .post("/bills/pay-electricity")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          disco: "ekedc",
          customer_id: "12345678901234",
          amount: 5000,
          customer_name: "Test Customer",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.wallet).toBeDefined();
      expect(response.body.message).toContain("electricity");
    });

    it("should reject electricity payment with invalid disco", async () => {
      const response = await request(app)
        .post("/bills/pay-electricity")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          disco: "invalid",
          customer_id: "12345678901234",
          amount: 5000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject electricity payment below minimum amount", async () => {
      const response = await request(app)
        .post("/bills/pay-electricity")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          disco: "ekedc",
          customer_id: "12345678901234",
          amount: 500, // Below minimum
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("1000");
    });
  });

  describe("Cable TV Payment", () => {
    it("should pay cable TV bill successfully", async () => {
      const response = await request(app)
        .post("/bills/pay-cable-tv")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          provider: "dstv",
          customer_id: "1234567890",
          package: "dstv-compact",
          amount: 15700,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.wallet).toBeDefined();
      expect(response.body.message).toContain("DSTV");
    });

    it("should reject cable TV payment with invalid provider", async () => {
      const response = await request(app)
        .post("/bills/pay-cable-tv")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          provider: "invalid",
          customer_id: "1234567890",
          package: "basic",
          amount: 2000,
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject cable TV payment below minimum amount", async () => {
      const response = await request(app)
        .post("/bills/pay-cable-tv")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          provider: "gotv",
          customer_id: "1234567890",
          package: "gotv-smallie",
          amount: 500, // Below minimum
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("1000");
    });
  });

  describe("Customer Validation", () => {
    it("should validate customer for electricity", async () => {
      const response = await request(app)
        .post("/bills/validate-customer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          biller_code: "EKEDC",
          customer_id: "12345678901234",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should validate customer for cable TV", async () => {
      const response = await request(app)
        .post("/bills/validate-customer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          biller_code: "DSTV",
          customer_id: "1234567890",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it("should reject validation without biller code", async () => {
      const response = await request(app)
        .post("/bills/validate-customer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          customer_id: "1234567890",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should reject validation without customer ID", async () => {
      const response = await request(app)
        .post("/bills/validate-customer")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          biller_code: "DSTV",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe("Bill Payment Transaction Flow", () => {
    it("should create proper transaction records for airtime", async () => {
      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "mtn",
          phone: "08012345678",
          amount: 2000,
        })
        .expect(200);

      const transaction = response.body.transaction;
      expect(transaction.type).toBe("bill_payment");
      expect(transaction.amount).toBe(-2000); // Negative for debit
      expect(transaction.status).toBe("completed");
      expect(transaction.description).toContain("MTN");
      expect(transaction.description).toContain("Airtime");
      expect(transaction.metadata.network).toBe("mtn");
      expect(transaction.metadata.phone).toBe("08012345678");
      expect(transaction.metadata.bill_type).toBe("airtime");
    });

    it("should update wallet balance correctly", async () => {
      const initialWallet = getUserWallet(userId);
      const initialBalance = initialWallet?.balance || 0;

      await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "glo",
          phone: "08012345678",
          amount: 1500,
        })
        .expect(200);

      const updatedWallet = getUserWallet(userId);
      expect(updatedWallet?.balance).toBe(initialBalance - 1500);
    });

    it("should handle multiple bill payments correctly", async () => {
      // First payment
      await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "mtn",
          phone: "08012345678",
          amount: 1000,
        })
        .expect(200);

      // Second payment
      await request(app)
        .post("/bills/buy-data")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          network: "airtel",
          phone: "08012345678",
          data_plan: "2GB",
          amount: 2000,
        })
        .expect(200);

      // Check final wallet balance
      const wallet = getUserWallet(userId);
      expect(wallet?.balance).toBe(97000); // 100,000 - 1,000 - 2,000
    });
  });
});
