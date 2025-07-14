import { RequestHandler } from "express";
import { z } from "zod";
import {
  WalletResponse,
  TransactionResponse,
  ErrorResponse,
} from "@shared/api";
import {
  getUserWallet,
  updateWallet,
  createTransaction,
  getUserTransactions,
  getUser,
} from "../data/storage";
import { paymentService } from "../services/payments";
import { termiiService } from "../services/termiiService";

// Validation schemas
const fundWalletSchema = z.object({
  amount: z.number().min(100, "Minimum funding amount is ₦100").max(1000000),
  callback_url: z.string().url().optional(),
  payment_method: z
    .enum(["paystack", "flutterwave", "bank_transfer"])
    .optional(),
});

const transferSchema = z.object({
  recipientEmail: z.string().email("Invalid recipient email"),
  amount: z.number().min(100, "Minimum transfer amount is ₦100").max(500000),
  narration: z.string().max(100).optional(),
  pin: z.string().length(4, "Transaction PIN must be 4 digits").optional(),
});

const withdrawSchema = z.object({
  amount: z.number().min(100, "Minimum withdrawal amount is ₦100").max(500000),
  account_number: z.string().length(10, "Account number must be 10 digits"),
  bank_code: z.string().min(3, "Invalid bank code"),
  account_name: z.string().min(3, "Account name is required"),
  narration: z.string().max(100).optional(),
  pin: z.string().length(4, "Transaction PIN must be 4 digits").optional(),
});

// Get wallet with enhanced security
export const getEnhancedWallet: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const wallet = getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    // Get recent transactions
    const recentTransactions = getUserTransactions(userId, 5);

    // Calculate daily transaction limit used
    const today = new Date().toISOString().split("T")[0];
    const todaysTransactions = getUserTransactions(userId).filter(
      (t) =>
        t.createdAt.startsWith(today) &&
        (t.type === "withdrawal" || t.type === "transfer"),
    );
    const dailyLimitUsed = todaysTransactions.reduce(
      (sum, t) => sum + t.amount,
      0,
    );

    res.json({
      success: true,
      wallet: {
        ...wallet,
        dailyLimitUsed,
        dailyLimit: 1000000, // ₦1M daily limit
        availableForWithdrawal: Math.min(
          wallet.balance,
          1000000 - dailyLimitUsed,
        ),
      },
      recentTransactions,
    });
  } catch (error) {
    console.error("Get enhanced wallet error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Initiate wallet funding
export const initiateWalletFunding: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const validatedData = fundWalletSchema.parse(req.body);
    const { amount, callback_url, payment_method } = validatedData;

    // Check if wallet funding is within limits
    const wallet = getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    // KYC limits for unverified users
    if (req.user.kycStatus !== "verified" && wallet.balance + amount > 50000) {
      return res.status(400).json({
        success: false,
        error: "KYC verification required for wallet balance above ₦50,000",
      } as ErrorResponse);
    }

    const reference = `fund_${Date.now()}_${userId.slice(0, 8)}`;

    // Initialize payment
    const paymentResult = await paymentService.initializePayment({
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
      const transaction = createTransaction({
        userId,
        type: "deposit",
        amount,
        description:
          "Wallet funding via " + (payment_method || "payment gateway"),
        status: "pending",
        metadata: {
          reference,
          payment_method: payment_method || "auto",
          authorization_url: paymentResult.data?.authorization_url,
        },
      });

      res.json({
        success: true,
        data: {
          authorization_url: paymentResult.data?.authorization_url,
          reference,
          amount,
        },
        transaction,
        message: "Payment initialized successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Payment initialization failed",
      } as ErrorResponse);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      } as ErrorResponse);
    }

    console.error("Initiate wallet funding error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Verify wallet funding
export const verifyWalletFunding: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { reference } = req.params;

    // Verify payment
    const verification = await paymentService.verifyPayment(reference);

    if (verification.status && verification.data?.status === "success") {
      const amount = verification.data.amount / 100; // Convert from kobo

      // Get current wallet
      const wallet = getUserWallet(userId);
      if (!wallet) {
        return res.status(404).json({
          success: false,
          error: "Wallet not found",
        } as ErrorResponse);
      }

      // Update transaction status
      const transactions = getUserTransactions(userId).filter(
        (t) => t.metadata?.reference === reference && t.status === "pending",
      );

      if (transactions.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Transaction not found",
        } as ErrorResponse);
      }

      const transaction = transactions[0];

      // Update transaction to completed
      const updatedTransaction = createTransaction({
        ...transaction,
        status: "completed",
        metadata: {
          ...transaction.metadata,
          verification_data: verification.data,
          gateway_response: verification.data.gateway_response,
        },
      });

      // Update wallet balance
      const updatedWallet = updateWallet(userId, {
        balance: wallet.balance + amount,
      });

      // Send SMS notification
      if (req.user.phone) {
        try {
          await termiiService.sendTransactionNotification({
            to: req.user.phone,
            amount,
            type: "credit",
            balance: updatedWallet.balance,
            reference,
          });
        } catch (smsError) {
          console.error("SMS notification failed:", smsError);
        }
      }

      res.json({
        success: true,
        transaction: updatedTransaction,
        wallet: updatedWallet,
        message: `₦${amount.toLocaleString()} has been added to your wallet`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Payment verification failed",
      } as ErrorResponse);
    }
  } catch (error) {
    console.error("Verify wallet funding error:", error);
    res.status(500).json({
      success: false,
      error: "Payment verification failed",
    } as ErrorResponse);
  }
};

