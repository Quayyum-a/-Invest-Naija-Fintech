import { beforeAll, afterAll, beforeEach, vi } from "vitest";

// Mock environment variables for testing
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.ENCRYPTION_KEY = "test-encryption-key-for-testing-only";
process.env.DATABASE_URL = ":memory:"; // Use in-memory SQLite for tests

// Mock external API calls
vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        status: true,
        data: [],
      },
    }),
    post: vi.fn().mockResolvedValue({
      data: {
        status: true,
        data: { reference: "test_ref", status: "success" },
      },
    }),
    create: vi.fn().mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: { status: true, data: [] } }),
      post: vi.fn().mockResolvedValue({
        data: { status: true, data: { reference: "test_ref" } },
      }),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    }),
  },
}));

// Mock SMS service
vi.mock("../services/termiiService", () => ({
  termiiService: {
    sendSMSSafe: vi.fn().mockResolvedValue({
      message: "SMS sent successfully (mock)",
      message_id: "mock_123",
    }),
    sendTransactionNotification: vi.fn().mockResolvedValue(true),
    isServiceEnabled: vi.fn().mockReturnValue(false),
  },
}));

// Mock payment services
vi.mock("../services/paystackService", () => ({
  paystackService: {
    initializePayment: vi.fn().mockResolvedValue({
      status: true,
      data: {
        authorization_url: "https://checkout.paystack.com/test",
        reference: "test_ref",
      },
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: true,
      data: { status: "success", amount: 100000, reference: "test_ref" },
    }),
    getBanks: vi.fn().mockResolvedValue({
      status: true,
      data: [
        { code: "058", name: "Guaranty Trust Bank" },
        { code: "011", name: "First Bank of Nigeria" },
      ],
    }),
    verifyAccountNumber: vi.fn().mockResolvedValue({
      status: true,
      data: { account_name: "Test Account", account_number: "0123456789" },
    }),
    isServiceEnabled: vi.fn().mockReturnValue(false),
  },
}));

vi.mock("../services/flutterwaveService", () => ({
  flutterwaveService: {
    initializePayment: vi.fn().mockResolvedValue({
      status: "success",
      data: {
        link: "https://checkout.flutterwave.com/test",
        tx_ref: "test_ref",
      },
    }),
    verifyPayment: vi.fn().mockResolvedValue({
      status: "success",
      data: { status: "successful", amount: 1000, tx_ref: "test_ref" },
    }),
    getBanks: vi.fn().mockResolvedValue({
      status: "success",
      data: [
        { code: "058", name: "Guaranty Trust Bank" },
        { code: "044", name: "Access Bank" },
      ],
    }),
    isServiceEnabled: vi.fn().mockReturnValue(false),
  },
}));

// Mock YouVerify service
vi.mock("../services/youverifyService", () => ({
  youVerifyService: {
    verifyBVNSafe: vi.fn().mockResolvedValue({
      valid: true,
      data: {
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "08012345678",
        dateOfBirth: "1990-01-01",
      },
      message: "BVN verified successfully (mock)",
    }),
    verifyNINSafe: vi.fn().mockResolvedValue({
      valid: true,
      data: {
        firstName: "John",
        lastName: "Doe",
        phoneNumber: "08012345678",
        dateOfBirth: "1990-01-01",
      },
      message: "NIN verified successfully (mock)",
    }),
    isServiceEnabled: vi.fn().mockReturnValue(false),
  },
}));

// Mock WebSocket service
vi.mock("../services/websocketService", () => ({
  webSocketService: {
    initialize: vi.fn(),
    notifyWalletUpdate: vi.fn(),
    notifyTransactionUpdate: vi.fn(),
    isUserConnected: vi.fn().mockReturnValue(false),
    getConnectedUsersCount: vi.fn().mockReturnValue(0),
  },
}));

// Mock security service
vi.mock("../services/securityService", () => ({
  securityService: {
    encrypt: vi.fn().mockReturnValue({
      encrypted: "encrypted_data",
      iv: "iv_string",
      tag: "tag_string",
    }),
    decrypt: vi.fn().mockReturnValue("decrypted_data"),
    hashPassword: vi.fn().mockReturnValue({
      hash: "hashed_password",
      salt: "salt_string",
    }),
    verifyPassword: vi.fn().mockReturnValue(true),
    generateSecureToken: vi.fn().mockReturnValue("secure_token"),
    generateOTP: vi.fn().mockReturnValue("123456"),
    checkRateLimit: vi.fn().mockReturnValue({
      allowed: true,
      resetTime: Date.now() + 60000,
    }),
    analyzeTransactionRisk: vi.fn().mockReturnValue({
      score: 10,
      factors: [],
      action: "allow",
    }),
    logSecurityEvent: vi.fn(),
    maskSensitiveData: vi.fn().mockImplementation((data) => data),
    generateAuditLog: vi.fn(),
  },
}));

// Setup test database
beforeAll(async () => {
  // Initialize test database
  console.log("Setting up test environment...");
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterAll(async () => {
  // Cleanup test database
  console.log("Cleaning up test environment...");
});

// Global test utilities
global.createTestUser = (overrides = {}) => ({
  email: "test@example.com",
  password: "TestPassword123!",
  phone: "08012345678",
  firstName: "Test",
  lastName: "User",
  ...overrides,
});

global.createTestTransaction = (overrides = {}) => ({
  userId: "test_user_id",
  type: "transfer",
  amount: 1000,
  description: "Test transaction",
  status: "completed",
  ...overrides,
});

global.expectValidResponse = (response: any) => {
  expect(response.body).toHaveProperty("success");
  expect(typeof response.body.success).toBe("boolean");
};

global.expectErrorResponse = (response: any, statusCode = 400) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(false);
  expect(response.body).toHaveProperty("error");
  expect(typeof response.body.error).toBe("string");
};

global.expectSuccessResponse = (response: any, statusCode = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
};
