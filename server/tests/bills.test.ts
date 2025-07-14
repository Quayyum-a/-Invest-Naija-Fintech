import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { createServer } from "../index";
import { initializeApp } from "../data/init";

const app = createServer();

describe("Bill Payments API", () => {
  let authToken: string;

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
  });

  describe("POST /bills/buy-airtime", () => {
    it("should validate airtime purchase data", async () => {
      const airtimeData = {
        network: "INVALID_NETWORK",
        phoneNumber: "+1234567890", // Non-Nigerian number
        amount: 20, // Below minimum
      };

      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send(airtimeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should accept valid airtime purchase", async () => {
      const airtimeData = {
        network: "MTN",
        phoneNumber: "+2348012345678",
        amount: 100,
      };

      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send(airtimeData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.wallet).toBeDefined();
    });

    it("should normalize phone numbers", async () => {
      const airtimeData = {
        network: "MTN",
        phoneNumber: "08012345678", // Nigerian format without country code
        amount: 100,
      };

      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send(airtimeData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should check wallet balance", async () => {
      const airtimeData = {
        network: "MTN",
        phoneNumber: "+2348012345678",
        amount: 100000, // Amount higher than initial wallet balance
      };

      const response = await request(app)
        .post("/bills/buy-airtime")
        .set("Authorization", `Bearer ${authToken}`)
        .send(airtimeData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Insufficient wallet balance");
    });
  });

  describe("POST /bills/pay-electricity", () => {
    it("should validate electricity bill data", async () => {
      const billData = {
        billerId: "",
        customerCode: "",
        amount: 200, // Below minimum
        meterType: "invalid_type",
        phone: "invalid_phone",
      };

      const response = await request(app)
        .post("/bills/pay-electricity")
        .set("Authorization", `Bearer ${authToken}`)
        .send(billData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should accept valid electricity bill payment", async () => {
      const billData = {
        billerId: "EKEDC_PREPAID",
        customerCode: "1234567890",
        amount: 1000,
        meterType: "prepaid",
        phone: "+2348012345678",
      };

      const response = await request(app)
        .post("/bills/pay-electricity")
        .set("Authorization", `Bearer ${authToken}`)
        .send(billData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.wallet).toBeDefined();
    });
  });

  describe("POST /bills/pay-cable-tv", () => {
    it("should validate cable TV payment data", async () => {
      const cableData = {
        provider: "INVALID_PROVIDER",
        smartCardNumber: "",
        planId: "",
        amount: 50, // Below minimum
      };

      const response = await request(app)
        .post("/bills/pay-cable-tv")
        .set("Authorization", `Bearer ${authToken}`)
        .send(cableData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Validation error");
    });

    it("should accept valid cable TV payment", async () => {
      const cableData = {
        provider: "DSTV",
        smartCardNumber: "1234567890",
        planId: "dstv_compact",
        amount: 5000,
      };

      const response = await request(app)
        .post("/bills/pay-cable-tv")
        .set("Authorization", `Bearer ${authToken}`)
        .send(cableData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.transaction).toBeDefined();
      expect(response.body.wallet).toBeDefined();
    });
  });

  describe("GET /bills/billers", () => {
    it("should get available billers", async () => {
      const response = await request(app).get("/bills/billers").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.billers).toBeDefined();
      expect(Array.isArray(response.body.billers)).toBe(true);
    });
  });

  describe("GET /bills/electricity/companies", () => {
    it("should get electricity companies", async () => {
      const response = await request(app)
        .get("/bills/electricity/companies")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.companies).toBeDefined();
      expect(Array.isArray(response.body.companies)).toBe(true);
    });
  });

  describe("POST /bills/validate-customer", () => {
    it("should validate customer information", async () => {
      const customerData = {
        billerId: "EKEDC_PREPAID",
        customerCode: "1234567890",
      };

      const response = await request(app)
        .post("/bills/validate-customer")
        .send(customerData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.customer).toBeDefined();
    });

    it("should require billerId and customerCode", async () => {
      const response = await request(app)
        .post("/bills/validate-customer")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Biller ID and customer code are required",
      );
    });
  });

  describe("GET /transfer/banks", () => {
    it("should get available banks for transfer", async () => {
      const response = await request(app).get("/transfer/banks").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.banks).toBeDefined();
      expect(Array.isArray(response.body.banks)).toBe(true);
    });
  });

  describe("POST /transfer/verify-account", () => {
    it("should verify bank account", async () => {
      const accountData = {
        accountNumber: "1234567890",
        bankCode: "058",
      };

      const response = await request(app)
        .post("/transfer/verify-account")
        .send(accountData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.accountName).toBeDefined();
    });

    it("should require account number and bank code", async () => {
      const response = await request(app)
        .post("/transfer/verify-account")
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe(
        "Account number and bank code are required",
      );
    });
  });

  describe("POST /transfer/initiate", () => {
    it("should validate transfer data", async () => {
      const transferData = {
        accountNumber: "123456789", // Invalid length
        bankCode: "05", // Invalid length
        accountName: "",
        amount: 500, // Below minimum
        reason: "",
      };

      const response = await request(app)
        .post("/transfer/initiate")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transferData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Invalid transfer details");
    });

    it("should check wallet balance for transfer", async () => {
      const transferData = {
        accountNumber: "1234567890",
        bankCode: "058",
        accountName: "Test Recipient",
        amount: 100000, // Higher than wallet balance
        reason: "Test transfer",
      };

      const response = await request(app)
        .post("/transfer/initiate")
        .set("Authorization", `Bearer ${authToken}`)
        .send(transferData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Insufficient wallet balance");
    });
  });
});
