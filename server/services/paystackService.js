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
exports.paystackService = void 0;
const axios_1 = __importDefault(require("axios"));
const env_1 = require("../config/env");
class PaystackService {
    constructor() {
        this.isEnabled = !!env_1.env.PAYSTACK_SECRET_KEY;
        this.client = axios_1.default.create({
            baseURL: "https://api.paystack.co",
            headers: {
                Authorization: `Bearer ${env_1.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
            timeout: 30000,
        });
        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            var _a;
            console.log(`Paystack API Request: ${(_a = config.method) === null || _a === void 0 ? void 0 : _a.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error("Paystack request error:", error);
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            var _a;
            console.log(`Paystack API Response: ${response.status} - ${((_a = response.data) === null || _a === void 0 ? void 0 : _a.message) || "Success"}`);
            return response;
        }, (error) => {
            var _a;
            console.error("Paystack API error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw error;
        });
    }
    checkEnabled() {
        if (!this.isEnabled) {
            throw new Error("Paystack service is not configured. Please set PAYSTACK_SECRET_KEY environment variable.");
        }
    }
    initializePayment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/transaction/initialize", Object.assign(Object.assign({}, data), { amount: data.amount * 100 }));
            return response.data;
        });
    }
    verifyPayment(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get(`/transaction/verify/${reference}`);
            return response.data;
        });
    }
    getBanks() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get("/bank?country=nigeria&per_page=100");
            return response.data;
        });
    }
    verifyAccountNumber(account_number, bank_code) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get(`/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`);
            return response.data;
        });
    }
    createTransferRecipient(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/transferrecipient", data);
            return response.data;
        });
    }
    initiateTransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/transfer", Object.assign(Object.assign({}, data), { amount: data.amount * 100 }));
            return response.data;
        });
    }
    verifyBVN(bvn) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get(`/bank/resolve_bvn/${bvn}`);
            return response.data;
        });
    }
    // Bill payment methods
    getBillers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get("/bill/biller");
            return response.data;
        });
    }
    validateCustomer(biller_code, customer_id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.get(`/bill/validate?biller_code=${biller_code}&customer_id=${customer_id}`);
            return response.data;
        });
    }
    payBill(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            const response = yield this.client.post("/bill/pay", Object.assign(Object.assign({}, data), { amount: data.amount * 100 }));
            return response.data;
        });
    }
    // Airtime purchase
    buyAirtime(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            // Map networks to Paystack biller codes
            const networkBillers = {
                mtn: "BIL099",
                glo: "BIL119",
                airtel: "BIL120",
                "9mobile": "BIL121",
            };
            const biller_code = networkBillers[data.network];
            if (!biller_code) {
                throw new Error(`Unsupported network: ${data.network}`);
            }
            return this.payBill({
                biller_code,
                customer_id: data.phone,
                amount: data.amount,
                reference: data.reference,
                metadata: {
                    network: data.network,
                    phone: data.phone,
                    type: "airtime",
                },
            });
        });
    }
    // Data bundle purchase
    buyData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            // Map networks to data biller codes
            const networkDataBillers = {
                mtn: "BIL108",
                glo: "BIL109",
                airtel: "BIL110",
                "9mobile": "BIL111",
            };
            const biller_code = networkDataBillers[data.network];
            if (!biller_code) {
                throw new Error(`Unsupported network for data: ${data.network}`);
            }
            return this.payBill({
                biller_code,
                customer_id: data.phone,
                amount: data.amount,
                reference: data.reference,
                metadata: {
                    network: data.network,
                    phone: data.phone,
                    data_plan: data.data_plan,
                    type: "data",
                },
            });
        });
    }
    // Cable TV payment
    payCableTV(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            // Map providers to biller codes
            const cableBillers = {
                dstv: "BIL112",
                gotv: "BIL113",
                startimes: "BIL114",
                showmax: "BIL115",
            };
            const biller_code = cableBillers[data.provider];
            if (!biller_code) {
                throw new Error(`Unsupported cable provider: ${data.provider}`);
            }
            return this.payBill({
                biller_code,
                customer_id: data.customer_id,
                amount: data.amount,
                reference: data.reference,
                metadata: {
                    provider: data.provider,
                    customer_id: data.customer_id,
                    type: "cable_tv",
                },
            });
        });
    }
    // Electricity bill payment
    payElectricity(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.checkEnabled();
            // Map DISCOs to biller codes
            const discoBillers = {
                aedc: "BIL116", // Abuja Electricity Distribution Company
                ekedc: "BIL117", // Eko Electricity Distribution Company
                ikedc: "BIL118", // Ikeja Electric Distribution Company
                phed: "BIL122", // Port Harcourt Electricity Distribution
                jedc: "BIL123", // Jos Electricity Distribution Company
                kedco: "BIL124", // Kano Electricity Distribution Company
                yola: "BIL125", // Yola Electricity Distribution Company
            };
            const biller_code = discoBillers[data.disco];
            if (!biller_code) {
                throw new Error(`Unsupported electricity distribution company: ${data.disco}`);
            }
            return this.payBill({
                biller_code,
                customer_id: data.customer_id,
                amount: data.amount,
                reference: data.reference,
                metadata: {
                    disco: data.disco,
                    customer_id: data.customer_id,
                    type: "electricity",
                },
            });
        });
    }
    // Webhook verification
    verifyWebhook(signature, body) {
        if (!env_1.env.PAYSTACK_WEBHOOK_SECRET) {
            console.warn("Paystack webhook secret not configured");
            return false;
        }
        const crypto = require("crypto");
        const hash = crypto
            .createHmac("sha512", env_1.env.PAYSTACK_WEBHOOK_SECRET)
            .update(body)
            .digest("hex");
        return hash === signature;
    }
    // Check if service is enabled
    isServiceEnabled() {
        return this.isEnabled;
    }
}
exports.paystackService = new PaystackService();
exports.default = PaystackService;
