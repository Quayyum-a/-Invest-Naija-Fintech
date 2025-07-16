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
exports.termiiService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class TermiiService {
    constructor() {
        this.isEnabled = !!env_1.env.TERMII_API_KEY;
        this.senderId = env_1.env.TERMII_SENDER_ID || "InvestNaija";
        this.client = axios_1.default.create({
            baseURL: "https://api.ng.termii.com/api",
            headers: {
                "Content-Type": "application/json",
            },
            timeout: 30000,
        });
        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            var _a;
            console.log(`Termii API Request: ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error("Termii request error:", error);
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            var _a;
            console.log(`Termii API Response: ${response.status} - ${((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || "Success"}`);
            return response;
        }, (error) => {
            var _a;
            console.error("Termii API error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw error;
        });
    }
    checkEnabled() {
        if (!this.isEnabled) {
            throw new Error("Termii service is not configured. Please set TERMII_API_KEY environment variable.");
        }
    }
    formatPhoneNumber(phone) {
        // Remove any non-digit characters
        let cleaned = phone.replace(/\D/g, "");
        // Handle Nigerian numbers
        if (cleaned.startsWith("0")) {
            cleaned = "234" + cleaned.substring(1);
        }
        else if (!cleaned.startsWith("234")) {
            cleaned = "234" + cleaned;
        }
        return cleaned;
    }
    sendSMS(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const formattedPhone = this.formatPhoneNumber(data.to);
            const requestData = {
                to: formattedPhone,
                from: this.senderId,
                sms: data.message,
                type: data.type || "plain",
                channel: data.channel || "generic",
                api_key: env_1.env.TERMII_API_KEY,
            };
            const response = yield this.client.post("/sms/send", requestData);
            return response.data;
        });
    }
    sendOTP(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const formattedPhone = this.formatPhoneNumber(data.to);
            const pin_length = data.pin_length || 6;
            const placeholder = "< " + "1234".repeat(pin_length).substring(0, pin_length) + " >";
            const requestData = {
                api_key: env_1.env.TERMII_API_KEY,
                message_type: "NUMERIC",
                to: formattedPhone,
                from: this.senderId,
                channel: data.channel || "generic",
                pin_attempts: data.pin_attempts || 3,
                pin_time_to_live: data.pin_time_to_live || 10, // 10 minutes
                pin_length,
                pin_placeholder: placeholder,
                message_text: data.message ||
                    `Your InvestNaija verification code is ${placeholder}. Valid for ${data.pin_time_to_live || 10} minutes.`,
                pin_type: "NUMERIC",
            };
            const response = yield this.client.post("/sms/otp/send", requestData);
            return response.data;
        });
    }
    verifyOTP(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const requestData = {
                api_key: env_1.env.TERMII_API_KEY,
                pin_id: data.pin_id,
                pin: data.pin,
            };
            const response = yield this.client.post("/sms/otp/verify", requestData);
            return response.data;
        });
    }
    // Get sender ID status
    getSenderIds() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get(`/sender-id?api_key=${env_1.env.TERMII_API_KEY}`);
            return response.data;
        });
    }
    // Get account balance
    getBalance() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get(`/get-balance?api_key=${env_1.env.TERMII_API_KEY}`);
            return response.data;
        });
    }
    // Send transaction notification
    sendTransactionNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.buildTransactionMessage(data);
            return this.sendSMS({
                to: data.to,
                message,
                type: "plain",
                channel: "generic",
            });
        });
    }
    // Send login notification
    sendLoginNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.buildLoginMessage(data);
            return this.sendSMS({
                to: data.to,
                message,
                type: "plain",
                channel: "generic",
            });
        });
    }
    // Send investment notification
    sendInvestmentNotification(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = this.buildInvestmentMessage(data);
            return this.sendSMS({
                to: data.to,
                message,
                type: "plain",
                channel: "generic",
            });
        });
    }
    // Mock SMS for development
    mockSendSMS(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Mock SMS sent:", {
                to: data.to,
                message: data.message,
                timestamp: new Date().toISOString(),
            });
            return {
                message: "SMS sent successfully (mock)",
                message_id: `mock_${Date.now()}`,
                code: "ok",
            };
        });
    }
    // Mock OTP for development
    mockSendOTP(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const mockPinId = `mock_pin_${Date.now()}`;
            console.log("Mock OTP sent:", {
                to: data.to,
                pin_id: mockPinId,
                pin: "123456", // Mock PIN for testing
                timestamp: new Date().toISOString(),
            });
            return {
                message: "OTP sent successfully (mock)",
                pin_id: mockPinId,
                code: "ok",
            };
        });
    }
    // Mock OTP verification for development
    mockVerifyOTP(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("Mock OTP verification:", data);
            // Accept '123456' as valid mock PIN
            const isValid = data.pin === "123456";
            return {
                message: isValid
                    ? "OTP verified successfully (mock)"
                    : "Invalid OTP (mock)",
                verified: isValid,
                code: isValid ? "ok" : "invalid",
            };
        });
    }
    // Helper methods for message building
    buildTransactionMessage(data) {
        const action = data.type === "credit" ? "credited with" : "debited";
        const balanceText = data.balance
            ? ` Balance: ₦${data.balance.toLocaleString()}`
            : "";
        const refText = data.reference ? ` Ref: ${data.reference}` : "";
        return `InvestNaija: Your account has been ${action} ₦${data.amount.toLocaleString()}.${balanceText}${refText}`;
    }
    buildLoginMessage(data) {
        const timeStr = data.time
            ? data.time.toLocaleString()
            : new Date().toLocaleString();
        const deviceStr = data.device ? ` from ${data.device}` : "";
        const locationStr = data.location ? ` in ${data.location}` : "";
        return `InvestNaija: New login detected${deviceStr}${locationStr} at ${timeStr}. If this wasn't you, please secure your account immediately.`;
    }
    buildInvestmentMessage(data) {
        const productStr = data.product ? ` in ${data.product}` : "";
        switch (data.type) {
            case "purchase":
                return `InvestNaija: You've successfully invested ₦${data.amount.toLocaleString()}${productStr}. Thank you for choosing InvestNaija!`;
            case "maturity":
                return `InvestNaija: Your investment${productStr} of ₦${data.amount.toLocaleString()} has matured and been credited to your wallet.`;
            case "withdrawal":
                return `InvestNaija: You've successfully withdrawn ₦${data.amount.toLocaleString()} from your investment${productStr}.`;
            default:
                return `InvestNaija: Investment transaction of ₦${data.amount.toLocaleString()} completed.`;
        }
    }
    // Check if service is enabled
    isServiceEnabled() {
        return this.isEnabled;
    }
    // Use mock or real SMS based on environment
    sendSMSSafe(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isEnabled) {
                return this.sendSMS(data);
            }
            else {
                return this.mockSendSMS(data);
            }
        });
    }
    sendOTPSafe(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isEnabled) {
                return this.sendOTP(data);
            }
            else {
                return this.mockSendOTP(data);
            }
        });
    }
    verifyOTPSafe(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isEnabled) {
                return this.verifyOTP(data);
            }
            else {
                return this.mockVerifyOTP(data);
            }
        });
    }
}
exports.termiiService = new TermiiService();
exports.default = TermiiService;
