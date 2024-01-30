import { useState, useEffect } from "react";
import { apiService } from "../lib/api";
import { toast } from "./use-toast";

interface Investment {
  id: string;
  type: string;
  amount: number;
  currentValue: number;
  returns: number;
  status: string;
  createdAt: string;
}

interface InvestmentProduct {
  id: string;
  name: string;
  expectedReturn: number;
  minAmount: number;
  riskLevel: string;
  duration: string;
  provider: string;
}

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [investing, setInvesting] = useState(false);

  const fetchData = async () => {
    try {
      const [portfolioResponse, productsResponse] = await Promise.all([
        apiService.getPortfolioData(),
        apiService.getInvestmentProducts(),
      ]);

      if (portfolioResponse.success) {
        setInvestments(portfolioResponse.data.investments || []);
      }

      if (productsResponse.success) {
        setProducts(productsResponse.products || []);
      }
    } catch (error) {
      console.error("Failed to fetch investment data:", error);
      toast({
        title: "Error",
        description: "Failed to load investment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createInvestment = async (amount: number, type: string) => {
    setInvesting(true);
    try {
      const response = await apiService.investMoney(amount, type);
      toast({
        title: "Investment Successful",
        description:
          response.message ||
          `Successfully invested ₦${amount.toLocaleString()}`,
      });
      await fetchData(); // Refresh data
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Investment failed";
      toast({
        title: "Investment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setInvesting(false);
    }
  };

  const withdrawInvestment = async (investmentId: string, amount: number) => {
    try {
      const response = await apiService.withdrawInvestment(
        investmentId,
        amount,
      );
      toast({
        title: "Withdrawal Successful",
        description:
          response.message ||
          `Successfully withdrew ₦${amount.toLocaleString()}`,
      });
      await fetchData(); // Refresh data
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Withdrawal failed";
      toast({
        title: "Withdrawal Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investments.reduce(
    (sum, inv) => sum + inv.currentValue,
    0,
  );
  const totalReturns = totalCurrentValue - totalInvested;
  const returnPercentage =
    totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  return {
    investments,
    products,
    loading,
    investing,
    createInvestment,
    withdrawInvestment,
    refresh: fetchData,
    stats: {
      totalInvested,
      totalCurrentValue,
      totalReturns,
      returnPercentage,
      activeInvestments: investments.filter((inv) => inv.status === "active")
        .length,
    },
  };
};
