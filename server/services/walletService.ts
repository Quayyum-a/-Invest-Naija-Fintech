import {
  getUserWallet,
  updateWallet,
  createTransaction,
  getUserTransactions,
  createNotification,
} from "../data/storage";
import NotificationService from "./notificationService";
import { Server as SocketIOServer } from "socket.io";

export class WalletService {
  private io: SocketIOServer | null = null;
  private notificationService: NotificationService | null = null;

  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  setNotificationService(service: NotificationService) {
    this.notificationService = service;
  }

  private async emitBalanceUpdate(userId: string, wallet: any) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit("balance_update", {
        balance: wallet.balance,
        totalInvested: wallet.totalInvested,
        totalReturns: wallet.totalReturns,
        lastUpdated: wallet.lastUpdated,
      });
    }
  }

  private async notifyTransactionUpdate(
    userId: string,
    transaction: any,
    status: "success" | "failed" | "pending",
  ) {
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
      const title =
        status === "success"
          ? "Transaction Successful"
          : status === "failed"
            ? "Transaction Failed"
            : "Transaction Pending";
      const message = `Your ${transaction.type} of ₦${transaction.amount.toLocaleString()} is ${status}`;

      await this.notificationService.sendNotification({
        userId,
        type: "transaction",
        title,
        message,
        data: { transactionId: transaction.id, amount: transaction.amount },
        channels: ["in_app", "push"],
      });
    }
  }

  async addFunds(
    userId: string,
    amount: number,
    source: "paystack" | "bank_transfer" | "virtual_account",
    reference: string,
    metadata?: any,
  ): Promise<{
    success: boolean;
    wallet?: any;
    transaction?: any;
    error?: string;
  }> {
    try {
      const wallet = getUserWallet(userId);
      if (!wallet) {
        return { success: false, error: "Wallet not found" };
      }

      // Create transaction record
      const transaction = createTransaction({
        userId,
        type: "deposit",
        amount,
        description: `Wallet funding via ${source}`,
        status: "completed",
        metadata: {
          source,
          reference,
          ...metadata,
        },
      });

      // Update wallet balance
      const updatedWallet = updateWallet(userId, {
        balance: wallet.balance + amount,
      });

      // Emit real-time updates
      await this.emitBalanceUpdate(userId, updatedWallet);
      await this.notifyTransactionUpdate(userId, transaction, "success");

      // Create notification
      createNotification({
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
    } catch (error) {
      console.error("Add funds error:", error);
      return { success: false, error: "Failed to add funds" };
    }
  }

  async transferFunds(
    fromUserId: string,
    toUserId: string,
    amount: number,
    description?: string,
    metadata?: any,
  ): Promise<{ success: boolean; error?: string; transaction?: any }> {
    try {
      const fromWallet = getUserWallet(fromUserId);
      const toWallet = getUserWallet(toUserId);

      if (!fromWallet || !toWallet) {
        return { success: false, error: "Wallet not found" };
      }

      if (fromWallet.balance < amount) {
        return { success: false, error: "Insufficient balance" };
      }

      // Create debit transaction for sender
      const debitTransaction = createTransaction({
        userId: fromUserId,
        type: "transfer_out",
        amount: -amount,
        description: description || "Transfer to user",
        status: "completed",
        metadata: { toUserId, ...metadata },
      });

      // Create credit transaction for receiver
      const creditTransaction = createTransaction({
        userId: toUserId,
        type: "transfer_in",
        amount,
        description: description || "Transfer from user",
        status: "completed",
        metadata: { fromUserId, ...metadata },
      });

      // Update balances
      const updatedFromWallet = updateWallet(fromUserId, {
        balance: fromWallet.balance - amount,
      });

      const updatedToWallet = updateWallet(toUserId, {
        balance: toWallet.balance + amount,
      });

      // Emit real-time updates
      await this.emitBalanceUpdate(fromUserId, updatedFromWallet);
      await this.emitBalanceUpdate(toUserId, updatedToWallet);

      // Notify both users
      await this.notifyTransactionUpdate(
        fromUserId,
        debitTransaction,
        "success",
      );
      await this.notifyTransactionUpdate(
        toUserId,
        creditTransaction,
        "success",
      );

      return {
        success: true,
        transaction: debitTransaction,
      };
    } catch (error) {
      console.error("Transfer funds error:", error);
      return { success: false, error: "Transfer failed" };
    }
  }

  async withdrawToBank(
    userId: string,
    amount: number,
    bankDetails: {
      accountNumber: string;
      bankCode: string;
      accountName: string;
    },
    metadata?: any,
  ): Promise<{ success: boolean; error?: string; transaction?: any }> {
    try {
      const wallet = getUserWallet(userId);
      if (!wallet) {
        return { success: false, error: "Wallet not found" };
      }

      if (wallet.balance < amount) {
        return { success: false, error: "Insufficient balance" };
      }

      // Create pending transaction
      const transaction = createTransaction({
        userId,
        type: "bank_withdrawal",
        amount: -amount,
        description: `Withdrawal to ${bankDetails.accountName}`,
        status: "pending",
        metadata: {
          bankDetails,
          ...metadata,
        },
      });

      // Update wallet balance (deduct immediately)
      const updatedWallet = updateWallet(userId, {
        balance: wallet.balance - amount,
      });

      // Emit real-time updates
      await this.emitBalanceUpdate(userId, updatedWallet);
      await this.notifyTransactionUpdate(userId, transaction, "pending");

      // Here you would integrate with Paystack/Flutterwave for actual bank transfer
      // For now, we'll simulate success after 5 seconds
      setTimeout(async () => {
        // In production, this would be a webhook callback
        await this.completeWithdrawal(transaction.id, "success");
      }, 5000);

      return {
        success: true,
        transaction,
      };
    } catch (error) {
      console.error("Bank withdrawal error:", error);
      return { success: false, error: "Withdrawal failed" };
    }
  }

  async completeWithdrawal(
    transactionId: string,
    status: "success" | "failed",
  ): Promise<void> {
    try {
      // Update transaction status
      // Note: We need to add updateTransaction to storage.ts

      // If failed, reverse the wallet deduction
      if (status === "failed") {
        // Implementation needed to reverse wallet balance
      }

      // Notify user of completion
      // Implementation would fetch transaction and notify user
    } catch (error) {
      console.error("Complete withdrawal error:", error);
    }
  }

  async getTransactionHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<{
    success: boolean;
    transactions?: any[];
    pagination?: any;
    error?: string;
  }> {
    try {
      // For now, use basic getUserTransactions
      // In production, implement proper pagination and filtering
      const transactions = getUserTransactions(userId, limit);

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
    } catch (error) {
      console.error("Get transaction history error:", error);
      return { success: false, error: "Failed to fetch transactions" };
    }
  }

  async validateTransfer(
    fromUserId: string,
    toIdentifier: string, // phone number, email, or username
    amount: number,
  ): Promise<{ success: boolean; toUser?: any; error?: string }> {
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
    } catch (error) {
      console.error("Validate transfer error:", error);
      return { success: false, error: "Validation failed" };
    }
  }
}

export const walletService = new WalletService();
