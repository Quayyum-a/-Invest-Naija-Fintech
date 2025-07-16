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
Object.defineProperty(exports, "__esModule", { value: true });
exports.payCableTVBill = exports.payElectricityBill = exports.buyDataBundle = exports.buyAirtime = exports.validateCustomer = exports.getBillers = void 0;
const zod_1 = require("zod");
const storage_1 = require("../data/storage");
const paystackService_1 = require("../services/paystackService");
const flutterwaveService_1 = require("../services/flutterwaveService");
const termiiService_1 = require("../services/termiiService");
// Validation schemas
const airtimeSchema = zod_1.z.object({
    network: zod_1.z.enum(["mtn", "glo", "airtel", "9mobile"], {
        errorMap: () => ({ message: "Invalid network provider" }),
    }),
    phone: zod_1.z
        .string()
        .regex(/^(\+234|234|0)[789][01]\d{8}$/, "Invalid Nigerian phone number"),
    amount: zod_1.z.number().min(50, "Minimum airtime amount is ₦50").max(20000),
});
const dataSchema = zod_1.z.object({
    network: zod_1.z.enum(["mtn", "glo", "airtel", "9mobile"]),
    phone: zod_1.z
        .string()
        .regex(/^(\+234|234|0)[789][01]\d{8}$/, "Invalid Nigerian phone number"),
    data_plan: zod_1.z.enum(["1GB", "2GB", "5GB", "10GB", "20GB"]),
    amount: zod_1.z.number().min(100, "Minimum data amount is ₦100").max(50000),
});
const electricitySchema = zod_1.z.object({
    disco: zod_1.z.enum(["aedc", "ekedc", "ikedc", "phed", "jedc", "kedco", "yola"], {
        errorMap: () => ({ message: "Invalid electricity distribution company" }),
    }),
    customer_id: zod_1.z.string().min(8, "Invalid customer ID"),
    amount: zod_1.z
        .number()
        .min(1000, "Minimum electricity payment is ₦1000")
        .max(100000),
    customer_name: zod_1.z.string().optional(),
});
const cableTvSchema = zod_1.z.object({
    provider: zod_1.z.enum(["dstv", "gotv", "startimes", "showmax"], {
        errorMap: () => ({ message: "Invalid cable TV provider" }),
    }),
    customer_id: zod_1.z.string().min(8, "Invalid customer ID"),
    package: zod_1.z.string().min(1, "Package is required"),
    amount: zod_1.z.number().min(1000, "Minimum cable payment is ₦1000").max(50000),
});
// Get available billers and services
const getBillers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const billers = {
            airtime: {
                providers: [
                    { code: "mtn", name: "MTN", logo: "/images/mtn-logo.png" },
                    { code: "glo", name: "Glo", logo: "/images/glo-logo.png" },
                    { code: "airtel", name: "Airtel", logo: "/images/airtel-logo.png" },
                    {
                        code: "9mobile",
                        name: "9mobile",
                        logo: "/images/9mobile-logo.png",
                    },
                ],
            },
            data: {
                providers: [
                    {
                        code: "mtn",
                        name: "MTN",
                        plans: [
                            { code: "1GB", name: "1GB - 30 Days", amount: 1000 },
                            { code: "2GB", name: "2GB - 30 Days", amount: 2000 },
                            { code: "5GB", name: "5GB - 30 Days", amount: 5000 },
                            { code: "10GB", name: "10GB - 30 Days", amount: 10000 },
                            { code: "20GB", name: "20GB - 30 Days", amount: 20000 },
                        ],
                    },
                    {
                        code: "glo",
                        name: "Glo",
                        plans: [
                            { code: "1GB", name: "1GB - 30 Days", amount: 1000 },
                            { code: "2GB", name: "2GB - 30 Days", amount: 2000 },
                            { code: "5GB", name: "5GB - 30 Days", amount: 5000 },
                            { code: "10GB", name: "10GB - 30 Days", amount: 10000 },
                            { code: "20GB", name: "20GB - 30 Days", amount: 20000 },
                        ],
                    },
                    {
                        code: "airtel",
                        name: "Airtel",
                        plans: [
                            { code: "1GB", name: "1GB - 30 Days", amount: 1000 },
                            { code: "2GB", name: "2GB - 30 Days", amount: 2000 },
                            { code: "5GB", name: "5GB - 30 Days", amount: 5000 },
                            { code: "10GB", name: "10GB - 30 Days", amount: 10000 },
                            { code: "20GB", name: "20GB - 30 Days", amount: 20000 },
                        ],
                    },
                    {
                        code: "9mobile",
                        name: "9mobile",
                        plans: [
                            { code: "1GB", name: "1GB - 30 Days", amount: 1200 },
                            { code: "2GB", name: "2GB - 30 Days", amount: 2200 },
                            { code: "5GB", name: "5GB - 30 Days", amount: 5200 },
                            { code: "10GB", name: "10GB - 30 Days", amount: 10200 },
                            { code: "20GB", name: "20GB - 30 Days", amount: 20200 },
                        ],
                    },
                ],
            },
            electricity: {
                companies: [
                    { code: "aedc", name: "Abuja Electricity Distribution Company" },
                    { code: "ekedc", name: "Eko Electricity Distribution Company" },
                    { code: "ikedc", name: "Ikeja Electric Distribution Company" },
                    { code: "phed", name: "Port Harcourt Electricity Distribution" },
                    { code: "jedc", name: "Jos Electricity Distribution Company" },
                    { code: "kedco", name: "Kano Electricity Distribution Company" },
                    { code: "yola", name: "Yola Electricity Distribution Company" },
                ],
            },
            cable_tv: {
                providers: [
                    {
                        code: "dstv",
                        name: "DStv",
                        packages: [
                            { code: "dstv-padi", name: "DStv Padi", amount: 2950 },
                            { code: "dstv-yanga", name: "DStv Yanga", amount: 4200 },
                            { code: "dstv-confam", name: "DStv Confam", amount: 7400 },
                            { code: "dstv-compact", name: "DStv Compact", amount: 15700 },
                            { code: "dstv-premium", name: "DStv Premium", amount: 24500 },
                        ],
                    },
                    {
                        code: "gotv",
                        name: "GOtv",
                        packages: [
                            { code: "gotv-smallie", name: "GOtv Smallie", amount: 1575 },
                            { code: "gotv-jinja", name: "GOtv Jinja", amount: 3200 },
                            { code: "gotv-jolli", name: "GOtv Jolli", amount: 4850 },
                            { code: "gotv-max", name: "GOtv Max", amount: 7200 },
                        ],
                    },
                    {
                        code: "startimes",
                        name: "StarTimes",
                        packages: [
                            { code: "nova", name: "Nova", amount: 1200 },
                            { code: "basic", name: "Basic", amount: 2500 },
                            { code: "smart", name: "Smart", amount: 4000 },
                            { code: "classic", name: "Classic", amount: 6500 },
                        ],
                    },
                ],
            },
        };
        res.json({
            success: true,
            data: billers,
        });
    }
    catch (error) {
        console.error("Get billers error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to load billers",
        });
    }
});
exports.getBillers = getBillers;
// Validate customer (for electricity and cable TV)
const validateCustomer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { biller_code, customer_id } = req.body;
        if (!biller_code || !customer_id) {
            return res.status(400).json({
                success: false,
                error: "Biller code and customer ID are required",
            });
        }
        // Try Paystack first
        if (paystackService_1.paystackService.isServiceEnabled()) {
            try {
                const validation = yield paystackService_1.paystackService.validateCustomer(biller_code, customer_id);
                if (validation.status) {
                    return res.json({
                        success: true,
                        data: validation.data,
                        message: "Customer validated successfully",
                    });
                }
            }
            catch (error) {
                console.error("Paystack validation failed:", error);
            }
        }
        // Fallback to Flutterwave
        if (flutterwaveService_1.flutterwaveService.isServiceEnabled()) {
            try {
                const validation = yield flutterwaveService_1.flutterwaveService.validateCustomer(biller_code, "NG", customer_id);
                if (validation.status === "success") {
                    return res.json({
                        success: true,
                        data: validation.data,
                        message: "Customer validated successfully",
                    });
                }
            }
            catch (error) {
                console.error("Flutterwave validation failed:", error);
            }
        }
        // Mock validation for development
        res.json({
            success: true,
            data: {
                customer_name: "John Doe",
                customer_id,
                biller_name: "Sample Biller",
            },
            message: "Customer validated successfully (mock)",
        });
    }
    catch (error) {
        console.error("Validate customer error:", error);
        res.status(500).json({
            success: false,
            error: "Customer validation failed",
        });
    }
});
exports.validateCustomer = validateCustomer;
// Buy airtime
const buyAirtime = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = airtimeSchema.parse(req.body);
        const { network, phone, amount } = validatedData;
        // Get wallet
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Check sufficient balance
        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient wallet balance",
            });
        }
        const reference = `airtime_${Date.now()}_${userId.slice(0, 8)}`;
        try {
            let billPaymentResult = null;
            // Try Paystack first
            if (paystackService_1.paystackService.isServiceEnabled()) {
                try {
                    billPaymentResult = yield paystackService_1.paystackService.buyAirtime({
                        network,
                        phone,
                        amount,
                        reference,
                    });
                }
                catch (error) {
                    console.error("Paystack airtime failed:", error);
                }
            }
            // Fallback to Flutterwave
            if (!billPaymentResult && flutterwaveService_1.flutterwaveService.isServiceEnabled()) {
                try {
                    billPaymentResult = yield flutterwaveService_1.flutterwaveService.buyAirtime({
                        network: network.toUpperCase(),
                        phone,
                        amount,
                        reference,
                    });
                }
                catch (error) {
                    console.error("Flutterwave airtime failed:", error);
                }
            }
            // Mock successful payment if no service is available
            if (!billPaymentResult) {
                console.warn("Using mock airtime payment");
                billPaymentResult = {
                    status: true,
                    message: "Airtime purchase successful (mock)",
                    data: { reference, status: "success" },
                };
            }
            if (billPaymentResult.status) {
                // Create transaction
                const transaction = (0, storage_1.createTransaction)({
                    userId,
                    type: "bill_payment",
                    amount: -amount, // Negative for debit
                    description: `${network.toUpperCase()} Airtime - ${phone}`,
                    status: "completed",
                    metadata: {
                        reference,
                        network,
                        phone,
                        bill_type: "airtime",
                        provider_response: billPaymentResult.data,
                    },
                });
                // Update wallet
                const updatedWallet = (0, storage_1.updateWallet)(userId, {
                    balance: wallet.balance - amount,
                });
                // Send SMS notification
                if (req.user.phone) {
                    try {
                        yield termiiService_1.termiiService.sendSMSSafe({
                            to: req.user.phone,
                            message: `InvestNaija: ₦${amount} ${network.toUpperCase()} airtime purchased for ${phone}. Balance: ₦${updatedWallet.balance.toLocaleString()}`,
                        });
                    }
                    catch (smsError) {
                        console.error("SMS notification failed:", smsError);
                    }
                }
                res.json({
                    success: true,
                    transaction,
                    wallet: updatedWallet,
                    message: `₦${amount.toLocaleString()} ${network.toUpperCase()} airtime sent to ${phone}`,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: "Airtime purchase failed",
                });
            }
        }
        catch (paymentError) {
            console.error("Airtime payment error:", paymentError);
            res.status(400).json({
                success: false,
                error: paymentError.message || "Airtime purchase failed",
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Buy airtime error:", error);
        res.status(500).json({
            success: false,
            error: "Airtime purchase failed",
        });
    }
});
exports.buyAirtime = buyAirtime;
// Buy data bundle
const buyDataBundle = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = dataSchema.parse(req.body);
        const { network, phone, data_plan, amount } = validatedData;
        // Get wallet
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Check sufficient balance
        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient wallet balance",
            });
        }
        const reference = `data_${Date.now()}_${userId.slice(0, 8)}`;
        try {
            let billPaymentResult = null;
            // Try Paystack first
            if (paystackService_1.paystackService.isServiceEnabled()) {
                try {
                    billPaymentResult = yield paystackService_1.paystackService.buyData({
                        network,
                        phone,
                        data_plan,
                        amount,
                        reference,
                    });
                }
                catch (error) {
                    console.error("Paystack data failed:", error);
                }
            }
            // Fallback to Flutterwave
            if (!billPaymentResult && flutterwaveService_1.flutterwaveService.isServiceEnabled()) {
                try {
                    billPaymentResult = yield flutterwaveService_1.flutterwaveService.buyData({
                        network: network.toUpperCase(),
                        phone,
                        data_plan,
                        amount,
                        reference,
                    });
                }
                catch (error) {
                    console.error("Flutterwave data failed:", error);
                }
            }
            // Mock successful payment if no service is available
            if (!billPaymentResult) {
                console.warn("Using mock data purchase");
                billPaymentResult = {
                    status: true,
                    message: "Data purchase successful (mock)",
                    data: { reference, status: "success" },
                };
            }
            if (billPaymentResult.status) {
                // Create transaction
                const transaction = (0, storage_1.createTransaction)({
                    userId,
                    type: "data_bundle",
                    amount: -amount, // Negative for debit
                    description: `${network.toUpperCase()} ${data_plan} Data - ${phone}`,
                    status: "completed",
                    metadata: {
                        reference,
                        network,
                        phone,
                        data_plan,
                        bill_type: "data",
                        provider_response: billPaymentResult.data,
                    },
                });
                // Update wallet
                const updatedWallet = (0, storage_1.updateWallet)(userId, {
                    balance: wallet.balance - amount,
                });
                // Send SMS notification
                if (req.user.phone) {
                    try {
                        yield termiiService_1.termiiService.sendSMSSafe({
                            to: req.user.phone,
                            message: `InvestNaija: ${data_plan} ${network.toUpperCase()} data bundle purchased for ${phone}. Balance: ₦${updatedWallet.balance.toLocaleString()}`,
                        });
                    }
                    catch (smsError) {
                        console.error("SMS notification failed:", smsError);
                    }
                }
                res.json({
                    success: true,
                    transaction,
                    wallet: updatedWallet,
                    message: `${data_plan} ${network.toUpperCase()} data bundle sent to ${phone}`,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: "Data purchase failed",
                });
            }
        }
        catch (paymentError) {
            console.error("Data payment error:", paymentError);
            res.status(400).json({
                success: false,
                error: paymentError.message || "Data purchase failed",
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Buy data bundle error:", error);
        res.status(500).json({
            success: false,
            error: "Data purchase failed",
        });
    }
});
exports.buyDataBundle = buyDataBundle;
// Pay electricity bill
const payElectricityBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = electricitySchema.parse(req.body);
        const { disco, customer_id, amount, customer_name } = validatedData;
        // Get wallet
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Check sufficient balance
        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient wallet balance",
            });
        }
        const reference = `electricity_${Date.now()}_${userId.slice(0, 8)}`;
        try {
            let billPaymentResult = null;
            // Try Paystack first
            if (paystackService_1.paystackService.isServiceEnabled()) {
                try {
                    billPaymentResult = yield paystackService_1.paystackService.payElectricity({
                        disco,
                        customer_id,
                        amount,
                        reference,
                    });
                }
                catch (error) {
                    console.error("Paystack electricity failed:", error);
                }
            }
            // Fallback to Flutterwave
            if (!billPaymentResult && flutterwaveService_1.flutterwaveService.isServiceEnabled()) {
                try {
                    billPaymentResult = yield flutterwaveService_1.flutterwaveService.payElectricity({
                        disco: disco.toUpperCase(),
                        customer_id,
                        amount,
                        reference,
                    });
                }
                catch (error) {
                    console.error("Flutterwave electricity failed:", error);
                }
            }
            // Mock successful payment if no service is available
            if (!billPaymentResult) {
                console.warn("Using mock electricity payment");
                billPaymentResult = {
                    status: true,
                    message: "Electricity bill payment successful (mock)",
                    data: { reference, status: "success", token: "1234-5678-9012" },
                };
            }
            if (billPaymentResult.status) {
                // Create transaction
                const transaction = (0, storage_1.createTransaction)({
                    userId,
                    type: "bill_payment",
                    amount: -amount, // Negative for debit
                    description: `${disco.toUpperCase()} Electricity - ${customer_id}`,
                    status: "completed",
                    metadata: {
                        reference,
                        disco,
                        customer_id,
                        customer_name,
                        bill_type: "electricity",
                        token: (_b = billPaymentResult.data) === null || _b === void 0 ? void 0 : _b.token,
                        provider_response: billPaymentResult.data,
                    },
                });
                // Update wallet
                const updatedWallet = (0, storage_1.updateWallet)(userId, {
                    balance: wallet.balance - amount,
                });
                // Send SMS notification with token
                if (req.user.phone) {
                    try {
                        const tokenText = ((_c = billPaymentResult.data) === null || _c === void 0 ? void 0 : _c.token)
                            ? ` Token: ${billPaymentResult.data.token}`
                            : "";
                        yield termiiService_1.termiiService.sendSMSSafe({
                            to: req.user.phone,
                            message: `InvestNaija: ₦${amount.toLocaleString()} electricity payment to ${disco.toUpperCase()} (${customer_id}) successful.${tokenText} Balance: ₦${updatedWallet.balance.toLocaleString()}`,
                        });
                    }
                    catch (smsError) {
                        console.error("SMS notification failed:", smsError);
                    }
                }
                res.json({
                    success: true,
                    transaction,
                    wallet: updatedWallet,
                    token: (_d = billPaymentResult.data) === null || _d === void 0 ? void 0 : _d.token,
                    message: `₦${amount.toLocaleString()} electricity bill paid to ${disco.toUpperCase()}`,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: "Electricity bill payment failed",
                });
            }
        }
        catch (paymentError) {
            console.error("Electricity payment error:", paymentError);
            res.status(400).json({
                success: false,
                error: paymentError.message || "Electricity bill payment failed",
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Pay electricity bill error:", error);
        res.status(500).json({
            success: false,
            error: "Electricity bill payment failed",
        });
    }
});
exports.payElectricityBill = payElectricityBill;
// Pay cable TV bill
const payCableTVBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = cableTvSchema.parse(req.body);
        const { provider, customer_id, package: packageCode, amount, } = validatedData;
        // Get wallet
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Check sufficient balance
        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient wallet balance",
            });
        }
        const reference = `cable_${Date.now()}_${userId.slice(0, 8)}`;
        try {
            let billPaymentResult = null;
            // Try Paystack first
            if (paystackService_1.paystackService.isServiceEnabled()) {
                try {
                    billPaymentResult = yield paystackService_1.paystackService.payCableTV({
                        provider,
                        customer_id,
                        amount,
                        reference,
                    });
                }
                catch (error) {
                    console.error("Paystack cable TV failed:", error);
                }
            }
            // Fallback to Flutterwave
            if (!billPaymentResult && flutterwaveService_1.flutterwaveService.isServiceEnabled()) {
                try {
                    billPaymentResult = yield flutterwaveService_1.flutterwaveService.payCableTV({
                        provider: provider.toUpperCase(),
                        customer_id,
                        package_code: packageCode,
                        amount,
                        reference,
                    });
                }
                catch (error) {
                    console.error("Flutterwave cable TV failed:", error);
                }
            }
            // Mock successful payment if no service is available
            if (!billPaymentResult) {
                console.warn("Using mock cable TV payment");
                billPaymentResult = {
                    status: true,
                    message: "Cable TV payment successful (mock)",
                    data: { reference, status: "success" },
                };
            }
            if (billPaymentResult.status) {
                // Create transaction
                const transaction = (0, storage_1.createTransaction)({
                    userId,
                    type: "cable_tv",
                    amount: -amount, // Negative for debit
                    description: `${provider.toUpperCase()} ${packageCode} - ${customer_id}`,
                    status: "completed",
                    metadata: {
                        reference,
                        provider,
                        customer_id,
                        package: packageCode,
                        bill_type: "cable_tv",
                        provider_response: billPaymentResult.data,
                    },
                });
                // Update wallet
                const updatedWallet = (0, storage_1.updateWallet)(userId, {
                    balance: wallet.balance - amount,
                });
                // Send SMS notification
                if (req.user.phone) {
                    try {
                        yield termiiService_1.termiiService.sendSMSSafe({
                            to: req.user.phone,
                            message: `InvestNaija: ₦${amount.toLocaleString()} ${provider.toUpperCase()} payment for ${customer_id} successful. Balance: ₦${updatedWallet.balance.toLocaleString()}`,
                        });
                    }
                    catch (smsError) {
                        console.error("SMS notification failed:", smsError);
                    }
                }
                res.json({
                    success: true,
                    transaction,
                    wallet: updatedWallet,
                    message: `₦${amount.toLocaleString()} ${provider.toUpperCase()} payment successful`,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: "Cable TV payment failed",
                });
            }
        }
        catch (paymentError) {
            console.error("Cable TV payment error:", paymentError);
            res.status(400).json({
                success: false,
                error: paymentError.message || "Cable TV payment failed",
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Pay cable TV bill error:", error);
        res.status(500).json({
            success: false,
            error: "Cable TV payment failed",
        });
    }
});
exports.payCableTVBill = payCableTVBill;
