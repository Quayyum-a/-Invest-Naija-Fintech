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
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const index_1 = require("../index");
const init_1 = require("../data/init");
const app = (0, index_1.createServer)();
(0, globals_1.describe)("Wallet API", () => {
    let authToken;
    let userId;
    (0, globals_1.beforeEach)(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, init_1.initializeApp)();
        // Register and login to get auth token
        const userData = {
            email: "test@example.com",
            password: "TestPass123",
            phone: "+2348012345678",
            firstName: "John",
            lastName: "Doe",
        };
        const registerResponse = yield (0, supertest_1.default)(app)
            .post("/auth/register")
            .send(userData);
        authToken = registerResponse.body.token;
        userId = registerResponse.body.user.id;
    }));
    (0, globals_1.describe)("GET /wallet", () => {
        (0, globals_1.it)("should get user wallet with valid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/wallet")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.wallet).toBeDefined();
            (0, globals_1.expect)(response.body.wallet.balance).toBe(5000); // Initial balance from init
            (0, globals_1.expect)(response.body.wallet.userId).toBe(userId);
        }));
        (0, globals_1.it)("should reject request without authentication", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get("/wallet").expect(401);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Access token required");
        }));
    });
    (0, globals_1.describe)("POST /wallet/fund", () => {
        (0, globals_1.it)("should validate funding amount", () => __awaiter(void 0, void 0, void 0, function* () {
            const fundData = {
                amount: 50, // Below minimum
                provider: "paystack",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/fund")
                .set("Authorization", `Bearer ${authToken}`)
                .send(fundData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should accept valid funding request", () => __awaiter(void 0, void 0, void 0, function* () {
            const fundData = {
                amount: 1000,
                provider: "paystack",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/fund")
                .set("Authorization", `Bearer ${authToken}`)
                .send(fundData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data).toBeDefined();
        }));
        (0, globals_1.it)("should reject funding without authentication", () => __awaiter(void 0, void 0, void 0, function* () {
            const fundData = {
                amount: 1000,
                provider: "paystack",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/fund")
                .send(fundData)
                .expect(401);
            (0, globals_1.expect)(response.body.success).toBe(false);
        }));
    });
    (0, globals_1.describe)("POST /wallet/transfer", () => {
        (0, globals_1.it)("should validate transfer data", () => __awaiter(void 0, void 0, void 0, function* () {
            const transferData = {
                toUserIdentifier: "test@recipient.com",
                amount: 5, // Below minimum
                description: "Test transfer",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/transfer")
                .set("Authorization", `Bearer ${authToken}`)
                .send(transferData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should accept valid transfer data", () => __awaiter(void 0, void 0, void 0, function* () {
            const transferData = {
                toUserIdentifier: "test@recipient.com",
                amount: 100,
                description: "Test transfer",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/transfer")
                .set("Authorization", `Bearer ${authToken}`)
                .send(transferData)
                .expect(400); // Will fail due to recipient not found, but validation passes
            // Should get to business logic, not validation error
            (0, globals_1.expect)(response.body.error).not.toBe("Validation error");
        }));
    });
    (0, globals_1.describe)("POST /wallet/withdraw", () => {
        (0, globals_1.it)("should validate withdrawal data", () => __awaiter(void 0, void 0, void 0, function* () {
            const withdrawData = {
                amount: 500, // Below minimum
                bankDetails: {
                    accountNumber: "123456789", // Invalid length
                    bankCode: "12", // Invalid length
                    accountName: "Test User",
                },
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/withdraw")
                .set("Authorization", `Bearer ${authToken}`)
                .send(withdrawData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should accept valid withdrawal data", () => __awaiter(void 0, void 0, void 0, function* () {
            const withdrawData = {
                amount: 2000,
                bankDetails: {
                    accountNumber: "1234567890",
                    bankCode: "123",
                    accountName: "Test User",
                },
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/withdraw")
                .set("Authorization", `Bearer ${authToken}`)
                .send(withdrawData)
                .expect(400); // Will fail at business logic, but validation passes
            (0, globals_1.expect)(response.body.error).not.toBe("Validation error");
        }));
    });
    (0, globals_1.describe)("POST /wallet/invest", () => {
        (0, globals_1.it)("should validate investment data", () => __awaiter(void 0, void 0, void 0, function* () {
            const investData = {
                amount: 50, // Below minimum
                investmentType: "invalid_type",
                autoReinvest: true,
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/invest")
                .set("Authorization", `Bearer ${authToken}`)
                .send(investData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should accept valid investment data", () => __awaiter(void 0, void 0, void 0, function* () {
            const investData = {
                amount: 1000,
                investmentType: "money_market",
                autoReinvest: false,
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/wallet/invest")
                .set("Authorization", `Bearer ${authToken}`)
                .send(investData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.investment).toBeDefined();
            (0, globals_1.expect)(response.body.transaction).toBeDefined();
        }));
    });
    (0, globals_1.describe)("GET /transactions", () => {
        (0, globals_1.it)("should get user transactions", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/transactions")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.transactions).toBeDefined();
            (0, globals_1.expect)(Array.isArray(response.body.transactions)).toBe(true);
        }));
        (0, globals_1.it)("should respect transaction limit query", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/transactions?limit=5")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.transactions.length).toBeLessThanOrEqual(5);
        }));
    });
    (0, globals_1.describe)("GET /transactions/history", () => {
        (0, globals_1.it)("should get transaction history with filters", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/transactions/history?page=1&limit=10&type=deposit")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.transactions).toBeDefined();
            (0, globals_1.expect)(response.body.pagination).toBeDefined();
        }));
        (0, globals_1.it)("should validate query parameters", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/transactions/history?page=invalid&limit=abc")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
    });
    (0, globals_1.describe)("GET /dashboard", () => {
        (0, globals_1.it)("should get dashboard data", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/dashboard")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data).toBeDefined();
            (0, globals_1.expect)(response.body.data.user).toBeDefined();
            (0, globals_1.expect)(response.body.data.wallet).toBeDefined();
            (0, globals_1.expect)(response.body.data.recentTransactions).toBeDefined();
            (0, globals_1.expect)(response.body.data.investmentGoal).toBeDefined();
        }));
    });
    (0, globals_1.describe)("GET /portfolio", () => {
        (0, globals_1.it)("should get portfolio data", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/portfolio")
                .set("Authorization", `Bearer ${authToken}`)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.data).toBeDefined();
            (0, globals_1.expect)(response.body.data.wallet).toBeDefined();
            (0, globals_1.expect)(response.body.data.investments).toBeDefined();
            (0, globals_1.expect)(response.body.data.performance).toBeDefined();
            (0, globals_1.expect)(response.body.data.allocation).toBeDefined();
        }));
    });
});
