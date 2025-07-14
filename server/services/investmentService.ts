import {
  InvestmentProduct,
  UserInvestment,
  PortfolioSummary,
} from "@shared/api";
import {
  getUserInvestments,
  getUserWallet,
  createInvestment,
  updateInvestment,
} from "../data/storage";

// Real Nigerian investment products
export class InvestmentService {
  // Get available investment products from Nigerian market
  static getAvailableProducts(): InvestmentProduct[] {
    return [
      {
        id: "money_market_fund",
        name: "Money Market Fund",
        description:
          "Low-risk investment with daily liquidity. Ideal for emergency funds and short-term savings.",
        minimumAmount: 100,
        expectedReturn: 12.5, // Annual percentage
        riskLevel: "low",
        duration: "flexible",
        status: "available",
        features: [
          "Daily liquidity",
          "Capital preservation",
          "Competitive returns",
          "No lock-in period",
        ],
        provider: "ARM Investment",
        category: "money_market",
      },
      {
        id: "treasury_bills_91",
        name: "91-Day Treasury Bills",
        description:
          "Government-backed securities with guaranteed returns. Perfect for capital preservation.",
        minimumAmount: 1000,
        expectedReturn: 15.2,
        riskLevel: "very_low",
        duration: "91 days",
        status: "available",
        features: [
          "Government guarantee",
          "Fixed returns",
          "91-day maturity",
          "Primary market access",
        ],
        provider: "Central Bank of Nigeria",
        category: "treasury_bills",
      },
      {
        id: "treasury_bills_182",
        name: "182-Day Treasury Bills",
        description:
          "Medium-term government securities with higher yields than 91-day bills.",
        minimumAmount: 1000,
        expectedReturn: 16.8,
        riskLevel: "very_low",
        duration: "182 days",
        status: "available",
        features: [
          "Government guarantee",
          "Higher yields",
          "182-day maturity",
          "Secondary market trading",
        ],
        provider: "Central Bank of Nigeria",
        category: "treasury_bills",
      },
      {
        id: "fixed_deposit_30",
        name: "30-Day Fixed Deposit",
        description:
          "Short-term fixed deposit with guaranteed returns from top Nigerian banks.",
        minimumAmount: 5000,
        expectedReturn: 10.0,
        riskLevel: "very_low",
        duration: "30 days",
        status: "available",
        features: [
          "NDIC insured",
          "Fixed interest rate",
          "30-day term",
          "Auto-renewal option",
        ],
        provider: "Partner Banks",
        category: "fixed_deposit",
      },
      {
        id: "bond_fund",
        name: "Nigerian Bond Fund",
        description:
          "Diversified portfolio of Nigerian government and corporate bonds.",
        minimumAmount: 2500,
        expectedReturn: 14.5,
        riskLevel: "low",
        duration: "flexible",
        status: "available",
        features: [
          "Professional management",
          "Diversified portfolio",
          "Monthly income",
          "Flexible redemption",
        ],
        provider: "Stanbic IBTC Asset Management",
        category: "mutual_fund",
      },
      {
        id: "equity_fund",
        name: "Nigerian Equity Fund",
        description:
          "Growth-focused equity fund investing in top Nigerian stocks.",
        minimumAmount: 5000,
        expectedReturn: 18.0,
        riskLevel: "medium",
        duration: "flexible",
        status: "available",
        features: [
          "Stock market exposure",
          "Professional management",
          "Growth potential",
          "Dividend income",
        ],
        provider: "ARM Investment",
        category: "mutual_fund",
      },
      {
        id: "dollar_fund",
        name: "Dollar Fund",
        description:
          "USD-denominated fund for foreign exchange diversification.",
        minimumAmount: 50000, // ₦50,000 minimum
        expectedReturn: 8.5,
        riskLevel: "medium",
        duration: "flexible",
        status: "available",
        features: [
          "USD exposure",
          "Forex hedging",
          "International diversification",
          "Professional management",
        ],
        provider: "Coronation Asset Management",
        category: "forex_fund",
      },
      {
        id: "real_estate_fund",
        name: "Real Estate Investment Fund",
        description:
          "Real estate-focused fund investing in Nigerian commercial properties.",
        minimumAmount: 25000,
        expectedReturn: 16.0,
        riskLevel: "medium",
        duration: "3+ years",
        status: "coming_soon",
        features: [
          "Real estate exposure",
          "Rental income",
          "Capital appreciation",
          "Professional property management",
        ],
        provider: "Union Homes REIT",
        category: "real_estate",
      },
    ];
  }

