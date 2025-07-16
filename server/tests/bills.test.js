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
(0, globals_1.describe)("Bill Payments API", () => {
    let authToken;
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
    }));
    (0, globals_1.describe)("POST /bills/buy-airtime", () => {
        (0, globals_1.it)("should validate airtime purchase data", () => __awaiter(void 0, void 0, void 0, function* () {
            const airtimeData = {
                network: "INVALID_NETWORK",
                phoneNumber: "+1234567890", // Non-Nigerian number
                amount: 20, // Below minimum
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send(airtimeData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should accept valid airtime purchase", () => __awaiter(void 0, void 0, void 0, function* () {
            const airtimeData = {
                network: "MTN",
                phoneNumber: "+2348012345678",
                amount: 100,
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send(airtimeData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.transaction).toBeDefined();
            (0, globals_1.expect)(response.body.wallet).toBeDefined();
        }));
        (0, globals_1.it)("should normalize phone numbers", () => __awaiter(void 0, void 0, void 0, function* () {
            const airtimeData = {
                network: "MTN",
                phoneNumber: "08012345678", // Nigerian format without country code
                amount: 100,
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send(airtimeData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
        }));
        (0, globals_1.it)("should check wallet balance", () => __awaiter(void 0, void 0, void 0, function* () {
            const airtimeData = {
                network: "MTN",
                phoneNumber: "+2348012345678",
                amount: 100000, // Amount higher than initial wallet balance
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/buy-airtime")
                .set("Authorization", `Bearer ${authToken}`)
                .send(airtimeData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Insufficient wallet balance");
        }));
    });
    (0, globals_1.describe)("POST /bills/pay-electricity", () => {
        (0, globals_1.it)("should validate electricity bill data", () => __awaiter(void 0, void 0, void 0, function* () {
            const billData = {
                billerId: "",
                customerCode: "",
                amount: 200, // Below minimum
                meterType: "invalid_type",
                phone: "invalid_phone",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-electricity")
                .set("Authorization", `Bearer ${authToken}`)
                .send(billData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should accept valid electricity bill payment", () => __awaiter(void 0, void 0, void 0, function* () {
            const billData = {
                billerId: "EKEDC_PREPAID",
                customerCode: "1234567890",
                amount: 1000,
                meterType: "prepaid",
                phone: "+2348012345678",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-electricity")
                .set("Authorization", `Bearer ${authToken}`)
                .send(billData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.transaction).toBeDefined();
            (0, globals_1.expect)(response.body.wallet).toBeDefined();
        }));
    });
    (0, globals_1.describe)("POST /bills/pay-cable-tv", () => {
        (0, globals_1.it)("should validate cable TV payment data", () => __awaiter(void 0, void 0, void 0, function* () {
            const cableData = {
                provider: "INVALID_PROVIDER",
                smartCardNumber: "",
                planId: "",
                amount: 50, // Below minimum
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-cable-tv")
                .set("Authorization", `Bearer ${authToken}`)
                .send(cableData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Validation error");
        }));
        (0, globals_1.it)("should accept valid cable TV payment", () => __awaiter(void 0, void 0, void 0, function* () {
            const cableData = {
                provider: "DSTV",
                smartCardNumber: "1234567890",
                planId: "dstv_compact",
                amount: 5000,
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/pay-cable-tv")
                .set("Authorization", `Bearer ${authToken}`)
                .send(cableData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.transaction).toBeDefined();
            (0, globals_1.expect)(response.body.wallet).toBeDefined();
        }));
    });
    (0, globals_1.describe)("GET /bills/billers", () => {
        (0, globals_1.it)("should get available billers", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get("/bills/billers").expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.billers).toBeDefined();
            (0, globals_1.expect)(Array.isArray(response.body.billers)).toBe(true);
        }));
    });
    (0, globals_1.describe)("GET /bills/electricity/companies", () => {
        (0, globals_1.it)("should get electricity companies", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .get("/bills/electricity/companies")
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.companies).toBeDefined();
            (0, globals_1.expect)(Array.isArray(response.body.companies)).toBe(true);
        }));
    });
    (0, globals_1.describe)("POST /bills/validate-customer", () => {
        (0, globals_1.it)("should validate customer information", () => __awaiter(void 0, void 0, void 0, function* () {
            const customerData = {
                billerId: "EKEDC_PREPAID",
                customerCode: "1234567890",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/validate-customer")
                .send(customerData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.customer).toBeDefined();
        }));
        (0, globals_1.it)("should require billerId and customerCode", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/bills/validate-customer")
                .send({})
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Biller ID and customer code are required");
        }));
    });
    (0, globals_1.describe)("GET /transfer/banks", () => {
        (0, globals_1.it)("should get available banks for transfer", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).get("/transfer/banks").expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.banks).toBeDefined();
            (0, globals_1.expect)(Array.isArray(response.body.banks)).toBe(true);
        }));
    });
    (0, globals_1.describe)("POST /transfer/verify-account", () => {
        (0, globals_1.it)("should verify bank account", () => __awaiter(void 0, void 0, void 0, function* () {
            const accountData = {
                accountNumber: "1234567890",
                bankCode: "058",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/transfer/verify-account")
                .send(accountData)
                .expect(200);
            (0, globals_1.expect)(response.body.success).toBe(true);
            (0, globals_1.expect)(response.body.accountName).toBeDefined();
        }));
        (0, globals_1.it)("should require account number and bank code", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app)
                .post("/transfer/verify-account")
                .send({})
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Account number and bank code are required");
        }));
    });
    (0, globals_1.describe)("POST /transfer/initiate", () => {
        (0, globals_1.it)("should validate transfer data", () => __awaiter(void 0, void 0, void 0, function* () {
            const transferData = {
                accountNumber: "123456789", // Invalid length
                bankCode: "05", // Invalid length
                accountName: "",
                amount: 500, // Below minimum
                reason: "",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/transfer/initiate")
                .set("Authorization", `Bearer ${authToken}`)
                .send(transferData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Invalid transfer details");
        }));
        (0, globals_1.it)("should check wallet balance for transfer", () => __awaiter(void 0, void 0, void 0, function* () {
            const transferData = {
                accountNumber: "1234567890",
                bankCode: "058",
                accountName: "Test Recipient",
                amount: 100000, // Higher than wallet balance
                reason: "Test transfer",
            };
            const response = yield (0, supertest_1.default)(app)
                .post("/transfer/initiate")
                .set("Authorization", `Bearer ${authToken}`)
                .send(transferData)
                .expect(400);
            (0, globals_1.expect)(response.body.success).toBe(false);
            (0, globals_1.expect)(response.body.error).toBe("Insufficient wallet balance");
        }));
    });
});
