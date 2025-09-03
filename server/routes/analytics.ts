import { RequestHandler } from "express";
import { ErrorResponse } from "@shared/api";
import {
  getUserWalletAsync as getUserWallet,
  getUserTransactionsAsync as getUserTransactions,
  getUserInvestmentsAsync as getUserInvestments,
  getAllUsersAsync as getAllUsers,
  getTotalAUMAsync as getTotalAUM,
  getActiveInvestmentCountAsync as getActiveInvestmentCount,
} from "../data/storage";

export const getUserAnalytics: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const wallet = await getUserWallet(userId);
    const transactions = await getUserTransactions(userId);
    const investments = await getUserInvestments(userId);

    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      } as ErrorResponse);
    }

    // Calculate spending patterns
    const spendingByCategory = calculateSpendingByCategory(transactions);
    const monthlySpending = calculateMonthlySpending(transactions);
    const savingsRate = calculateSavingsRate(transactions);
    const investmentGrowth = calculateInvestmentGrowth(investments);

    const analytics = {
      wallet: {
        currentBalance: wallet.balance,
        totalInvested: wallet.totalInvested,
        totalReturns: wallet.totalReturns,
        netWorth: wallet.balance + wallet.totalInvested,
      },
      spending: {
        byCategory: spendingByCategory,
        monthly: monthlySpending,
        averageMonthly:
          monthlySpending.reduce((sum, month) => sum + month.amount, 0) /
          Math.max(monthlySpending.length, 1),
      },
      savings: {
        rate: savingsRate,
        totalSaved: wallet.totalInvested,
      },
      investments: {
        totalInvestments: investments.length,
        activeInvestments: investments.filter((inv) => inv.status === "active")
          .length,
        growth: investmentGrowth,
        bestPerformingType: getBestPerformingInvestmentType(investments),
      },
    };

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Get user analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const getAppAnalytics: RequestHandler = async (req, res) => {
  try {
    // Only admins can access app-wide analytics
    if (
      !req.user?.email?.endsWith("@admin.com") &&
      !req.user?.email?.endsWith("@investnaija.com")
    ) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
      } as ErrorResponse);
    }

    const allUsers = await getAllUsers();
    const totalAUM = await getTotalAUM();
    const activeInvestments = await getActiveInvestmentCount();

    // Calculate user growth
    const userGrowth = calculateUserGrowth(allUsers);
    const aumGrowth = calculateAUMGrowth();
    const popularInvestmentTypes = getPopularInvestmentTypes();

    const analytics = {
      users: {
        total: allUsers.length,
        growth: userGrowth,
        activeUsers: allUsers.filter((user) => user.status === "active").length,
        verifiedUsers: allUsers.filter((user) => user.kycStatus === "verified")
          .length,
      },
      financial: {
        totalAUM,
        aumGrowth,
        activeInvestments,
        averageInvestmentPerUser: totalAUM / Math.max(allUsers.length, 1),
      },
      investments: {
        popularTypes: popularInvestmentTypes,
        totalInvestments: activeInvestments,
      },
      retention: {
        dailyActiveUsers: Math.floor(allUsers.length * 0.3), // Simulated
        weeklyActiveUsers: Math.floor(allUsers.length * 0.6), // Simulated
        monthlyActiveUsers: Math.floor(allUsers.length * 0.8), // Simulated
      },
    };

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Get app analytics error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Helper functions for analytics calculations
function calculateSpendingByCategory(transactions: any[]) {
  const categories = [
    "food",
    "transport",
    "shopping",
    "bills",
    "entertainment",
    "others",
  ];

  return categories.map((category) => ({
    category,
    amount: Math.floor(Math.random() * 50000) + 10000, // Simulated data
    percentage: Math.floor(Math.random() * 30) + 5,
  }));
}

function calculateMonthlySpending(transactions: any[]) {
  const months = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    months.push({
      month: monthName,
      amount: Math.floor(Math.random() * 100000) + 20000, // Simulated
    });
  }

  return months;
}

function calculateSavingsRate(transactions: any[]) {
  const deposits = transactions
    .filter((t) => t.type === "deposit")
    .reduce((sum, t) => sum + t.amount, 0);
  const withdrawals = transactions
    .filter((t) => t.type === "withdrawal")
    .reduce((sum, t) => sum + t.amount, 0);
  const investments = transactions
    .filter((t) => t.type === "investment")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalInflow = deposits;
  const totalSavings = investments;

  return totalInflow > 0 ? (totalSavings / totalInflow) * 100 : 0;
}

function calculateInvestmentGrowth(investments: any[]) {
  const growth = [];
  const days = 30;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const totalValue = investments.reduce((sum, inv) => {
      const investmentDate = new Date(inv.createdAt);
      if (investmentDate <= date) {
        // Simulate growth over time
        const daysSinceInvestment = Math.floor(
          (date.getTime() - investmentDate.getTime()) / (1000 * 60 * 60 * 24),
        );
        const growthRate = 0.12 / 365; // 12% annual return
        return sum + inv.amount * (1 + growthRate * daysSinceInvestment);
      }
      return sum;
    }, 0);

    growth.push({
      date: date.toISOString().split("T")[0],
      value: Math.round(totalValue * 100) / 100,
    });
  }

  return growth;
}

function getBestPerformingInvestmentType(investments: any[]) {
  const types = ["money_market", "treasury_bills", "round_up"];
  const performance = types.map((type) => {
    const typeInvestments = investments.filter((inv) => inv.type === type);
    const totalInvested = typeInvestments.reduce(
      (sum, inv) => sum + inv.amount,
      0,
    );
    const currentValue = typeInvestments.reduce(
      (sum, inv) => sum + inv.currentValue,
      0,
    );
    const returns = currentValue - totalInvested;
    const returnPercentage =
      totalInvested > 0 ? (returns / totalInvested) * 100 : 0;

    return {
      type,
      returnPercentage,
      totalInvested,
      returns,
    };
  });

  return performance.sort((a, b) => b.returnPercentage - a.returnPercentage)[0];
}

function calculateUserGrowth(users: any[]) {
  const growth = [];
  const months = 6;

  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const usersUpToDate = users.filter(
      (user) => new Date(user.createdAt) <= date,
    ).length;

    growth.push({
      month: date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      users: usersUpToDate,
    });
  }

  return growth;
}

function calculateAUMGrowth() {
  const growth = [];
  const months = 6;

  for (let i = months; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    // Simulate AUM growth
    const baseAUM = 1000000; // Base AUM
    const monthlyGrowth = 0.15; // 15% monthly growth
    const aum = baseAUM * Math.pow(1 + monthlyGrowth, months - i);

    growth.push({
      month: date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      aum: Math.round(aum),
    });
  }

  return growth;
}

function getPopularInvestmentTypes() {
  return [
    { type: "money_market", count: 450, percentage: 65 },
    { type: "treasury_bills", count: 180, percentage: 26 },
    { type: "round_up", count: 63, percentage: 9 },
  ];
}
