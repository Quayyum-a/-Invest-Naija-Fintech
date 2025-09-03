import { ErrorResponse } from "@shared/api";
import {
  getUserWalletAsync as getUserWallet,
  updateWalletAsync as updateWallet,
  createTransactionAsync as createTransaction,
  createInvestmentAsync as createInvestment,
  getUserByIdAsync as getUserById,
} from "../data/storage";

// Round-up settings storage (use database in production)
const roundupSettings = new Map<
  string,
  {
    enabled: boolean;
    roundupMethod: "nearest_50" | "nearest_100" | "nearest_500";
    autoInvestThreshold: number;
    targetInvestmentType: "money_market" | "treasury_bills";
    maxDailyRoundup: number;
  }
>();

// Get user's round-up settings
export const getRoundupSettings: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const settings = roundupSettings.get(userId) || {
      enabled: false,
      roundupMethod: "nearest_100" as const,
      autoInvestThreshold: 1000,
      targetInvestmentType: "money_market" as const,
      maxDailyRoundup: 5000,
    };

    res.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Get roundup settings error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Update round-up settings
export const updateRoundupSettings: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const {
      enabled,
      roundupMethod,
      autoInvestThreshold,
      targetInvestmentType,
      maxDailyRoundup,
    } = req.body;

    // Validation
    const validMethods = ["nearest_50", "nearest_100", "nearest_500"];
    const validInvestmentTypes = ["money_market", "treasury_bills"];

    if (roundupMethod && !validMethods.includes(roundupMethod)) {
      return res.status(400).json({
        success: false,
        error: "Invalid roundup method",
      } as ErrorResponse);
    }

    if (
      targetInvestmentType &&
      !validInvestmentTypes.includes(targetInvestmentType)
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid investment type",
      } as ErrorResponse);
    }

    if (
      autoInvestThreshold &&
      (autoInvestThreshold < 100 || autoInvestThreshold > 50000)
    ) {
      return res.status(400).json({
        success: false,
        error: "Auto-invest threshold must be between ₦100 and ₦50,000",
      } as ErrorResponse);
    }

    const currentSettings = roundupSettings.get(userId) || {} as any;
    const newSettings = {
      ...currentSettings,
      ...(enabled !== undefined && { enabled }),
      ...(roundupMethod && { roundupMethod }),
      ...(autoInvestThreshold && { autoInvestThreshold }),
      ...(targetInvestmentType && { targetInvestmentType }),
      ...(maxDailyRoundup && { maxDailyRoundup }),
    } as any;

    roundupSettings.set(userId, newSettings);

    res.json({
      success: true,
      settings: newSettings,
      message: "Round-up settings updated successfully",
    });
  } catch (error) {
    console.error("Update roundup settings error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Calculate round-up amount
const calculateRoundup = (amount: number, method: string): number => {
  switch (method) {
    case "nearest_50":
      return Math.ceil(amount / 50) * 50 - amount;
    case "nearest_100":
      return Math.ceil(amount / 100) * 100 - amount;
    case "nearest_500":
      return Math.ceil(amount / 500) * 500 - amount;
    default:
      return Math.ceil(amount / 100) * 100 - amount;
  }
};

// Process round-up for a transaction
export const processRoundup: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { transactionAmount, description = "Purchase" } = req.body;

    if (!transactionAmount || transactionAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid transaction amount",
      } as ErrorResponse);
    }

    // Get user's round-up settings
    const settings = roundupSettings.get(userId);
    if (!settings || !settings.enabled) {
      return res.json({
        success: true,
        message: "Round-up is disabled",
        roundupAmount: 0,
      });
    }

    // Calculate round-up amount
    const roundupAmount = calculateRoundup(
      transactionAmount,
      settings.roundupMethod,
    );

    if (roundupAmount === 0) {
      return res.json({
        success: true,
        message: "No round-up needed",
        roundupAmount: 0,
      });
    }

    // Get wallet and check balance
    const wallet = await getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    if (wallet.balance < roundupAmount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient balance for round-up",
      } as ErrorResponse);
    }

    // Create round-up transaction
    const roundupTransaction = await createTransaction({
      userId,
      type: "withdrawal",
      amount: roundupAmount,
      description: `Round-up from ${description} (₦${transactionAmount})`,
      status: "completed",
      metadata: {
        type: "roundup",
        originalAmount: transactionAmount,
        roundupMethod: settings.roundupMethod,
        autoInvest: false,
      },
    });

    // Update wallet balance
    await updateWallet(userId, {
      balance: wallet.balance - roundupAmount,
    });

    // Check if we should auto-invest
    const currentRoundupBalance = roundupAmount; // In production, sum all pending roundups
    if (currentRoundupBalance >= settings.autoInvestThreshold) {
      // Auto-invest the accumulated round-ups
      const investment = await createInvestment({
        userId,
        type: settings.targetInvestmentType,
        amount: currentRoundupBalance,
        status: "active",
      });

      const investmentTransaction = await createTransaction({
        userId,
        type: "investment",
        amount: currentRoundupBalance,
        description: `Auto-investment from round-ups`,
        status: "completed",
        metadata: {
          type: "auto_roundup_investment",
          investmentId: investment.id,
          investmentType: settings.targetInvestmentType,
        },
      });

      // Update wallet
      await updateWallet(userId, {
        totalInvested: wallet.totalInvested + currentRoundupBalance,
      });

      return res.json({
        success: true,
        roundupAmount,
        autoInvested: true,
        investmentAmount: currentRoundupBalance,
        investment,
        transactions: [roundupTransaction, investmentTransaction],
        message: `Rounded up ₦${roundupAmount} and auto-invested ₦${currentRoundupBalance}`,
      });
    }

    res.json({
      success: true,
      roundupAmount,
      autoInvested: false,
      transaction: roundupTransaction,
      message: `Rounded up ₦${roundupAmount} successfully`,
    });
  } catch (error) {
    console.error("Process roundup error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Get round-up statistics
export const getRoundupStats: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    // In production, calculate these from actual transaction data
    const stats = {
      totalRoundups: 45,
      totalAmount: 2340.5,
      averageRoundup: 52.01,
      lastRoundup: "2024-01-15T10:30:00Z",
      autoInvestments: 3,
      autoInvestedAmount: 1500.0,
      pendingRoundup: 840.5,
    };

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Get roundup stats error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Manual round-up investment
export const investRoundups: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { investmentType = "money_market" } = req.body;

    // In production, get actual accumulated round-up balance
    const pendingRoundupAmount = 840.5; // Mock value

    if (pendingRoundupAmount < 100) {
      return res.status(400).json({
        success: false,
        error: "Minimum round-up investment is ₦100",
      } as ErrorResponse);
    }

    // Create investment
    const investment = await createInvestment({
      userId,
      type: investmentType,
      amount: pendingRoundupAmount,
      status: "active",
    });

    const transaction = await createTransaction({
      userId,
      type: "investment",
      amount: pendingRoundupAmount,
      description: "Manual round-up investment",
      status: "completed",
      metadata: {
        type: "manual_roundup_investment",
        investmentId: investment.id,
        investmentType,
      },
    });

    // Update wallet
    const wallet = await getUserWallet(userId);
    if (wallet) {
      await updateWallet(userId, {
        totalInvested: wallet.totalInvested + pendingRoundupAmount,
      });
    }

    res.json({
      success: true,
      investment,
      transaction,
      message: `Successfully invested ₦${pendingRoundupAmount} from round-ups`,
    });
  } catch (error) {
    console.error("Invest roundups error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};
