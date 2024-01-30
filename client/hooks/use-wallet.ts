import { useState, useEffect } from "react";
import { apiService } from "../lib/api";
import { toast } from "./use-toast";

interface WalletData {
  balance: number;
  totalInvested: number;
  totalReturns: number;
  lastUpdated: string;
}

export const useWallet = () => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallet = async () => {
    try {
      const response = await apiService.getWallet();
      if (response.success && response.wallet) {
        setWallet(response.wallet);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
      toast({
        title: "Error",
        description: "Failed to load wallet data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchWallet();
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return {
    wallet,
    loading,
    refreshing,
    refresh,
    formatNaira,
  };
};
