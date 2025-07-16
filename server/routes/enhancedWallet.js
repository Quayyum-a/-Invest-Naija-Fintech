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
exports.getTransactionHistory = exports.withdrawToBank = exports.transferToUser = exports.verifyWalletFunding = exports.initiateWalletFunding = exports.getEnhancedWallet = void 0;
const zod_1 = require("zod");
const storage_1 = require("../data/storage");
const payments_1 = require("../services/payments");
const termiiService_1 = require("../services/termiiService");
// Validation schemas
const fundWalletSchema = zod_1.z.object({
    amount: zod_1.z.number().min(100, "Minimum funding amount is ₦100").max(1000000),
    callback_url: zod_1.z.string().url().optional(),
    payment_method: zod_1.z
        .enum(["paystack", "flutterwave", "bank_transfer"])
        .optional(),
});
const transferSchema = zod_1.z.object({
    recipientEmail: zod_1.z.string().email("Invalid recipient email"),
    amount: zod_1.z.number().min(100, "Minimum transfer amount is ₦100").max(500000),
    narration: zod_1.z.string().max(100).optional(),
    pin: zod_1.z.string().length(4, "Transaction PIN must be 4 digits").optional(),
});
const withdrawSchema = zod_1.z.object({
    amount: zod_1.z.number().min(100, "Minimum withdrawal amount is ₦100").max(500000),
    account_number: zod_1.z.string().length(10, "Account number must be 10 digits"),
    bank_code: zod_1.z.string().min(3, "Invalid bank code"),
    account_name: zod_1.z.string().min(3, "Account name is required"),
    narration: zod_1.z.string().max(100).optional(),
    pin: zod_1.z.string().length(4, "Transaction PIN must be 4 digits").optional(),
});
// Get wallet with enhanced security
const getEnhancedWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Get recent transactions
        const recentTransactions = (0, storage_1.getUserTransactions)(userId, 5);
        // Calculate daily transaction limit used
        const today = new Date().toISOString().split("T")[0];
        const todaysTransactions = (0, storage_1.getUserTransactions)(userId).filter((t) => t.createdAt.startsWith(today) &&
            (t.type === "withdrawal" || t.type === "transfer"));
        const dailyLimitUsed = todaysTransactions.reduce((sum, t) => sum + t.amount, 0);
        res.json({
            success: true,
            wallet: Object.assign(Object.assign({}, wallet), { dailyLimitUsed, dailyLimit: 1000000, availableForWithdrawal: Math.min(wallet.balance, 1000000 - dailyLimitUsed) }),
            recentTransactions,
        });
    }
    catch (error) {
        console.error("Get enhanced wallet error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.getEnhancedWallet = getEnhancedWallet;
// Initiate wallet funding
const initiateWalletFunding = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = fundWalletSchema.parse(req.body);
        const { amount, callback_url, payment_method } = validatedData;
        // Check if wallet funding is within limits
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // KYC limits for unverified users
        if (req.user.kycStatus !== "verified" && wallet.balance + amount > 50000) {
            return res.status(400).json({
                success: false,
                error: "KYC verification required for wallet balance above ₦50,000",
            });
        }
        const reference = `fund_${Date.now()}_${userId.slice(0, 8)}`;
        // Initialize payment
        const paymentResult = yield payments_1.paymentService.initializePayment({
            email: req.user.email,
            amount,
            currency: "NGN",
            reference,
            callback_url: callback_url || `${process.env.FRONTEND_URL}/dashboard`,
            metadata: {
                userId,
                type: "wallet_funding",
                phone: req.user.phone,
            },
        });
        if (paymentResult.status) {
            // Create pending transaction
            const transaction = (0, storage_1.createTransaction)({
                userId,
                type: "deposit",
                amount,
                description: "Wallet funding via " + (payment_method || "payment gateway"),
                status: "pending",
                metadata: {
                    reference,
                    payment_method: payment_method || "auto",
                    authorization_url: (_b = paymentResult.data) === null || _b === void 0 ? void 0 : _b.authorization_url,
                },
            });
            res.json({
                success: true,
                data: {
                    authorization_url: (_c = paymentResult.data) === null || _c === void 0 ? void 0 : _c.authorization_url,
                    reference,
                    amount,
                },
                transaction,
                message: "Payment initialized successfully",
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: "Payment initialization failed",
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
        console.error("Initiate wallet funding error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.initiateWalletFunding = initiateWalletFunding;
// Verify wallet funding
const verifyWalletFunding = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { reference } = req.params;
        // Verify payment
        const verification = yield payments_1.paymentService.verifyPayment(reference);
        if (verification.status && ((_b = verification.data) === null || _b === void 0 ? void 0 : _b.status) === "success") {
            const amount = verification.data.amount / 100; // Convert from kobo
            // Get current wallet
            const wallet = (0, storage_1.getUserWallet)(userId);
            if (!wallet) {
                return res.status(404).json({
                    success: false,
                    error: "Wallet not found",
                });
            }
            // Update transaction status
            const transactions = (0, storage_1.getUserTransactions)(userId).filter((t) => { var _a; return ((_a = t.metadata) === null || _a === void 0 ? void 0 : _a.reference) === reference && t.status === "pending"; });
            if (transactions.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: "Transaction not found",
                });
            }
            const transaction = transactions[0];
            // Update transaction to completed
            const updatedTransaction = (0, storage_1.createTransaction)(Object.assign(Object.assign({}, transaction), { status: "completed", metadata: Object.assign(Object.assign({}, transaction.metadata), { verification_data: verification.data, gateway_response: verification.data.gateway_response }) }));
            // Update wallet balance
            const updatedWallet = (0, storage_1.updateWallet)(userId, {
                balance: wallet.balance + amount,
            });
            // Send SMS notification
            if (req.user.phone) {
                try {
                    yield termiiService_1.termiiService.sendTransactionNotification({
                        to: req.user.phone,
                        amount,
                        type: "credit",
                        balance: updatedWallet.balance,
                        reference,
                    });
                }
                catch (smsError) {
                    console.error("SMS notification failed:", smsError);
                }
            }
            res.json({
                success: true,
                transaction: updatedTransaction,
                wallet: updatedWallet,
                message: `₦${amount.toLocaleString()} has been added to your wallet`,
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: "Payment verification failed",
            });
        }
    }
    catch (error) {
        console.error("Verify wallet funding error:", error);
        res.status(500).json({
            success: false,
            error: "Payment verification failed",
        });
    }
});
exports.verifyWalletFunding = verifyWalletFunding;
// Transfer money to another user
const transferToUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = transferSchema.parse(req.body);
        const { recipientEmail, amount, narration } = validatedData;
        // Check if transferring to self
        if (recipientEmail === req.user.email) {
            return res.status(400).json({
                success: false,
                error: "Cannot transfer to yourself",
            });
        }
        // Get sender wallet
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
        // Find recipient
        const recipient = (0, storage_1.getUser)({ email: recipientEmail });
        if (!recipient) {
            return res.status(404).json({
                success: false,
                error: "Recipient not found",
            });
        }
        // Get recipient wallet
        const recipientWallet = (0, storage_1.getUserWallet)(recipient.id);
        if (!recipientWallet) {
            return res.status(404).json({
                success: false,
                error: "Recipient wallet not found",
            });
        }
        const reference = `transfer_${Date.now()}_${userId.slice(0, 8)}`;
        // Create sender transaction (debit)
        const senderTransaction = (0, storage_1.createTransaction)({
            userId,
            type: "transfer",
            amount: -amount, // Negative for debit
            description: narration || `Transfer to ${recipient.firstName} ${recipient.lastName}`,
            status: "completed",
            metadata: {
                reference,
                recipient_id: recipient.id,
                recipient_email: recipientEmail,
                recipient_name: `${recipient.firstName} ${recipient.lastName}`,
                type: "debit",
            },
        });
        // Create recipient transaction (credit)
        const recipientTransaction = (0, storage_1.createTransaction)({
            userId: recipient.id,
            type: "transfer",
            amount: amount, // Positive for credit
            description: narration || `Transfer from ${req.user.firstName} ${req.user.lastName}`,
            status: "completed",
            metadata: {
                reference,
                sender_id: userId,
                sender_email: req.user.email,
                sender_name: `${req.user.firstName} ${req.user.lastName}`,
                type: "credit",
            },
        });
        // Update both wallets
        const updatedSenderWallet = (0, storage_1.updateWallet)(userId, {
            balance: wallet.balance - amount,
        });
        const updatedRecipientWallet = (0, storage_1.updateWallet)(recipient.id, {
            balance: recipientWallet.balance + amount,
        });
        // Send SMS notifications
        if (req.user.phone) {
            try {
                yield termiiService_1.termiiService.sendTransactionNotification({
                    to: req.user.phone,
                    amount,
                    type: "debit",
                    balance: updatedSenderWallet.balance,
                    reference,
                });
            }
            catch (smsError) {
                console.error("Sender SMS notification failed:", smsError);
            }
        }
        if (recipient.phone) {
            try {
                yield termiiService_1.termiiService.sendTransactionNotification({
                    to: recipient.phone,
                    amount,
                    type: "credit",
                    balance: updatedRecipientWallet.balance,
                    reference,
                });
            }
            catch (smsError) {
                console.error("Recipient SMS notification failed:", smsError);
            }
        }
        res.json({
            success: true,
            transaction: senderTransaction,
            wallet: updatedSenderWallet,
            recipient: {
                name: `${recipient.firstName} ${recipient.lastName}`,
                email: recipient.email,
            },
            message: `₦${amount.toLocaleString()} transferred successfully to ${recipient.firstName} ${recipient.lastName}`,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Transfer to user error:", error);
        res.status(500).json({
            success: false,
            error: "Transfer failed",
        });
    }
});
exports.transferToUser = transferToUser;
// Withdraw to bank account
const withdrawToBank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = withdrawSchema.parse(req.body);
        const { amount, account_number, bank_code, account_name, narration } = validatedData;
        // Check KYC for withdrawals above ₦10,000
        if (amount > 10000 && req.user.kycStatus !== "verified") {
            return res.status(400).json({
                success: false,
                error: "KYC verification required for withdrawals above ₦10,000",
            });
        }
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
        const reference = `withdraw_${Date.now()}_${userId.slice(0, 8)}`;
        try {
            // Verify account first
            yield payments_1.paymentService.verifyAccountNumber(account_number, bank_code);
            // Initiate transfer
            const transferResult = yield payments_1.paymentService.initiateTransfer({
                account_number,
                bank_code,
                account_name,
                amount,
                narration: narration || "Withdrawal from InvestNaija",
                reference,
            });
            if (transferResult.status) {
                // Create transaction
                const transaction = (0, storage_1.createTransaction)({
                    userId,
                    type: "withdrawal",
                    amount: -amount, // Negative for debit
                    description: `Withdrawal to ${account_name} - ${account_number}`,
                    status: "pending",
                    metadata: {
                        reference,
                        account_number,
                        bank_code,
                        account_name,
                        transfer_code: (_b = transferResult.data) === null || _b === void 0 ? void 0 : _b.transfer_code,
                        narration,
                    },
                });
                // Update wallet balance (deduct immediately)
                const updatedWallet = (0, storage_1.updateWallet)(userId, {
                    balance: wallet.balance - amount,
                });
                // Send SMS notification
                if (req.user.phone) {
                    try {
                        yield termiiService_1.termiiService.sendTransactionNotification({
                            to: req.user.phone,
                            amount,
                            type: "debit",
                            balance: updatedWallet.balance,
                            reference,
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
                    message: `Withdrawal of ₦${amount.toLocaleString()} initiated successfully`,
                });
            }
            else {
                res.status(400).json({
                    success: false,
                    error: "Withdrawal initiation failed",
                });
            }
        }
        catch (transferError) {
            console.error("Transfer initiation failed:", transferError);
            res.status(400).json({
                success: false,
                error: transferError.message || "Withdrawal failed",
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
        console.error("Withdraw to bank error:", error);
        res.status(500).json({
            success: false,
            error: "Withdrawal failed",
        });
    }
});
exports.withdrawToBank = withdrawToBank;
// Get transaction history with pagination and filters
const getTransactionHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const type = req.query.type;
        const status = req.query.status;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        let transactions = (0, storage_1.getUserTransactions)(userId);
        // Apply filters
        if (type) {
            transactions = transactions.filter((t) => t.type === type);
        }
        if (status) {
            transactions = transactions.filter((t) => t.status === status);
        }
        if (startDate) {
            transactions = transactions.filter((t) => t.createdAt >= startDate);
        }
        if (endDate) {
            transactions = transactions.filter((t) => t.createdAt <= endDate);
        }
        // Sort by date (newest first)
        transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTransactions = transactions.slice(startIndex, endIndex);
        res.json({
            success: true,
            data: {
                transactions: paginatedTransactions,
                pagination: {
                    page,
                    limit,
                    total: transactions.length,
                    pages: Math.ceil(transactions.length / limit),
                    hasNext: endIndex < transactions.length,
                    hasPrev: page > 1,
                },
            },
        });
    }
    catch (error) {
        console.error("Get transaction history error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.getTransactionHistory = getTransactionHistory;
