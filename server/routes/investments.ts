import { RequestHandler } from "express";
import { ErrorResponse } from "@shared/api";
import {
  getUserWalletAsync as getUserWallet,
  updateWalletAsync as updateWallet,
  createTransactionAsync as createTransaction,
  createInvestmentAsync as createInvestment,
  getUserInvestmentsAsync as getUserInvestments,
  updateInvestmentAsync as updateInvestment,
} from "../data/storage";
import { InvestmentService } from "../services/investmentService";

export const getInvestmentProducts: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      } as ErrorResponse);
    }

    const products = InvestmentService.getAvailableProducts();
    const portfolio = await InvestmentService.getUserPortfolio(userId);

    // Get recommendations based on user profile
    const recommendations = InvestmentService.getRecommendations(
      req.user.kycStatus || "unverified",
      "moderate", // Default risk tolerance
      "growth", // Default investment goal
    );

    res.json({
      success: true,
      data: {
        products,
        userInvestments: portfolio.userInvestments,
        portfolioSummary: portfolio.portfolioSummary,
        recommendations,
      },
    });
  } catch (error) {
    console.error("Get investment products error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load investment data",
    } as ErrorResponse);
  }
};

export const createRoundUpInvestment: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { purchaseAmount, roundUpAmount } = req.body;

    if (!purchaseAmount || !roundUpAmount || roundUpAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid round-up amount",
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
    if (wallet.balance < roundUpAmount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance for round-up investment",
      } as ErrorResponse);
    }

    // Create round-up investment
    const investment = await createInvestment({
      userId,
      type: "round_up",
      amount: roundUpAmount,
      status: "active",
    });

    // Create transaction record
    const transaction = await createTransaction({
      userId,
      type: "investment",
      amount: roundUpAmount,
      description: `Round-up investment from ₦${purchaseAmount.toFixed(2)} purchase`,
      status: "completed",
      metadata: {
        investmentId: investment.id,
        purchaseAmount,
        roundUpAmount,
        investmentType: "round_up",
      },
    });

    // Update wallet balances
    const updatedWallet = await updateWallet(userId, {
      balance: wallet.balance - roundUpAmount,
      totalInvested: wallet.totalInvested + roundUpAmount,
    });

    res.json({
      success: true,
      transaction,
      investment,
      wallet: updatedWallet,
      message: "Round-up investment successful",
    });
  } catch (error) {
    console.error("Round-up investment error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const withdrawInvestment: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { investmentId, amount } = req.body;

    if (!investmentId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid withdrawal amount",
      } as ErrorResponse);
    }

    // Get user's investments
    const investments = await getUserInvestments(userId);
    const investment = investments.find((inv) => inv.id === investmentId);

    if (!investment) {
      return res.status(404).json({
        success: false,
        error: "Investment not found",
      } as ErrorResponse);
    }

    if (investment.currentValue < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient investment balance",
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

    // Update investment
    const updatedInvestment = await updateInvestment(investmentId, {
      currentValue: investment.currentValue - amount,
      status: investment.currentValue - amount <= 0 ? "withdrawn" : "active",
    });

    // Create transaction record
    const transaction = await createTransaction({
      userId,
      type: "withdrawal",
      amount,
      description: `Investment withdrawal from ${investment.type.replace("_", " ")}`,
      status: "completed",
      metadata: {
        investmentId,
        withdrawalType: "investment",
      },
    });

    // Update wallet balances
    const updatedWallet = await updateWallet(userId, {
      balance: wallet.balance + amount,
      totalInvested: wallet.totalInvested - Math.min(amount, investment.amount),
    });

    res.json({
      success: true,
      transaction,
      investment: updatedInvestment,
      wallet: updatedWallet,
      message: "Investment withdrawal successful",
    });
  } catch (error) {
    console.error("Investment withdrawal error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const getInvestmentPerformance: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const investments = await getUserInvestments(userId);

    // Calculate performance metrics
    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const currentValue = investments.reduce(
      (sum, inv) => sum + inv.currentValue,
      0,
    );
    const totalReturns = currentValue - totalInvested;
    const returnPercentage =
      totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    // Mock historical performance data
    // In a real app, this would come from actual market data
    const performanceHistory = generatePerformanceHistory(investments);

    res.json({
      success: true,
      performance: {
        totalInvested,
        currentValue,
        totalReturns,
        returnPercentage,
        history: performanceHistory,
      },
    });
  } catch (error) {
    console.error("Get investment performance error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Helper function to generate realistic performance history
function generatePerformanceHistory(investments: any[]) {
  const history = [];
  const days = 30;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Simulate market performance with slight variations
    const baseValue = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const performance = baseValue * (1 + (Math.random() * 0.02 - 0.01)); // ±1% variation

    history.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(performance * 100) / 100,
    });
  }

  return history;
}
