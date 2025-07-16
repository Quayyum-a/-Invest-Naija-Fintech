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
exports.youVerifyService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class YouVerifyService {
    constructor() {
        this.isEnabled = !!env_1.env.YOUVERIFY_API_KEY;
        this.client = axios_1.default.create({
            baseURL: env_1.env.YOUVERIFY_BASE_URL || "https://api.youverify.co/v2",
            headers: {
                "Api-Key": env_1.env.YOUVERIFY_API_KEY,
                "Content-Type": "application/json",
            },
            timeout: 30000,
        });
        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            var _a;
            console.log(`YouVerify API Request: ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error("YouVerify request error:", error);
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            var _a;
            console.log(`YouVerify API Response: ${response.status} - ${((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || "Success"}`);
            return response;
        }, (error) => {
            var _a;
            console.error("YouVerify API error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw error;
        });
    }
    checkEnabled() {
        if (!this.isEnabled) {
            throw new Error("YouVerify service is not configured. Please set YOUVERIFY_API_KEY environment variable.");
        }
    }
    verifyBVN(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/api/identity/ng/bvn", Object.assign(Object.assign({}, data), { isSubjectConsent: true }));
            return response.data;
        });
    }
    verifyNIN(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/api/identity/ng/nin", Object.assign(Object.assign({}, data), { isSubjectConsent: true }));
            return response.data;
        });
    }
    // Simplified BVN verification method
    validateBVN(bvn, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                this.checkEnabled();
                const result = yield this.verifyBVN({
                    id: bvn,
                    isSubjectConsent: true,
                    validations: userData ? { data: userData } : undefined,
                });
                if (result.success && result.data) {
                    return {
                        valid: true,
                        data: result.data,
                        message: "BVN verified successfully",
                    };
                }
                else {
                    return {
                        valid: false,
                        message: result.message || "BVN verification failed",
                    };
                }
            }
            catch (error) {
                console.error("BVN validation error:", error);
                // Handle specific error cases
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                    return {
                        valid: false,
                        message: "BVN not found or invalid",
                    };
                }
                if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 400) {
                    return {
                        valid: false,
                        message: "Invalid BVN format",
                    };
                }
                return {
                    valid: false,
                    message: "BVN verification service temporarily unavailable",
                };
            }
        });
    }
    // Simplified NIN verification method
    validateNIN(nin, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                this.checkEnabled();
                const result = yield this.verifyNIN({
                    id: nin,
                    isSubjectConsent: true,
                    validations: userData ? { data: userData } : undefined,
                });
                if (result.success && result.data) {
                    return {
                        valid: true,
                        data: result.data,
                        message: "NIN verified successfully",
                    };
                }
                else {
                    return {
                        valid: false,
                        message: result.message || "NIN verification failed",
                    };
                }
            }
            catch (error) {
                console.error("NIN validation error:", error);
                // Handle specific error cases
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 404) {
                    return {
                        valid: false,
                        message: "NIN not found or invalid",
                    };
                }
                if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) === 400) {
                    return {
                        valid: false,
                        message: "Invalid NIN format",
                    };
                }
                return {
                    valid: false,
                    message: "NIN verification service temporarily unavailable",
                };
            }
        });
    }
    // Get verification status
    getVerificationStatus(requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get(`/api/verification/${requestId}`);
            return response.data;
        });
    }
    // Mock verification for development/testing
    mockBVNVerification(bvn) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Using mock BVN verification for development");
            // Basic BVN format validation (11 digits)
            if (!/^\d{11}$/.test(bvn)) {
                return {
                    valid: false,
                    message: "Invalid BVN format. BVN must be 11 digits.",
                };
            }
            // Mock successful verification
            return {
                valid: true,
                data: {
                    bvn,
                    firstName: "John",
                    lastName: "Doe",
                    dateOfBirth: "1990-01-01",
                    phoneNumber: "08012345678",
                    gender: "Male",
                    nationality: "Nigerian",
                    stateOfOrigin: "Lagos",
                    lgaOfOrigin: "Lagos Island",
                    residentialAddress: "123 Test Street, Lagos",
                    stateOfResidence: "Lagos",
                    lgaOfResidence: "Lagos Island",
                    enrollmentBank: "GTBank",
                    registrationDate: "2010-01-01",
                    watchListed: "NO",
                },
                message: "BVN verified successfully (mock)",
            };
        });
    }
    // Mock NIN verification for development/testing
    mockNINVerification(nin) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Using mock NIN verification for development");
            // Basic NIN format validation (11 digits)
            if (!/^\d{11}$/.test(nin)) {
                return {
                    valid: false,
                    message: "Invalid NIN format. NIN must be 11 digits.",
                };
            }
            // Mock successful verification
            return {
                valid: true,
                data: {
                    nin,
                    firstName: "John",
                    lastName: "Doe",
                    dateOfBirth: "1990-01-01",
                    phoneNumber: "08012345678",
                    gender: "Male",
                    nationality: "Nigerian",
                    stateOfOrigin: "Lagos",
                    lgaOfOrigin: "Lagos Island",
                    residentialAddress: "123 Test Street, Lagos",
                    stateOfResidence: "Lagos",
                    lgaOfResidence: "Lagos Island",
                    religion: "Christianity",
                    maritalStatus: "Single",
                    educationalLevel: "University",
                    employmentStatus: "Employed",
                },
                message: "NIN verified successfully (mock)",
            };
        });
    }
    // Check if service is enabled
    isServiceEnabled() {
        return this.isEnabled;
    }
    // Use mock or real verification based on environment
    verifyBVNSafe(bvn, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isEnabled) {
                return this.validateBVN(bvn, userData);
            }
            else {
                return this.mockBVNVerification(bvn);
            }
        });
    }
    verifyNINSafe(nin, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isEnabled) {
                return this.validateNIN(nin, userData);
            }
            else {
                return this.mockNINVerification(nin);
            }
        });
    }
}
exports.youVerifyService = new YouVerifyService();
exports.default = YouVerifyService;