// Transfer money to another user
export const transferToUser: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const validatedData = transferSchema.parse(req.body);
    const { recipientEmail, amount, narration } = validatedData;

    // Check if transferring to self
    if (recipientEmail === req.user.email) {
      return res.status(400).json({
        success: false,
        error: "Cannot transfer to yourself",
      } as ErrorResponse);
    }

    // Get sender wallet
    const wallet = getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      } as ErrorResponse);
    }

    // Find recipient
    const recipient = getUser({ email: recipientEmail });
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: "Recipient not found",
      } as ErrorResponse);
    }

    // Get recipient wallet
    const recipientWallet = getUserWallet(recipient.id);
    if (!recipientWallet) {
      return res.status(404).json({
        success: false,
        error: "Recipient wallet not found",
      } as ErrorResponse);
    }

    const reference = `transfer_${Date.now()}_${userId.slice(0, 8)}`;

    // Create sender transaction (debit)
    const senderTransaction = createTransaction({
      userId,
      type: "transfer",
      amount: -amount, // Negative for debit
      description:
        narration || `Transfer to ${recipient.firstName} ${recipient.lastName}`,
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
    const recipientTransaction = createTransaction({
      userId: recipient.id,
      type: "transfer",
      amount: amount, // Positive for credit
      description:
        narration || `Transfer from ${req.user.firstName} ${req.user.lastName}`,
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
    const updatedSenderWallet = updateWallet(userId, {
      balance: wallet.balance - amount,
    });

    const updatedRecipientWallet = updateWallet(recipient.id, {
      balance: recipientWallet.balance + amount,
    });

    // Send SMS notifications
    if (req.user.phone) {
      try {
        await termiiService.sendTransactionNotification({
          to: req.user.phone,
          amount,
          type: "debit",
          balance: updatedSenderWallet.balance,
          reference,
        });
      } catch (smsError) {
        console.error("Sender SMS notification failed:", smsError);
      }
    }

    if (recipient.phone) {
      try {
        await termiiService.sendTransactionNotification({
          to: recipient.phone,
          amount,
          type: "credit",
          balance: updatedRecipientWallet.balance,
          reference,
        });
      } catch (smsError) {
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      } as ErrorResponse);
    }

    console.error("Transfer to user error:", error);
    res.status(500).json({
      success: false,
      error: "Transfer failed",
    } as ErrorResponse);
  }
};

// Withdraw to bank account
export const withdrawToBank: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const validatedData = withdrawSchema.parse(req.body);
    const { amount, account_number, bank_code, account_name, narration } =
      validatedData;

    // Check KYC for withdrawals above ₦10,000
    if (amount > 10000 && req.user.kycStatus !== "verified") {
      return res.status(400).json({
        success: false,
        error: "KYC verification required for withdrawals above ₦10,000",
      } as ErrorResponse);
    }

    // Get wallet
    const wallet = getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      } as ErrorResponse);
    }

    const reference = `withdraw_${Date.now()}_${userId.slice(0, 8)}`;

    try {
      // Verify account first
      await paymentService.verifyAccountNumber(account_number, bank_code);

      // Initiate transfer
      const transferResult = await paymentService.initiateTransfer({
        account_number,
        bank_code,
        account_name,
        amount,
        narration: narration || "Withdrawal from InvestNaija",
        reference,
      });

      if (transferResult.status) {
        // Create transaction
        const transaction = createTransaction({
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
            transfer_code: transferResult.data?.transfer_code,
            narration,
          },
        });

        // Update wallet balance (deduct immediately)
        const updatedWallet = updateWallet(userId, {
          balance: wallet.balance - amount,
        });

        // Send SMS notification
        if (req.user.phone) {
          try {
            await termiiService.sendTransactionNotification({
              to: req.user.phone,
              amount,
              type: "debit",
              balance: updatedWallet.balance,
              reference,
            });
          } catch (smsError) {
            console.error("SMS notification failed:", smsError);
          }
        }

        res.json({
          success: true,
          transaction,
          wallet: updatedWallet,
          message: `Withdrawal of ₦${amount.toLocaleString()} initiated successfully`,
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Withdrawal initiation failed",
        } as ErrorResponse);
      }
    } catch (transferError: any) {
      console.error("Transfer initiation failed:", transferError);
      res.status(400).json({
        success: false,
        error: transferError.message || "Withdrawal failed",
      } as ErrorResponse);
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      } as ErrorResponse);
    }

    console.error("Withdraw to bank error:", error);
    res.status(500).json({
      success: false,
      error: "Withdrawal failed",
    } as ErrorResponse);
  }
};

// Get transaction history with pagination and filters
export const getTransactionHistory: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const status = req.query.status as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    let transactions = getUserTransactions(userId);

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
    transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

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
  } catch (error) {
    console.error("Get transaction history error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};
