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
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.ENCRYPTION_KEY = "test-encryption-key-for-testing-only";
process.env.DATABASE_URL = ":memory:"; // Use in-memory SQLite for tests
// Mock external API calls
vitest_1.vi.mock("axios", () => ({
    default: {
        get: vitest_1.vi.fn().mockResolvedValue({
            data: {
                status: true,
                data: [],
            },
        }),
        post: vitest_1.vi.fn().mockResolvedValue({
            data: {
                status: true,
                data: { reference: "test_ref", status: "success" },
            },
        }),
        create: vitest_1.vi.fn().mockReturnValue({
            get: vitest_1.vi.fn().mockResolvedValue({ data: { status: true, data: [] } }),
            post: vitest_1.vi.fn().mockResolvedValue({
                data: { status: true, data: { reference: "test_ref" } },
            }),
            interceptors: {
                request: { use: vitest_1.vi.fn() },
                response: { use: vitest_1.vi.fn() },
            },
        }),
    },
}));
// Mock SMS service
vitest_1.vi.mock("../services/termiiService", () => ({
    termiiService: {
        sendSMSSafe: vitest_1.vi.fn().mockResolvedValue({
            message: "SMS sent successfully (mock)",
            message_id: "mock_123",
        }),
        sendTransactionNotification: vitest_1.vi.fn().mockResolvedValue(true),
        isServiceEnabled: vitest_1.vi.fn().mockReturnValue(false),
    },
}));
// Mock payment services
vitest_1.vi.mock("../services/paystackService", () => ({
    paystackService: {
        initializePayment: vitest_1.vi.fn().mockResolvedValue({
            status: true,
            data: {
                authorization_url: "https://checkout.paystack.com/test",
                reference: "test_ref",
            },
        }),
        verifyPayment: vitest_1.vi.fn().mockResolvedValue({
            status: true,
            data: { status: "success", amount: 100000, reference: "test_ref" },
        }),
        getBanks: vitest_1.vi.fn().mockResolvedValue({
            status: true,
            data: [
                { code: "058", name: "Guaranty Trust Bank" },
                { code: "011", name: "First Bank of Nigeria" },
            ],
        }),
        verifyAccountNumber: vitest_1.vi.fn().mockResolvedValue({
            status: true,
            data: { account_name: "Test Account", account_number: "0123456789" },
        }),
        isServiceEnabled: vitest_1.vi.fn().mockReturnValue(false),
    },
}));
vitest_1.vi.mock("../services/flutterwaveService", () => ({
    flutterwaveService: {
        initializePayment: vitest_1.vi.fn().mockResolvedValue({
            status: "success",
            data: {
                link: "https://checkout.flutterwave.com/test",
                tx_ref: "test_ref",
            },
        }),
        verifyPayment: vitest_1.vi.fn().mockResolvedValue({
            status: "success",
            data: { status: "successful", amount: 1000, tx_ref: "test_ref" },
        }),
        getBanks: vitest_1.vi.fn().mockResolvedValue({
            status: "success",
            data: [
                { code: "058", name: "Guaranty Trust Bank" },
                { code: "044", name: "Access Bank" },
            ],
        }),
        isServiceEnabled: vitest_1.vi.fn().mockReturnValue(false),
    },
}));
// Mock YouVerify service
vitest_1.vi.mock("../services/youverifyService", () => ({
    youVerifyService: {
        verifyBVNSafe: vitest_1.vi.fn().mockResolvedValue({
            valid: true,
            data: {
                firstName: "John",
                lastName: "Doe",
                phoneNumber: "08012345678",
                dateOfBirth: "1990-01-01",
            },
            message: "BVN verified successfully (mock)",
        }),
        verifyNINSafe: vitest_1.vi.fn().mockResolvedValue({
            valid: true,
            data: {
                firstName: "John",
                lastName: "Doe",
                phoneNumber: "08012345678",
                dateOfBirth: "1990-01-01",
            },
            message: "NIN verified successfully (mock)",
        }),
        isServiceEnabled: vitest_1.vi.fn().mockReturnValue(false),
    },
}));
// Mock WebSocket service
vitest_1.vi.mock("../services/websocketService", () => ({
    webSocketService: {
        initialize: vitest_1.vi.fn(),
        notifyWalletUpdate: vitest_1.vi.fn(),
        notifyTransactionUpdate: vitest_1.vi.fn(),
        isUserConnected: vitest_1.vi.fn().mockReturnValue(false),
        getConnectedUsersCount: vitest_1.vi.fn().mockReturnValue(0),
    },
}));
// Mock security service
vitest_1.vi.mock("../services/securityService", () => ({
    securityService: {
        encrypt: vitest_1.vi.fn().mockReturnValue({
            encrypted: "encrypted_data",
            iv: "iv_string",
            tag: "tag_string",
        }),
        decrypt: vitest_1.vi.fn().mockReturnValue("decrypted_data"),
        hashPassword: vitest_1.vi.fn().mockReturnValue({
            hash: "hashed_password",
            salt: "salt_string",
        }),
        verifyPassword: vitest_1.vi.fn().mockReturnValue(true),
        generateSecureToken: vitest_1.vi.fn().mockReturnValue("secure_token"),
        generateOTP: vitest_1.vi.fn().mockReturnValue("123456"),
        checkRateLimit: vitest_1.vi.fn().mockReturnValue({
            allowed: true,
            resetTime: Date.now() + 60000,
        }),
        analyzeTransactionRisk: vitest_1.vi.fn().mockReturnValue({
            score: 10,
            factors: [],
            action: "allow",
        }),
        logSecurityEvent: vitest_1.vi.fn(),
        maskSensitiveData: vitest_1.vi.fn().mockImplementation((data) => data),
        generateAuditLog: vitest_1.vi.fn(),
    },
}));
// Setup test database
(0, vitest_1.beforeAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    // Initialize test database
    console.log("Setting up test environment...");
}));
(0, vitest_1.beforeEach)(() => {
    // Clear all mocks before each test
    vitest_1.vi.clearAllMocks();
});
(0, vitest_1.afterAll)(() => __awaiter(void 0, void 0, void 0, function* () {
    // Cleanup test database
    console.log("Cleaning up test environment...");
}));
// Global test utilities
global.createTestUser = (overrides = {}) => (Object.assign({ email: "test@example.com", password: "TestPassword123!", phone: "08012345678", firstName: "Test", lastName: "User" }, overrides));
global.createTestTransaction = (overrides = {}) => (Object.assign({ userId: "test_user_id", type: "transfer", amount: 1000, description: "Test transaction", status: "completed" }, overrides));
global.expectValidResponse = (response) => {
    expect(response.body).toHaveProperty("success");
    expect(typeof response.body.success).toBe("boolean");
};
global.expectErrorResponse = (response, statusCode = 400) => {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(false);
    expect(response.body).toHaveProperty("error");
    expect(typeof response.body.error).toBe("string");
};
global.expectSuccessResponse = (response, statusCode = 200) => {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(true);
};
