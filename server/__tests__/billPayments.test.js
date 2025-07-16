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
const app = (0, index_1.createServer)();
(0, vitest_1.describe)("Bill Payments", () => {
    const testUser = {
        email: "billpay-test@example.com",
        password: "TestPassword123!",
        phone: "08012345678",
        firstName: "BillPay",
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
        // Add balance to wallet for bill payment tests
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (wallet) {
            wallet.balance = 100000; // Add ₦100,000 for testing
        }
    }));
    (0, vitest_1.afterEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test user
        const user = (0, storage_1.getUserByEmail)(testUser.email);
        if (user) {
            (0, storage_1.deleteUser)(user.id);
        }
    }));
    (0, vitest_1.describe)("GET /bills/billers", () => {
        (0, vitest_1.it)("should return available billers and services", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/bills/billers")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toHaveProperty("airtime");
            (0, vitest_1.expect)(response.body.data).toHaveProperty("data");
            (0, vitest_1.expect)(response.body.data).toHaveProperty("electricity");
            (0, vitest_1.expect)(response.body.data).toHaveProperty("cable_tv");
            // Check airtime providers
            (0, vitest_1.expect)(response.body.data.airtime.providers).toBeInstanceOf(Array);
            const providerCodes = response.body.data.airtime.providers.map((p) => p.code);
            (0, vitest_1.expect)(providerCodes).toContain("mtn");
            (0, vitest_1.expect)(providerCodes).toContain("glo");
            (0, vitest_1.expect)(providerCodes).toContain("airtel");
            (0, vitest_1.expect)(providerCodes).toContain("9mobile");
        }));
    });
    (0, vitest_1.describe)("Airtime Purchase", () => {
        (0, vitest_1.it)("should purchase airtime successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "mtn",
                phone: "08012345678",
                amount: 1000,
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.transaction).toBeDefined();
            (0, vitest_1.expect)(response.body.wallet).toBeDefined();
            (0, vitest_1.expect)(response.body.message).toContain("airtime");
            // Check wallet balance is reduced
            (0, vitest_1.expect)(response.body.wallet.balance).toBe(99000); // 100,000 - 1,000
        }));
        (0, vitest_1.it)("should reject airtime purchase with invalid network", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "invalid",
                phone: "08012345678",
                amount: 1000,
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("network");
        }));
        (0, vitest_1.it)("should reject airtime purchase with invalid phone", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "mtn",
                phone: "123", // Invalid Nigerian number
                amount: 1000,
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("phone");
        }));
        (0, vitest_1.it)("should reject airtime purchase below minimum amount", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "mtn",
                phone: "08012345678",
                amount: 40, // Below minimum
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("50");
        }));
        (0, vitest_1.it)("should reject airtime purchase with insufficient balance", () => __awaiter(void 0, void 0, void 0, function* () {
            // Set wallet balance to low amount
            const wallet = (0, storage_1.getUserWallet)(userId);
            if (wallet) {
                wallet.balance = 500;
            }
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "mtn",
                phone: "08012345678",
                amount: 1000,
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("Insufficient");
        }));
    });
    (0, vitest_1.describe)("Data Bundle Purchase", () => {
        (0, vitest_1.it)("should purchase data bundle successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-data")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "mtn",
                phone: "08012345678",
                data_plan: "1GB",
                amount: 1000,
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.transaction).toBeDefined();
            (0, vitest_1.expect)(response.body.wallet).toBeDefined();
            (0, vitest_1.expect)(response.body.message).toContain("data");
        }));
        (0, vitest_1.it)("should reject data purchase with invalid network", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-data")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "invalid",
                phone: "08012345678",
                data_plan: "1GB",
                amount: 1000,
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
        (0, vitest_1.it)("should reject data purchase with invalid plan", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-data")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "mtn",
                phone: "08012345678",
                data_plan: "invalid_plan",
                amount: 1000,
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
    });
    (0, vitest_1.describe)("Electricity Bill Payment", () => {
        (0, vitest_1.it)("should pay electricity bill successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-electricity")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                disco: "ekedc",
                customer_id: "12345678901234",
                amount: 5000,
                customer_name: "Test Customer",
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.transaction).toBeDefined();
            (0, vitest_1.expect)(response.body.wallet).toBeDefined();
            (0, vitest_1.expect)(response.body.message).toContain("electricity");
        }));
        (0, vitest_1.it)("should reject electricity payment with invalid disco", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-electricity")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                disco: "invalid",
                customer_id: "12345678901234",
                amount: 5000,
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
        (0, vitest_1.it)("should reject electricity payment below minimum amount", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-electricity")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                disco: "ekedc",
                customer_id: "12345678901234",
                amount: 500, // Below minimum
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("1000");
        }));
    });
    (0, vitest_1.describe)("Cable TV Payment", () => {
        (0, vitest_1.it)("should pay cable TV bill successfully", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-cable-tv")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                provider: "dstv",
                customer_id: "1234567890",
                package: "dstv-compact",
                amount: 15700,
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.transaction).toBeDefined();
            (0, vitest_1.expect)(response.body.wallet).toBeDefined();
            (0, vitest_1.expect)(response.body.message).toContain("DSTV");
        }));
        (0, vitest_1.it)("should reject cable TV payment with invalid provider", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-cable-tv")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                provider: "invalid",
                customer_id: "1234567890",
                package: "basic",
                amount: 2000,
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
        (0, vitest_1.it)("should reject cable TV payment below minimum amount", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-cable-tv")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                provider: "gotv",
                customer_id: "1234567890",
                package: "gotv-smallie",
                amount: 500, // Below minimum
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error).toContain("1000");
        }));
    });
    (0, vitest_1.describe)("Customer Validation", () => {
        (0, vitest_1.it)("should validate customer for electricity", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/validate-customer")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                biller_code: "EKEDC",
                customer_id: "12345678901234",
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toBeDefined();
        }));
        (0, vitest_1.it)("should validate customer for cable TV", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/validate-customer")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                biller_code: "DSTV",
                customer_id: "1234567890",
            })
                .expect(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.data).toBeDefined();
        }));
        (0, vitest_1.it)("should reject validation without biller code", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/validate-customer")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                customer_id: "1234567890",
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
        (0, vitest_1.it)("should reject validation without customer ID", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/validate-customer")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                biller_code: "DSTV",
            })
                .expect(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
        }));
    });
    (0, vitest_1.describe)("Bill Payment Transaction Flow", () => {
        (0, vitest_1.it)("should create proper transaction records for airtime", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "mtn",
                phone: "08012345678",
                amount: 2000,
            })
                .expect(200);
            const transaction = response.body.transaction;
            (0, vitest_1.expect)(transaction.type).toBe("bill_payment");
            (0, vitest_1.expect)(transaction.amount).toBe(-2000); // Negative for debit
            (0, vitest_1.expect)(transaction.status).toBe("completed");
            (0, vitest_1.expect)(transaction.description).toContain("MTN");
            (0, vitest_1.expect)(transaction.description).toContain("Airtime");
            (0, vitest_1.expect)(transaction.metadata.network).toBe("mtn");
            (0, vitest_1.expect)(transaction.metadata.phone).toBe("08012345678");
            (0, vitest_1.expect)(transaction.metadata.bill_type).toBe("airtime");
        }));
        (0, vitest_1.it)("should update wallet balance correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            const initialWallet = (0, storage_1.getUserWallet)(userId);
            const initialBalance = (initialWallet === null || initialWallet === void 0 ? void 0 : initialWallet.balance) || 0;
            yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "glo",
                phone: "08012345678",
                amount: 1500,
            })
                .expect(200);
            const updatedWallet = (0, storage_1.getUserWallet)(userId);
            (0, vitest_1.expect)(updatedWallet === null || updatedWallet === void 0 ? void 0 : updatedWallet.balance).toBe(initialBalance - 1500);
        }));
        (0, vitest_1.it)("should handle multiple bill payments correctly", () => __awaiter(void 0, void 0, void 0, function* () {
            // First payment
            yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                network: "mtn",
                phone: "08012345678",
                amount: 1000,
            })
                .expect(200);
            // Second payment
            yield (0, supertest_1.default)(app)
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
            const wallet = (0, storage_1.getUserWallet)(userId);
            (0, vitest_1.expect)(wallet === null || wallet === void 0 ? void 0 : wallet.balance).toBe(97000); // 100,000 - 1,000 - 2,000
        }));
    });
});
