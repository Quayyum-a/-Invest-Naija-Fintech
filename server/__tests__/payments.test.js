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
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const storage_1 = require("../data/storage");
const payments_1 = require("../services/payments");
const app = (0, index_1.createServer)();
(0, vitest_1.describe)("Payment System", () => {
    const testUser = {
        email: "payment-test@example.com",
        password: "TestPassword123!",
        phone: "08012345678",
        firstName: "Payment",
        lastName: "Test",
    };
    let authToken;
    let userId;
    (0, vitest_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Register and login test user
        const registerResponse = yield (0, supertest_1.default)(app)
            .post("/auth/register")
            .send(testUser);
        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
    }));
    (0, vitest_1.afterEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test user
        const user = (0, storage_1.getUserByEmail)(testUser.email);
        if (user) {
            (0, storage_1.deleteUser)(user.id);
        }
    }));
    (0, vitest_1.describe)("GET /payments/banks", () => {
        (0, vitest_1.it)("should return list of Nigerian banks", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/payments/banks")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toBeInstanceOf(Array);
            (0, vitest_1.expect)(response.body.data.length).toBeGreaterThan(0);
            // Check for common Nigerian banks
            const bankCodes = response.body.data.map((bank) => bank.code);
            (0, vitest_1.expect)(bankCodes).toContain("058"); // GTBank
            (0, vitest_1.expect)(bankCodes).toContain("011"); // First Bank
            (0, vitest_1.expect)(bankCodes).toContain("044"); // Access Bank
        }));
    });
    (0, vitest_1.describe)("POST /payments/verify-account", () => {
        (0, vitest_1.it)("should verify valid account number", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/payments/verify-account")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                account_number: "0123456789",
                bank_code: "058",
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toBeDefined();
        }));
        (0, vitest_1.it)("should reject invalid account number format", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/payments/verify-account")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                account_number: "123",
                bank_code: "058",
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
        (0, vitest_1.it)("should reject missing bank code", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/payments/verify-account")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                account_number: "0123456789",
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
    });
    (0, vitest_1.describe)("POST /wallet/fund", () => {
        (0, vitest_1.it)("should initialize wallet funding", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/fund")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                amount: 10000,
                callback_url: "https://example.com/callback",
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.authorization_url).toBeDefined();
            (0, vitest_1.expect)(response.body.data.reference).toBeDefined();
            (0, vitest_1.expect)(response.body.transaction).toBeDefined();
        }));
        (0, vitest_1.it)("should reject funding below minimum amount", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/fund")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                amount: 50, // Below minimum
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("100");
        }));
        (0, vitest_1.it)("should reject funding above maximum amount", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/fund")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                amount: 2000000, // Above maximum
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
    });
    (0, vitest_1.describe)("Payment Service Unit Tests", () => {
        (0, vitest_1.it)("should check if any payment service is enabled", () => {
            const isEnabled = payments_1.paymentService.isAnyServiceEnabled();
            (0, vitest_1.expect)(typeof isEnabled).toBe("boolean");
        });
        (0, vitest_1.it)("should get fallback banks when APIs are unavailable", () => __awaiter(void 0, void 0, void 0, function* () {
            const banks = yield payments_1.paymentService.getBanks();
            (0, vitest_1.expect)(banks.status).toBe(true);
            (0, vitest_1.expect)(banks.data).toBeInstanceOf(Array);
            (0, vitest_1.expect)(banks.data.length).toBeGreaterThan(0);
        }));
        (0, vitest_1.it)("should handle payment initialization gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield payments_1.paymentService.initializePayment({
                email: "test@example.com",
                amount: 10000,
                currency: "NGN",
                reference: "test_ref",
            });
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.status).toBe(true);
        }));
        (0, vitest_1.it)("should handle payment verification gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield payments_1.paymentService.verifyPayment("demo_ref");
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.status).toBe(true);
        }));
    });
    (0, vitest_1.describe)("Virtual Account Generation", () => {
        (0, vitest_1.it)("should generate valid virtual account", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/payments/virtual-account")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data.account_number).toMatch(/^\d{10}$/);
            (0, vitest_1.expect)(response.body.data.bank_name).toBeDefined();
            (0, vitest_1.expect)(response.body.data.account_name).toBeDefined();
        }));
    });
    (0, vitest_1.describe)("Transfer Functionality", () => {
        (0, vitest_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
            // Add some balance to wallet for transfer tests
            const wallet = (0, storage_1.getUserWallet)(userId);
            if (wallet) {
                wallet.balance = 50000; // Add ₦50,000 for testing
            }
        }));
        (0, vitest_1.it)("should handle bank transfer initiation", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
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
            (0, vitest_1.expect)(response.body.success).toBe(true);
        }));
        (0, vitest_1.it)("should reject transfer with insufficient balance", () => __awaiter(void 0, void 0, void 0, function* () {
            // Set wallet balance to low amount
            const wallet = (0, storage_1.getUserWallet)(userId);
            if (wallet) {
                wallet.balance = 100;
            }
            const response = yield (0, supertest_1.default)(app)
                .post("/payments/bank-transfer")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                amount: 10000,
                account_number: "0123456789",
                bank_code: "058",
                account_name: "Test Recipient",
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("Insufficient");
        }));
    });
    (0, vitest_1.describe)("BVN/NIN Verification", () => {
        (0, vitest_1.it)("should handle BVN verification", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/payments/verify-bvn")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                bvn: "22234567890",
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
        }));
        (0, vitest_1.it)("should reject invalid BVN format", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/payments/verify-bvn")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                bvn: "123", // Invalid format
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
        (0, vitest_1.it)("should handle NIN verification", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/payments/verify-nin")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                nin: "12345678901",
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
        }));
        (0, vitest_1.it)("should reject invalid NIN format", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/payments/verify-nin")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                nin: "123", // Invalid format
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
    });
});
