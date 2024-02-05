import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Wallet,
  DollarSign,
  ChevronRight,
  Smartphone,
  Zap,
} from "lucide-react";
import { Transaction } from "@shared/api";

interface TransactionHistoryProps {
  transactions: Transaction[];
  onViewAll: () => void;
  limit?: number;
}

export default function TransactionHistory({
  transactions,
  onViewAll,
  limit = 5,
}: TransactionHistoryProps) {
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTransactionIcon = (type: string, metadata?: Record<string, any>) => {
    if (metadata?.service === "airtime") {
      return <Smartphone className="w-4 h-4 text-pink-600" />;
    }
    if (metadata?.service === "data") {
      return <Smartphone className="w-4 h-4 text-orange-600" />;
    }
    if (metadata?.service === "bills") {
      return <Zap className="w-4 h-4 text-yellow-600" />;
    }

    switch (type) {
      case "deposit":
        return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case "withdrawal":
        return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
      case "investment":
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case "return":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (
    type: string,
    metadata?: Record<string, any>,
  ) => {
    if (metadata?.service) {
      return (
        {
          airtime: "bg-pink-100",
          data: "bg-orange-100",
          bills: "bg-yellow-100",
        }[metadata.service] || "bg-gray-100"
      );
    }

    switch (type) {
      case "deposit":
        return "bg-green-100";
      case "withdrawal":
        return "bg-red-100";
      case "investment":
      case "return":
        return "bg-purple-100";
      default:
        return "bg-gray-100";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const displayedTransactions = limit
    ? transactions.slice(0, limit)
    : transactions;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          Recent Activity
          {transactions.length > limit && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedTransactions.length > 0 ? (
          displayedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 ${getTransactionColor(
                    transaction.type,
                    transaction.metadata,
                  )} rounded-full flex items-center justify-center`}
                >
                  {getTransactionIcon(transaction.type, transaction.metadata)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {transaction.description}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500 capitalize">
                      {transaction.type.replace("_", " ")}
                    </p>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getStatusColor(transaction.status)}`}
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`font-medium ${
                    transaction.type === "withdrawal"
                      ? "text-red-600"
                      : "text-gray-900"
                  }`}
                >
                  {transaction.type === "withdrawal" ? "-" : "+"}
                  {formatNaira(transaction.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTimeAgo(transaction.createdAt)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-8 h-8 mx-auto mb-2" />
            <p>No recent transactions</p>
            <p className="text-xs">
              Start by adding money to your wallet or making an investment
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
