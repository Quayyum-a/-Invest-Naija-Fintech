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
exports.paymentsService = exports.PaymentsService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = require("crypto");
const env_1 = require("../config/env");
const walletService_1 = require("./walletService");
const storage_1 = require("../data/storage");
class PaymentsService {
    constructor() {
        this.paystackClient = axios_1.default.create({
            baseURL: "https://api.paystack.co",
            headers: {
                Authorization: `Bearer ${env_1.env.PAYSTACK_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        });
        this.flutterwaveClient = axios_1.default.create({
            baseURL: "https://api.flutterwave.com/v3",
            headers: {
                Authorization: `Bearer ${env_1.env.FLUTTERWAVE_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        });
    }
    // Paystack Methods
    initializePaystackPayment(userId, amount, email, callbackUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const reference = `INV_${(0, crypto_1.randomUUID)()}`;
                const payload = {
                    amount: amount * 100, // Paystack uses kobo
                    email,
                    reference,
                    callback_url: callbackUrl || `${env_1.env.FRONTEND_URL}/payment/callback`,
                    metadata: {
                        userId,
                        custom_fields: [
                            {
                                display_name: "User ID",
                                variable_name: "user_id",
                                value: userId,
                            },
                        ],
                    },
                };
                const response = yield this.paystackClient.post("/transaction/initialize", payload);
                if (response.data.status) {
                    // Create pending transaction
                    (0, storage_1.createTransaction)({
                        userId,
                        type: "deposit",
                        amount,
                        description: "Wallet funding via Paystack",
                        status: "pending",
                        metadata: {
                            provider: "paystack",
                            reference,
                            authorization_url: response.data.data.authorization_url,
                        },
                    });
                    return {
                        success: true,
                        data: {
                            authorization_url: response.data.data.authorization_url,
                            access_code: response.data.data.access_code,
                            reference,
                        },
                    };
                }
                return { success: false, error: response.data.message };
            }
            catch (error) {
                console.error("Paystack initialization error:", error);
                return {
                    success: false,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Payment initialization failed",
                };
            }
        });
    }
    verifyPaystackPayment(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield this.paystackClient.get(`/transaction/verify/${reference}`);
                if (response.data.status && response.data.data.status === "success") {
                    const { amount, metadata } = response.data.data;
                    const userId = metadata.userId;
                    const actualAmount = amount / 100; // Convert from kobo
                    // Add funds to wallet
                    const result = yield walletService_1.walletService.addFunds(userId, actualAmount, "paystack", reference, { gateway_response: response.data.data.gateway_response });
                    if (result.success) {
                        // Create success notification
                        (0, storage_1.createNotification)({
                            userId,
                            title: "Payment Successful",
                            message: `Your wallet has been funded with ₦${actualAmount.toLocaleString()}`,
                            type: "transaction",
                            priority: "normal",
                        });
                        return {
                            success: true,
                            data: {
                                amount: actualAmount,
                                reference,
                                status: "success",
                            },
                        };
                    }
                    return { success: false, error: "Failed to update wallet" };
                }
                return {
                    success: false,
                    error: "Payment verification failed",
                };
            }
            catch (error) {
                console.error("Paystack verification error:", error);
                return {
                    success: false,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Payment verification failed",
                };
            }
        });
    }
    // Bank Transfer Methods
    initiateBankTransfer(userId, amount, bankDetails, narration) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const reference = `TRF_${(0, crypto_1.randomUUID)()}`;
                // Use Paystack Transfer API
                const payload = {
                    source: "balance",
                    amount: amount * 100, // Convert to kobo
                    recipient: bankDetails.accountNumber,
                    reason: narration || "Wallet withdrawal",
                    reference,
                };
                // First, create a transfer recipient
                const recipientPayload = {
                    type: "nuban",
                    name: bankDetails.accountName,
                    account_number: bankDetails.accountNumber,
                    bank_code: bankDetails.bankCode,
                    currency: "NGN",
                };
                const recipientResponse = yield this.paystackClient.post("/transferrecipient", recipientPayload);
                if (!recipientResponse.data.status) {
                    return {
                        success: false,
                        error: recipientResponse.data.message,
                    };
                }
                const recipientCode = recipientResponse.data.data.recipient_code;
                // Initiate transfer
                const transferPayload = {
                    source: "balance",
                    amount: amount * 100,
                    recipient: recipientCode,
                    reason: narration || "Wallet withdrawal",
                    reference,
                };
                const transferResponse = yield this.paystackClient.post("/transfer", transferPayload);
                if (transferResponse.data.status) {
                    return {
                        success: true,
                        data: {
                            reference,
                            transfer_code: transferResponse.data.data.transfer_code,
                            status: "pending",
                        },
                    };
                }
                return {
                    success: false,
                    error: transferResponse.data.message,
                };
            }
            catch (error) {
                console.error("Bank transfer error:", error);
                return {
                    success: false,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Bank transfer failed",
                };
            }
        });
    }
    // Bill Payment Methods
    payElectricityBill(userId, billData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // Using Flutterwave Bill Payment API
                const reference = `BILL_${(0, crypto_1.randomUUID)()}`;
                const payload = {
                    country: "NG",
                    customer: billData.customer,
                    amount: billData.amount,
                    type: billData.disco,
                    reference,
                };
                const response = yield this.flutterwaveClient.post("/bills", payload);
                if (response.data.status === "success") {
                    // Deduct from wallet
                    const result = yield walletService_1.walletService.transferFunds(userId, "system", // System account for bill payments
                    billData.amount, `Electricity bill payment - ${billData.disco}`, {
                        provider: "flutterwave",
                        reference,
                        customer: billData.customer,
                        disco: billData.disco,
                    });
                    if (result.success) {
                        (0, storage_1.createNotification)({
                            userId,
                            title: "Bill Payment Successful",
                            message: `Electricity bill of ₦${billData.amount.toLocaleString()} paid successfully`,
                            type: "transaction",
                        });
                        return {
                            success: true,
                            data: {
                                reference,
                                token: response.data.data.token,
                                amount: billData.amount,
                            },
                        };
                    }
                    return { success: false, error: "Failed to deduct from wallet" };
                }
                return {
                    success: false,
                    error: response.data.message,
                };
            }
            catch (error) {
                console.error("Electricity bill payment error:", error);
                return {
                    success: false,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Bill payment failed",
                };
            }
        });
    }
    buyAirtime(userId, airtimeData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const reference = `AIR_${(0, crypto_1.randomUUID)()}`;
                // Map network names to Flutterwave codes
                const networkCodes = {
                    MTN: "MTN",
                    AIRTEL: "AIRTEL",
                    GLO: "GLO",
                    "9MOBILE": "9MOBILE",
                };
                const payload = {
                    country: "NG",
                    customer: airtimeData.phone,
                    amount: airtimeData.amount,
                    type: networkCodes[airtimeData.network],
                    reference,
                };
                const response = yield this.flutterwaveClient.post("/bills", payload);
                if (response.data.status === "success") {
                    // Deduct from wallet
                    const result = yield walletService_1.walletService.transferFunds(userId, "system", airtimeData.amount, `Airtime purchase - ${airtimeData.network}`, {
                        provider: "flutterwave",
                        reference,
                        phone: airtimeData.phone,
                        network: airtimeData.network,
                    });
                    if (result.success) {
                        (0, storage_1.createNotification)({
                            userId,
                            title: "Airtime Purchase Successful",
                            message: `₦${airtimeData.amount.toLocaleString()} airtime sent to ${airtimeData.phone}`,
                            type: "transaction",
                        });
                        return {
                            success: true,
                            data: {
                                reference,
                                phone: airtimeData.phone,
                                amount: airtimeData.amount,
                            },
                        };
                    }
                    return { success: false, error: "Failed to deduct from wallet" };
                }
                return {
                    success: false,
                    error: response.data.message,
                };
            }
            catch (error) {
                console.error("Airtime purchase error:", error);
                return {
                    success: false,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Airtime purchase failed",
                };
            }
        });
    }
    // Virtual Account Methods
    createVirtualAccount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const user = (0, storage_1.getUserById)(userId);
                if (!user) {
                    return { success: false, error: "User not found" };
                }
                // Create virtual account using Paystack
                const payload = {
                    customer: user.email,
                    preferred_bank: "wema-bank", // Default bank
                };
                const response = yield this.paystackClient.post("/dedicated_account", payload);
                if (response.data.status) {
                    return {
                        success: true,
                        data: {
                            account_number: response.data.data.account_number,
                            account_name: response.data.data.account_name,
                            bank_name: response.data.data.bank.name,
                            bank_code: response.data.data.bank.code,
                        },
                    };
                }
                return {
                    success: false,
                    error: response.data.message,
                };
            }
            catch (error) {
                console.error("Virtual account creation error:", error);
                return {
                    success: false,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Virtual account creation failed",
                };
            }
        });
    }
    // Bank Verification Methods
    verifyAccountNumber(accountNumber, bankCode) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield this.paystackClient.get(`/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
                if (response.data.status) {
                    return {
                        success: true,
                        data: {
                            account_number: response.data.data.account_number,
                            account_name: response.data.data.account_name,
                        },
                    };
                }
                return {
                    success: false,
                    error: response.data.message,
                };
            }
            catch (error) {
                console.error("Account verification error:", error);
                return {
                    success: false,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Account verification failed",
                };
            }
        });
    }
    getBanks() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield this.paystackClient.get("/bank");
                if (response.data.status) {
                    return {
                        success: true,
                        data: response.data.data,
                    };
                }
                return {
                    success: false,
                    error: response.data.message,
                };
            }
            catch (error) {
                console.error("Get banks error:", error);
                return {
                    success: false,
                    error: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || "Failed to fetch banks",
                };
            }
        });
    }
}
exports.PaymentsService = PaymentsService;
exports.paymentsService = new PaymentsService();
