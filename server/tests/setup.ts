import { beforeAll, beforeEach, afterAll } from "@jest/globals";
import fs from "fs";
import path from "path";

// Test database setup
const testDbPath = path.join(__dirname, "../data/test.db");

beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
  process.env.DATABASE_URL = `file:${testDbPath}`;
});

beforeEach(() => {
  // Clean up test database before each test
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

afterAll(() => {
  // Clean up test database after all tests
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

// Suppress console logs during tests unless explicitly needed
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
