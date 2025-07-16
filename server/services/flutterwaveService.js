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
exports.flutterwaveService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class FlutterwaveService {
    constructor() {
        this.isEnabled = !!env_1.env.FLUTTERWAVE_SECRET_KEY;
        this.client = axios_1.default.create({
            baseURL: "https://api.flutterwave.com/v3",
            headers: {
                Authorization: `Bearer ${env_1.env.FLUTTERWAVE_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 30000,
        });
        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            var _a;
            console.log(`Flutterwave API Request: ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error("Flutterwave request error:", error);
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            var _a;
            console.log(`Flutterwave API Response: ${response.status} - ${((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || "Success"}`);
            return response;
        }, (error) => {
            var _a;
            console.error("Flutterwave API error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw error;
        });
    }
    checkEnabled() {
        if (!this.isEnabled) {
            throw new Error("Flutterwave service is not configured. Please set FLUTTERWAVE_SECRET_KEY environment variable.");
        }
    }
    initializePayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/payments", data);
            return response.data;
        });
    }
    verifyPayment(tx_ref) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get(`/transactions/verify_by_reference?tx_ref=${tx_ref}`);
            return response.data;
        });
    }
    getBanks() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get("/banks/NG");
            return response.data;
        });
    }
    verifyAccountNumber(account_number, account_bank) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/accounts/resolve", {
                account_number,
                account_bank,
            });
            return response.data;
        });
    }
    initiateTransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/transfers", Object.assign(Object.assign({}, data), { currency: data.currency || "NGN" }));
            return response.data;
        });
    }
    // Bill payment methods
    getBillers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get("/bill-categories");
            return response.data;
        });
    }
    validateCustomer(item_code, code, customer) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get(`/bill-items/${item_code}/validate?code=${code}&customer=${customer}`);
            return response.data;
        });
    }
    payBill(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/bills", data);
            return response.data;
        });
    }
    // Airtime purchase
    buyAirtime(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            return this.payBill({
                country: "NG",
                customer: data.phone,
                amount: data.amount,
                type: "AIRTIME",
                reference: data.reference || `airtime_${Date.now()}`,
            });
        });
    }
    // Data bundle purchase
    buyData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            this.checkEnabled();
            // Map data plans to Flutterwave codes
            const dataPlanCodes = {
                MTN: {
                    "1GB": "MTN-1GB-30",
                    "2GB": "MTN-2GB-30",
                    "5GB": "MTN-5GB-30",
                    "10GB": "MTN-10GB-30",
                },
                GLO: {
                    "1GB": "GLO-1GB-30",
                    "2GB": "GLO-2GB-30",
                    "5GB": "GLO-5GB-30",
                    "10GB": "GLO-10GB-30",
                },
                AIRTEL: {
                    "1GB": "AIRTEL-1GB-30",
                    "2GB": "AIRTEL-2GB-30",
                    "5GB": "AIRTEL-5GB-30",
                    "10GB": "AIRTEL-10GB-30",
                },
                "9MOBILE": {
                    "1GB": "9MOBILE-1GB-30",
                    "2GB": "9MOBILE-2GB-30",
                    "5GB": "9MOBILE-5GB-30",
                    "10GB": "9MOBILE-10GB-30",
                },
            };
            const planCode = (_a = dataPlanCodes[data.network]) === null || _a === void 0 ? void 0 : _a[data.data_plan];
            if (!planCode) {
                throw new Error(`Unsupported data plan: ${data.data_plan} for ${data.network}`);
            }
            return this.payBill({
                country: "NG",
                customer: data.phone,
                amount: data.amount,
                type: planCode,
                reference: data.reference || `data_${Date.now()}`,
            });
        });
    }
    // Cable TV payment
    payCableTV(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const providerCodes = {
                DSTV: "DSTV",
                GOTV: "GOTV",
                STARTIMES: "STARTIMES",
            };
            const typeCode = providerCodes[data.provider];
            if (!typeCode) {
                throw new Error(`Unsupported cable provider: ${data.provider}`);
            }
            return this.payBill({
                country: "NG",
                customer: data.customer_id,
                amount: data.amount,
                type: `${typeCode}-${data.package_code}`,
                reference: data.reference || `cable_${Date.now()}`,
            });
        });
    }
    // Electricity bill payment
    payElectricity(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            return this.payBill({
                country: "NG",
                customer: data.customer_id,
                amount: data.amount,
                type: `${data.disco}-PREPAID`,
                reference: data.reference || `electricity_${Date.now()}`,
            });
        });
    }
    // Webhook verification
    verifyWebhook(signature, body) {
        if (!env_1.env.FLUTTERWAVE_WEBHOOK_SECRET) {
            console.warn("Flutterwave webhook secret not configured");
            return false;
        }
        const crypto = require("crypto");
        const hash = crypto
            .createHmac("sha256", env_1.env.FLUTTERWAVE_WEBHOOK_SECRET)
            .update(body)
            .digest("hex");
        return hash === signature;
    }
    // Check if service is enabled
    isServiceEnabled() {
        return this.isEnabled;
    }
}
exports.flutterwaveService = new FlutterwaveService();
exports.default = FlutterwaveService;