  // Get user's investment portfolio
  static async getUserPortfolio(userId: string): Promise<{
    userInvestments: UserInvestment[];
    portfolioSummary: PortfolioSummary;
  }> {
    try {
      const investments = getUserInvestments(userId);
      const wallet = getUserWallet(userId);

      if (!wallet) {
        throw new Error("User wallet not found");
      }

      // Calculate portfolio metrics
      const totalInvested = investments.reduce(
        (sum, inv) => sum + inv.amount,
        0,
      );
      const currentValue = investments.reduce(
        (sum, inv) => sum + inv.currentValue,
        0,
      );
      const totalReturns = currentValue - totalInvested;
      const returnPercentage =
        totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

      const portfolioSummary: PortfolioSummary = {
        totalInvested,
        currentValue,
        totalReturns,
        returnPercentage,
        activeInvestments: investments.filter((inv) => inv.status === "active")
          .length,
      };

      return {
        userInvestments: investments,
        portfolioSummary,
      };
    } catch (error) {
      console.error("Error getting user portfolio:", error);
      throw error;
    }
  }

  // Calculate returns for an investment
  static calculateInvestmentReturns(
    amount: number,
    rate: number,
    days: number,
  ): number {
    // Simple interest calculation for most Nigerian investments
    const annualRate = rate / 100;
    const dailyRate = annualRate / 365;
    return amount * dailyRate * days;
  }

  // Get investment recommendations based on user profile
  static getRecommendations(
    userKycStatus: string,
    riskTolerance: string = "medium",
    investmentGoal: string = "growth",
  ): InvestmentProduct[] {
    const products = this.getAvailableProducts();

    // Filter based on KYC status
    let filteredProducts = products;
    if (userKycStatus !== "verified") {
      // Unverified users can only access basic products
      filteredProducts = products.filter(
        (p) => p.minimumAmount <= 50000 && p.riskLevel === "low",
      );
    }

    // Filter based on risk tolerance
    const riskLevelMap: Record<string, string[]> = {
      conservative: ["very_low", "low"],
      moderate: ["very_low", "low", "medium"],
      aggressive: ["low", "medium", "high"],
    };

    const allowedRiskLevels = riskLevelMap[riskTolerance] || ["low", "medium"];
    filteredProducts = filteredProducts.filter((p) =>
      allowedRiskLevels.includes(p.riskLevel),
    );

    // Sort by expected return
    return filteredProducts
      .sort((a, b) => b.expectedReturn - a.expectedReturn)
      .slice(0, 6);
  }

  // Process investment purchase
  static async processInvestment(
    userId: string,
    productId: string,
    amount: number,
  ): Promise<{
    success: boolean;
    investment?: any;
    error?: string;
  }> {
    try {
      const products = this.getAvailableProducts();
      const product = products.find((p) => p.id === productId);

      if (!product) {
        return { success: false, error: "Investment product not found" };
      }

      if (product.status !== "available") {
        return { success: false, error: "Investment product not available" };
      }

      if (amount < product.minimumAmount) {
        return {
          success: false,
          error: `Minimum investment amount is ₦${product.minimumAmount.toLocaleString()}`,
        };
      }

      // Check user wallet balance
      const wallet = getUserWallet(userId);
      if (!wallet || wallet.balance < amount) {
        return { success: false, error: "Insufficient wallet balance" };
      }

      // Create investment record
      const investment = createInvestment({
        userId,
        type: product.category,
        amount,
        status: "active",
        metadata: {
          productId: product.id,
          productName: product.name,
          expectedReturn: product.expectedReturn,
          duration: product.duration,
        },
      });

      return { success: true, investment };
    } catch (error) {
      console.error("Error processing investment:", error);
      return { success: false, error: "Failed to process investment" };
    }
  }

  // Get investment performance data
  static getPerformanceData(userId: string): {
    daily: Array<{ date: string; value: number }>;
    monthly: Array<{ month: string; return: number }>;
    allocation: Array<{ category: string; value: number; percentage: number }>;
  } {
    const investments = getUserInvestments(userId);

    // Calculate daily performance (last 30 days)
    const daily = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));

      // Simulate growth based on investment performance
      const totalValue = investments.reduce((sum, inv) => {
        const daysHeld = Math.floor(
          (Date.now() - new Date(inv.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        const growth = (inv.amount * 0.15 * daysHeld) / 365; // 15% annual average
        return sum + inv.amount + growth;
      }, 0);

      return {
        date: date.toISOString().split("T")[0],
        value: totalValue,
      };
    });

    // Calculate monthly returns (last 12 months)
    const monthly = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));

      // Simulate monthly returns
      const monthlyReturn = 0.5 + Math.random() * 2; // 0.5% to 2.5% monthly

      return {
        month: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        return: monthlyReturn,
      };
    });

    // Calculate allocation by category
    const allocationMap = new Map<string, number>();
    let totalAmount = 0;

    investments.forEach((inv) => {
      const category = inv.type;
      const current = allocationMap.get(category) || 0;
      allocationMap.set(category, current + inv.amount);
      totalAmount += inv.amount;
    });

    const allocation = Array.from(allocationMap.entries()).map(
      ([category, value]) => ({
        category: category.replace("_", " ").toUpperCase(),
        value,
        percentage: totalAmount > 0 ? (value / totalAmount) * 100 : 0,
      }),
    );

    return { daily, monthly, allocation };
  }
}
