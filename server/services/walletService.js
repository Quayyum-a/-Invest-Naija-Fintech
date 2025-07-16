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
exports.walletService = exports.WalletService = void 0;
const storage_1 = require("../data/storage");
class WalletService {
    constructor() {
        this.io = null;
        this.notificationService = null;
    }
    setSocketIO(io) {
        this.io = io;
    }
    setNotificationService(service) {
        this.notificationService = service;
    }
    emitBalanceUpdate(userId, wallet) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.io) {
                this.io.to(`user-${userId}`).emit("balance_update", {
                    balance: wallet.balance,
                    totalInvested: wallet.totalInvested,
                    totalReturns: wallet.totalReturns,
                    lastUpdated: wallet.lastUpdated,
                });
            }
        });
    }
    notifyTransactionUpdate(userId, transaction, status) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.io) {
                this.io.to(`user-${userId}`).emit("transaction_status", {
                    transactionId: transaction.id,
                    status,
                    amount: transaction.amount,
                    type: transaction.type,
                    description: transaction.description,
                });
            }
            // Send push notification
            if (this.notificationService) {
                const title = status === "success"
                    ? "Transaction Successful"
                    : status === "failed"
                        ? "Transaction Failed"
                        : "Transaction Pending";
                const message = `Your ${transaction.type} of ₦${transaction.amount.toLocaleString()} is ${status}`;
                yield this.notificationService.sendNotification({
                    userId,
                    type: "transaction",
                    title,
                    message,
                    data: { transactionId: transaction.id, amount: transaction.amount },
                    channels: ["in_app", "push"],
                });
            }
        });
    }
    addFunds(userId, amount, source, reference, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const wallet = (0, storage_1.getUserWallet)(userId);
                if (!wallet) {
                    return { success: false, error: "Wallet not found" };
                }
                // Create transaction record
                const transaction = (0, storage_1.createTransaction)({
                    userId,
                    type: "deposit",
                    amount,
                    description: `Wallet funding via ${source}`,
                    status: "completed",
                    metadata: Object.assign({ source,
                        reference }, metadata),
                });
                // Update wallet balance
                const updatedWallet = (0, storage_1.updateWallet)(userId, {
                    balance: wallet.balance + amount,
                });
                // Emit real-time updates
                yield this.emitBalanceUpdate(userId, updatedWallet);
                yield this.notifyTransactionUpdate(userId, transaction, "success");
                // Create notification
                (0, storage_1.createNotification)({
                    userId,
                    title: "Wallet Funded",
                    message: `Your wallet has been credited with ₦${amount.toLocaleString()}`,
                    type: "transaction",
                });
                return {
                    success: true,
                    wallet: updatedWallet,
                    transaction,
                };
            }
            catch (error) {
                console.error("Add funds error:", error);
                return { success: false, error: "Failed to add funds" };
            }
        });
    }
    transferFunds(fromUserId, toUserId, amount, description, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const fromWallet = (0, storage_1.getUserWallet)(fromUserId);
                const toWallet = (0, storage_1.getUserWallet)(toUserId);
                if (!fromWallet || !toWallet) {
                    return { success: false, error: "Wallet not found" };
                }
                if (fromWallet.balance < amount) {
                    return { success: false, error: "Insufficient balance" };
                }
                // Create debit transaction for sender
                const debitTransaction = (0, storage_1.createTransaction)({
                    userId: fromUserId,
                    type: "transfer_out",
                    amount: -amount,
                    description: description || "Transfer to user",
                    status: "completed",
                    metadata: Object.assign({ toUserId }, metadata),
                });
                // Create credit transaction for receiver
                const creditTransaction = (0, storage_1.createTransaction)({
                    userId: toUserId,
                    type: "transfer_in",
                    amount,
                    description: description || "Transfer from user",
                    status: "completed",
                    metadata: Object.assign({ fromUserId }, metadata),
                });
                // Update balances
                const updatedFromWallet = (0, storage_1.updateWallet)(fromUserId, {
                    balance: fromWallet.balance - amount,
                });
                const updatedToWallet = (0, storage_1.updateWallet)(toUserId, {
                    balance: toWallet.balance + amount,
                });
                // Emit real-time updates
                yield this.emitBalanceUpdate(fromUserId, updatedFromWallet);
                yield this.emitBalanceUpdate(toUserId, updatedToWallet);
                // Notify both users
                yield this.notifyTransactionUpdate(fromUserId, debitTransaction, "success");
                yield this.notifyTransactionUpdate(toUserId, creditTransaction, "success");
                return {
                    success: true,
                    transaction: debitTransaction,
                };
            }
            catch (error) {
                console.error("Transfer funds error:", error);
                return { success: false, error: "Transfer failed" };
            }
        });
    }
    withdrawToBank(userId, amount, bankDetails, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const wallet = (0, storage_1.getUserWallet)(userId);
                if (!wallet) {
                    return { success: false, error: "Wallet not found" };
                }
                if (wallet.balance < amount) {
                    return { success: false, error: "Insufficient balance" };
                }
                // Create pending transaction
                const transaction = (0, storage_1.createTransaction)({
                    userId,
                    type: "bank_withdrawal",
                    amount: -amount,
                    description: `Withdrawal to ${bankDetails.accountName}`,
                    status: "pending",
                    metadata: Object.assign({ bankDetails }, metadata),
                });
                // Update wallet balance (deduct immediately)
                const updatedWallet = (0, storage_1.updateWallet)(userId, {
                    balance: wallet.balance - amount,
                });
                // Emit real-time updates
                yield this.emitBalanceUpdate(userId, updatedWallet);
                yield this.notifyTransactionUpdate(userId, transaction, "pending");
                // Here you would integrate with Paystack/Flutterwave for actual bank transfer
                // For now, we'll simulate success after 5 seconds
                setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    // In production, this would be a webhook callback
                    yield this.completeWithdrawal(transaction.id, "success");
                }), 5000);
                return {
                    success: true,
                    transaction,
                };
            }
            catch (error) {
                console.error("Bank withdrawal error:", error);
                return { success: false, error: "Withdrawal failed" };
            }
        });
    }
    completeWithdrawal(transactionId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Update transaction status
                // Note: We need to add updateTransaction to storage.ts
                // If failed, reverse the wallet deduction
                if (status === "failed") {
                    // Implementation needed to reverse wallet balance
                }
                // Notify user of completion
                // Implementation would fetch transaction and notify user
            }
            catch (error) {
                console.error("Complete withdrawal error:", error);
            }
        });
    }
    getTransactionHistory(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20, filters) {
            try {
                // For now, use basic getUserTransactions
                // In production, implement proper pagination and filtering
                const transactions = (0, storage_1.getUserTransactions)(userId, limit);
                return {
                    success: true,
                    transactions,
                    pagination: {
                        page,
                        limit,
                        total: transactions.length,
                        totalPages: Math.ceil(transactions.length / limit),
                    },
                };
            }
            catch (error) {
                console.error("Get transaction history error:", error);
                return { success: false, error: "Failed to fetch transactions" };
            }
        });
    }
    validateTransfer(fromUserId, toIdentifier, // phone number, email, or username
    amount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate amount
                if (amount <= 0) {
                    return { success: false, error: "Invalid amount" };
                }
                // Check minimum transfer amount
                if (amount < 10) {
                    return { success: false, error: "Minimum transfer amount is ₦10" };
                }
                // Check maximum transfer amount for unverified users
                // Implementation would check user KYC status and set limits
                // Find recipient user by phone/email
                // Implementation needed to find user by phone number or email
                return { success: true };
            }
            catch (error) {
                console.error("Validate transfer error:", error);
                return { success: false, error: "Validation failed" };
            }
        });
    }
}
exports.WalletService = WalletService;
exports.walletService = new WalletService();
