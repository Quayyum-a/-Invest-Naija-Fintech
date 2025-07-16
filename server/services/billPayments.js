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
exports.bankTransferService = exports.billPaymentService = void 0;
const axios_1 = __importDefault(require("axios"));
// Bill payment service integrating with reliable Nigerian APIs
class BillPaymentService {
    constructor() {
        var _a, _b;
        this.baseUrlPaystack = "https://api.paystack.co";
        this.baseUrlFlutterwave = "https://api.flutterwave.com/v3";
        this.paystackApiKey = process.env.PAYSTACK_SECRET_KEY;
        this.flutterwaveApiKey = process.env.FLUTTERWAVE_SECRET_KEY;
        if (!this.paystackApiKey && !this.flutterwaveApiKey) {
            console.warn("No payment provider API keys configured. Some features may not work.");
        }
        if (process.env.NODE_ENV === "production") {
            if (((_a = this.paystackApiKey) === null || _a === void 0 ? void 0 : _a.includes("test")) ||
                ((_b = this.flutterwaveApiKey) === null || _b === void 0 ? void 0 : _b.includes("TEST"))) {
                throw new Error("Test API keys cannot be used in production");
            }
        }
    }
    // Get available billers (Electricity, Cable TV, Internet, etc.)
    getBillers(category) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Using Flutterwave Bills API
                const response = yield axios_1.default.get(`${this.baseUrlFlutterwave}/bills/categories`, {
                    headers: {
                        Authorization: `Bearer ${this.flutterwaveApiKey}`,
                    },
                });
                return {
                    success: true,
                    data: response.data.data || this.getFallbackBillers(),
                };
            }
            catch (error) {
                console.error("Get billers error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                // Return fallback list of major Nigerian billers
                return {
                    success: true,
                    data: this.getFallbackBillers(),
                };
            }
        });
    }
    // Get electricity distribution companies
    getElectricityCompanies() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.get(`${this.baseUrlFlutterwave}/bills/categories/electricity/billers`, {
                    headers: {
                        Authorization: `Bearer ${this.flutterwaveApiKey}`,
                    },
                });
                return {
                    success: true,
                    data: response.data.data || this.getFallbackElectricityCompanies(),
                };
            }
            catch (error) {
                console.error("Get electricity companies error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                return {
                    success: true,
                    data: this.getFallbackElectricityCompanies(),
                };
            }
        });
    }
    // Validate customer details (meter number, phone number, etc.)
    validateCustomer(billerId, customerCode) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const response = yield axios_1.default.post(`${this.baseUrlFlutterwave}/bills/validate`, {
                    biller_code: billerId,
                    customer: customerCode,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.flutterwaveApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                };
            }
            catch (error) {
                console.error("Validate customer error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                // Return actual error for production
                return {
                    success: false,
                    error: ((_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.message) || "Customer validation failed",
                };
            }
        });
    }
    // Pay electricity bill
    payElectricityBill(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.post(`${this.baseUrlFlutterwave}/bills`, {
                    country: "NG",
                    customer: data.meterNumber,
                    amount: data.amount,
                    type: data.billerId,
                    reference: data.reference,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.flutterwaveApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                    message: "Electricity bill payment successful",
                };
            }
            catch (error) {
                console.error("Pay electricity bill error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error("Electricity bill payment failed");
            }
        });
    }
    // Buy airtime
    buyAirtime(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.post(`${this.baseUrlFlutterwave}/bills`, {
                    country: "NG",
                    customer: data.phoneNumber,
                    amount: data.amount,
                    type: this.getAirtimeCode(data.network),
                    reference: data.reference,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.flutterwaveApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                    message: "Airtime purchase successful",
                };
            }
            catch (error) {
                console.error("Buy airtime error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error("Airtime purchase failed");
            }
        });
    }
    // Buy data bundle
    buyDataBundle(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.post(`${this.baseUrlFlutterwave}/bills`, {
                    country: "NG",
                    customer: data.phoneNumber,
                    amount: data.amount,
                    type: data.planId,
                    reference: data.reference,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.flutterwaveApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                    message: "Data bundle purchase successful",
                };
            }
            catch (error) {
                console.error("Buy data bundle error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error("Data bundle purchase failed");
            }
        });
    }
    // Pay cable TV subscription
    payCableTVBill(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.post(`${this.baseUrlFlutterwave}/bills`, {
                    country: "NG",
                    customer: data.smartCardNumber,
                    amount: data.amount,
                    type: data.planId,
                    reference: data.reference,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.flutterwaveApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                    message: "Cable TV subscription successful",
                };
            }
            catch (error) {
                console.error("Pay cable TV bill error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error("Cable TV payment failed");
            }
        });
    }
    // Helper methods
    getAirtimeCode(network) {
        const networkCodes = {
            mtn: "BIL099",
            glo: "BIL102",
            airtel: "BIL100",
            "9mobile": "BIL103",
        };
        return networkCodes[network.toLowerCase()] || "BIL099";
    }
    getFallbackBillers() {
        return [
            {
                id: "electricity",
                name: "Electricity",
                description: "Pay electricity bills",
                category: "utilities",
            },
            {
                id: "airtime",
                name: "Airtime",
                description: "Buy mobile airtime",
                category: "mobile",
            },
            {
                id: "data",
                name: "Data Bundle",
                description: "Buy mobile data",
                category: "mobile",
            },
            {
                id: "cable",
                name: "Cable TV",
                description: "Pay cable TV subscription",
                category: "entertainment",
            },
            {
                id: "internet",
                name: "Internet",
                description: "Pay internet bills",
                category: "utilities",
            },
        ];
    }
    getFallbackElectricityCompanies() {
        return [
            {
                id: "EKEDC",
                name: "Eko Electricity Distribution Company",
                code: "BIL119",
            },
            { id: "IKEDC", name: "Ikeja Electric", code: "BIL120" },
            {
                id: "AEDC",
                name: "Abuja Electricity Distribution Company",
                code: "BIL121",
            },
            {
                id: "KEDCO",
                name: "Kano Electricity Distribution Company",
                code: "BIL122",
            },
            {
                id: "PHED",
                name: "Port Harcourt Electricity Distribution",
                code: "BIL123",
            },
            {
                id: "BEDC",
                name: "Benin Electricity Distribution Company",
                code: "BIL124",
            },
            {
                id: "EEDC",
                name: "Enugu Electricity Distribution Company",
                code: "BIL125",
            },
            {
                id: "JEDC",
                name: "Jos Electricity Distribution Company",
                code: "BIL126",
            },
        ];
    }
}
// Bank transfer service using reliable Nigerian APIs
class BankTransferService {
    constructor() {
        this.baseUrl = "https://api.paystack.co";
        this.paystackApiKey =
            process.env.PAYSTACK_SECRET_KEY ||
                "sk_test_52dc872013582129d489989e914c772186924031";
    }
    // Get Nigerian banks
    getBanks() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/bank?currency=NGN&country=nigeria`, {
                    headers: {
                        Authorization: `Bearer ${this.paystackApiKey}`,
                    },
                });
                return {
                    success: true,
                    data: response.data.data || this.getFallbackBanks(),
                };
            }
            catch (error) {
                console.error("Get banks error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                return {
                    success: true,
                    data: this.getFallbackBanks(),
                };
            }
        });
    }
    // Verify account number
    verifyAccount(accountNumber, bankCode) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.get(`${this.baseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
                    headers: {
                        Authorization: `Bearer ${this.paystackApiKey}`,
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                };
            }
            catch (error) {
                console.error("Verify account error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error("Account verification failed");
            }
        });
    }
    // Create transfer recipient
    createTransferRecipient(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.post(`${this.baseUrl}/transferrecipient`, {
                    type: "nuban",
                    name: data.accountName,
                    account_number: data.accountNumber,
                    bank_code: data.bankCode,
                    currency: "NGN",
                }, {
                    headers: {
                        Authorization: `Bearer ${this.paystackApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                };
            }
            catch (error) {
                console.error("Create transfer recipient error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error("Failed to create transfer recipient");
            }
        });
    }
    // Initiate transfer
    initiateTransfer(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.post(`${this.baseUrl}/transfer`, {
                    source: "balance",
                    amount: data.amount * 100, // Convert to kobo
                    recipient: data.recipientCode,
                    reason: data.reason || "Transfer",
                    reference: data.reference,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.paystackApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                    message: "Transfer initiated successfully",
                };
            }
            catch (error) {
                console.error("Initiate transfer error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error("Transfer failed");
            }
        });
    }
    // Transfer to OPay (using phone number)
    transferToOPay(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // For OPay transfers, we'd typically use their API
                // For now, using Paystack transfer to OPay account numbers
                const response = yield axios_1.default.post(`${this.baseUrl}/transfer`, {
                    source: "balance",
                    amount: data.amount * 100,
                    recipient: data.phoneNumber, // OPay phone as account
                    reason: data.reason || "OPay Transfer",
                    reference: data.reference,
                }, {
                    headers: {
                        Authorization: `Bearer ${this.paystackApiKey}`,
                        "Content-Type": "application/json",
                    },
                });
                return {
                    success: true,
                    data: response.data.data,
                    message: "OPay transfer successful",
                };
            }
            catch (error) {
                console.error("OPay transfer error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error("OPay transfer failed");
            }
        });
    }
    getFallbackBanks() {
        return [
            { code: "044", name: "Access Bank" },
            { code: "014", name: "Afribank Nigeria Plc" },
            { code: "023", name: "Citibank Nigeria Limited" },
            { code: "050", name: "Ecobank Nigeria Plc" },
            { code: "011", name: "First Bank of Nigeria Limited" },
            { code: "214", name: "First City Monument Bank Limited" },
            { code: "070", name: "Fidelity Bank Plc" },
            { code: "058", name: "Guaranty Trust Bank Plc" },
            { code: "030", name: "Heritage Banking Company Ltd" },
            { code: "082", name: "Keystone Bank Limited" },
            { code: "076", name: "Polaris Bank Limited" },
            { code: "039", name: "Stanbic IBTC Bank Plc" },
            { code: "232", name: "Sterling Bank Plc" },
            { code: "032", name: "Union Bank of Nigeria Plc" },
            { code: "033", name: "United Bank for Africa Plc" },
            { code: "215", name: "Unity Bank Plc" },
            { code: "035", name: "Wema Bank Plc" },
            { code: "057", name: "Zenith Bank Plc" },
            { code: "999992", name: "OPay" },
            { code: "999991", name: "PalmPay" },
            { code: "999993", name: "Moniepoint" },
            { code: "999994", name: "Kuda Bank" },
        ];
    }
}
exports.billPaymentService = new BillPaymentService();
exports.bankTransferService = new BankTransferService();
