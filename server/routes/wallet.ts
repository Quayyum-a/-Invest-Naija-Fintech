import { RequestHandler } from "express";
import {
  WalletResponse,
  TransactionRequest,
  TransactionResponse,
  DashboardData,
  PortfolioData,
  ErrorResponse,
} from "@shared/api";
import {
  getUserWalletAsync as getUserWallet,
  updateWalletAsync as updateWallet,
  createTransactionAsync as createTransaction,
  getUserTransactionsAsync as getUserTransactions,
  getUserInvestmentsAsync as getUserInvestments,
  createInvestmentAsync as createInvestment,
  updateTransactionAsync as updateTransaction,
} from "../data/storage";
import { walletService } from "../services/walletService";
import { paymentsService } from "../services/paymentsService";
import {
  fundWalletSchema,
  transferSchema,
  withdrawSchema,
  transactionHistorySchema,
  investmentSchema,
  validateSchema,
} from "../validation/schemas";
import {
  validateRecipient,
  getUserDisplayName,
  canReceiveMoney,
} from "../data/userLookup";

export const getWallet: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    res.json({
      success: true,
      wallet,
    } as WalletResponse);
  } catch (error) {
    console.error("Get wallet error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const processDeposit: RequestHandler = (req, res) => {
  try {
    res.status(400).json({
      success: false,
      error:
        "Manual deposits are not allowed. Please use Paystack, bank transfer, or virtual account funding.",
    } as ErrorResponse);
  } catch (error) {
    console.error("Process deposit error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const withdrawMoney: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const {
      amount,
      description = "Wallet withdrawal",
      metadata,
    }: TransactionRequest = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
      } as ErrorResponse);
    }

    // Get current wallet
    const wallet = await getUserWallet(userId);
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
        error: "Insufficient balance",
      } as ErrorResponse);
    }

    // Create transaction record
    const transaction = await createTransaction({
      userId,
      type: "withdrawal",
      amount,
      description,
      status: "completed",
      metadata,
    });

    // Update wallet balance
    const updatedWallet = await updateWallet(userId, {
      balance: wallet.balance - amount,
    });

    res.json({
      success: true,
      transaction,
      wallet: updatedWallet,
      message: "Withdrawal successful",
    });
  } catch (error) {
    console.error("Withdraw money error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const investMoney: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const {
      amount,
      investmentType = "money_market",
      description,
    }: {
      amount: number;
      investmentType: "money_market" | "treasury_bills" | "fixed_deposit";
      description?: string;
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount",
      } as ErrorResponse);
    }

    // Investment type validation
    const validTypes = ["money_market", "treasury_bills", "fixed_deposit"];
    if (!validTypes.includes(investmentType)) {
      return res.status(400).json({
        success: false,
        error: "Invalid investment type",
      } as ErrorResponse);
    }

    // Minimum investment amounts by type
    const minimumAmounts = {
      money_market: 100,
      treasury_bills: 1000,
      fixed_deposit: 5000,
    };

    if (amount < minimumAmounts[investmentType]) {
      return res.status(400).json({
        success: false,
        error: `Minimum investment for ${investmentType.replace("_", " ")} is ₦${minimumAmounts[investmentType]}`,
      } as ErrorResponse);
    }

    // Check user KYC status for larger investments
    if (amount > 50000 && req.user.kycStatus !== "verified") {
      return res.status(400).json({
        success: false,
        error: "KYC verification required for investments above ₦50,000",
      } as ErrorResponse);
    }

    // Get current wallet
    const wallet = await getUserWallet(userId);
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
        error: "Insufficient wallet balance. Please fund your wallet first.",
      } as ErrorResponse);
    }

    // Calculate expected returns (annualized)
    const returnRates = {
      money_market: 0.125, // 12.5%
      treasury_bills: 0.152, // 15.2%
      fixed_deposit: 0.1, // 10%
    };

    const expectedAnnualReturn = amount * returnRates[investmentType];

    // Create investment record
    const investment = await createInvestment({
      userId,
      type: investmentType,
      amount,
      status: "active",
    });

    // Create transaction record
    const transaction = await createTransaction({
      userId,
      type: "investment",
      amount,
      description:
        description || `Investment in ${investmentType.replace("_", " ")}`,
      status: "completed",
      metadata: {
        investmentId: investment.id,
        investmentType,
        expectedAnnualReturn,
        returnRate: returnRates[investmentType],
      },
    });

    // Update wallet balances
    const updatedWallet = await updateWallet(userId, {
      balance: wallet.balance - amount,
      totalInvested: wallet.totalInvested + amount,
    });

    res.json({
      success: true,
      transaction,
      investment,
      wallet: updatedWallet,
      expectedReturn: expectedAnnualReturn,
      message: `Successfully invested ₦${amount.toLocaleString()} in ${investmentType.replace("_", " ")}`,
    });
  } catch (error) {
    console.error("Invest money error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const getTransactions: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const limit = req.query.limit
      ? parseInt(req.query.limit as string)
      : undefined;
    const transactions = await getUserTransactions(userId, limit);

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const getDashboardData: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const wallet = await getUserWallet(userId);
    const recentTransactions = await getUserTransactions(userId, 5);
    const recentInvestments = (await getUserInvestments(userId)).slice(0, 3);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    // Calculate investment goal (example: ₦10,000 monthly)
    const monthlyGoal = 10000;
    const currentMonthInvestments = recentInvestments
      .filter((inv) => {
        const investmentDate = new Date(inv.createdAt);
        const now = new Date();
        return (
          investmentDate.getMonth() === now.getMonth() &&
          investmentDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Calculate streak (days with investments in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentInvestmentDays = recentInvestments
      .filter((inv) => new Date(inv.createdAt) >= thirtyDaysAgo)
      .map((inv) => new Date(inv.createdAt).toDateString());

    const uniqueDays = new Set(recentInvestmentDays);
    const streak = uniqueDays.size;

    const dashboardData: DashboardData = {
      user: req.user,
      wallet,
      recentTransactions,
      recentInvestments,
      investmentGoal: {
        target: monthlyGoal,
        current: currentMonthInvestments,
        percentage: (currentMonthInvestments / monthlyGoal) * 100,
      },
      streak,
    };

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Get dashboard data error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const getPortfolioData: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const wallet = await getUserWallet(userId);
    const investments = await getUserInvestments(userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    // Calculate performance based on actual user data
    const performance = {
      sevenDays: 0, // Real calculation needed based on 7-day investment performance
      thirtyDays: 0, // Real calculation needed based on 30-day investment performance
      allTime:
        wallet.totalInvested > 0
          ? (wallet.totalReturns / wallet.totalInvested) * 100
          : 0,
    };

    // Calculate allocation
    const moneyMarketAmount = investments
      .filter((inv) => inv.type === "money_market" && inv.status === "active")
      .reduce((sum, inv) => sum + inv.currentValue, 0);

    const treasuryBillsAmount = investments
      .filter((inv) => inv.type === "treasury_bills" && inv.status === "active")
      .reduce((sum, inv) => sum + inv.currentValue, 0);

    const totalActive = moneyMarketAmount + treasuryBillsAmount;

    const allocation = {
      moneyMarket:
        totalActive > 0 ? (moneyMarketAmount / totalActive) * 100 : 0,
      treasuryBills:
        totalActive > 0 ? (treasuryBillsAmount / totalActive) * 100 : 0,
    };

    const portfolioData: PortfolioData = {
      wallet,
      investments,
      performance,
      allocation,
    };

    res.json({
      success: true,
      data: portfolioData,
    });
  } catch (error) {
    console.error("Get portfolio data error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Enhanced wallet endpoints with real-time features

export const initiateWalletFunding: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userId || !userEmail) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { amount, provider = "paystack" } = req.body;

    const result = await paymentsService.initializePaystackPayment(
      userId,
      amount,
      userEmail,
    );

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: "Payment initialization successful",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Initiate wallet funding error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const verifyWalletFunding: RequestHandler = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        error: "Payment reference is required",
      });
    }

    const result = await paymentsService.verifyPaystackPayment(reference);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: "Payment verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Verify wallet funding error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const transferToUser: RequestHandler = async (req, res) => {
  try {
    const fromUserId = req.user?.id;
    if (!fromUserId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { toUserIdentifier, amount, description } = req.body;

    // Validate and find recipient
    const recipientValidation = validateRecipient(toUserIdentifier);

    if (!recipientValidation.valid) {
      return res.status(400).json({
        success: false,
        error: recipientValidation.error,
      });
    }

    const recipient = recipientValidation.user!;

    // Check if recipient can receive this amount
    const canReceive = canReceiveMoney(recipient, amount);
    if (!canReceive.canReceive) {
      return res.status(400).json({
        success: false,
        error: canReceive.reason,
      });
    }

    // Prevent self-transfers
    if (recipient.id === fromUserId) {
      return res.status(400).json({
        success: false,
        error: "You cannot transfer money to yourself",
      });
    }

    const toUserId = recipient.id;

    const result = await walletService.transferFunds(
      fromUserId,
      toUserId,
      amount,
      description,
    );

    if (result.success) {
      res.json({
        success: true,
        transaction: result.transaction,
        message: "Transfer successful",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Transfer to user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const withdrawToBank: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const { amount, bankDetails } = req.body;

    const result = await walletService.withdrawToBank(
      userId,
      amount,
      bankDetails,
    );

    if (result.success) {
      res.json({
        success: true,
        transaction: result.transaction,
        message: "Withdrawal initiated successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Withdraw to bank error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getTransactionHistory: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const filters = {
      type: req.query.type as string,
      status: req.query.status as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    };

    const result = await walletService.getTransactionHistory(
      userId,
      page,
      limit,
      filters,
    );

    if (result.success) {
      res.json({
        success: true,
        transactions: result.transactions,
        pagination: result.pagination,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Get transaction history error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
