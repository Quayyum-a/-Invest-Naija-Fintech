"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Test database setup
const testDbPath = path_1.default.join(__dirname, "../data/test.db");
(0, globals_1.beforeAll)(() => {
    // Set test environment
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
    process.env.DATABASE_URL = `file:${testDbPath}`;
});
(0, globals_1.beforeEach)(() => {
    // Clean up test database before each test
    if (fs_1.default.existsSync(testDbPath)) {
        fs_1.default.unlinkSync(testDbPath);
    }
});
(0, globals_1.afterAll)(() => {
    // Clean up test database after all tests
    if (fs_1.default.existsSync(testDbPath)) {
        fs_1.default.unlinkSync(testDbPath);
    }
});
// Suppress console logs during tests unless explicitly needed
global.console = Object.assign(Object.assign({}, console), { log: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() });
