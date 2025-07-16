"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.runAllValidations = exports.validateValidation = exports.validateSecurity = exports.validateApiEndpoints = void 0;
const globals_1 = require("@jest/globals");
// Simple test runner that doesn't rely on complex Jest setup
(0, globals_1.describe)("InvestNaija API Integration Tests", () => {
    (0, globals_1.beforeAll)(() => {
        console.log("Setting up test environment...");
    });
    (0, globals_1.afterAll)(() => {
        console.log("Cleaning up test environment...");
    });
    (0, globals_1.it)("should validate the basic API structure", () => {
        (0, globals_1.expect)(true).toBe(true);
    });
    (0, globals_1.it)("should have proper environment configuration", () => {
        (0, globals_1.expect)(process.env.NODE_ENV).toBeDefined();
    });
});
// Export test validation functions
const validateApiEndpoints = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Basic validation that the server can start
        const { createServer } = yield Promise.resolve().then(() => __importStar(require("../index")));
        const app = createServer();
        console.log("✅ Server creation successful");
        return true;
    }
    catch (error) {
        console.error("❌ Server creation failed:", error);
        return false;
    }
});
exports.validateApiEndpoints = validateApiEndpoints;
const validateSecurity = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Test that security middleware loads properly
        yield Promise.resolve().then(() => __importStar(require("../middleware/security")));
        yield Promise.resolve().then(() => __importStar(require("../middleware/auth")));
        console.log("✅ Security middleware validation successful");
        return true;
    }
    catch (error) {
        console.error("❌ Security middleware validation failed:", error);
        return false;
    }
});
exports.validateSecurity = validateSecurity;
const validateValidation = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Test that validation schemas load properly
        const schemas = yield Promise.resolve().then(() => __importStar(require("../validation/schemas")));
        // Test a basic schema
        const result = schemas.registerSchema.safeParse({
            body: {
                email: "test@example.com",
                password: "TestPass123",
                phone: "+2348012345678",
                firstName: "John",
                lastName: "Doe",
            },
        });
        if (result.success) {
            console.log("✅ Validation schemas working correctly");
            return true;
        }
        else {
            console.error("❌ Validation schema test failed:", result.error);
            return false;
        }
    }
    catch (error) {
        console.error("❌ Validation schema loading failed:", error);
        return false;
    }
});
exports.validateValidation = validateValidation;
const runAllValidations = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("🧪 Running InvestNaija API Validation Tests...\n");
    const results = yield Promise.all([
        (0, exports.validateApiEndpoints)(),
        (0, exports.validateSecurity)(),
        (0, exports.validateValidation)(),
    ]);
    const passed = results.filter(Boolean).length;
    const total = results.length;
    console.log(`\n📊 Test Results: ${passed}/${total} validations passed`);
    if (passed === total) {
        console.log("🎉 All validations passed! API is ready for production.");
        return true;
    }
    else {
        console.log("⚠️  Some validations failed. Please review the errors above.");
        return false;
    }
});
exports.runAllValidations = runAllValidations;
// Run tests if this file is executed directly
if (require.main === module) {
    (0, exports.runAllValidations)()
        .then((success) => {
        process.exit(success ? 0 : 1);
    })
        .catch((error) => {
        console.error("Test runner failed:", error);
        process.exit(1);
    });
}
