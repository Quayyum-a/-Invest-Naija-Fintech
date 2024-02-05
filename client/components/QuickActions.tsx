import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  ArrowDownLeft,
  TrendingUp,
  Smartphone,
  CreditCard,
  Building,
  Zap,
  Gift,
  BarChart3,
  Bitcoin,
} from "lucide-react";

interface QuickActionsProps {
  onAddMoney: () => void;
  onWithdraw: () => void;
  onInvest: () => void;
  onBuyData: () => void;
  onBuyAirtime: () => void;
  onPayBills: () => void;
  onTransfer: () => void;
  onCrypto: () => void;
  onMore: () => void;
}

export default function QuickActions({
  onAddMoney,
  onWithdraw,
  onInvest,
  onBuyData,
  onBuyAirtime,
  onPayBills,
  onTransfer,
  onCrypto,
  onMore,
}: QuickActionsProps) {
  const actions = [
    {
      icon: Plus,
      label: "Add Money",
      color: "bg-green-100 text-green-600",
      onClick: onAddMoney,
    },
    {
      icon: ArrowDownLeft,
      label: "Withdraw",
      color: "bg-blue-100 text-blue-600",
      onClick: onWithdraw,
    },
    {
      icon: TrendingUp,
      label: "Invest",
      color: "bg-purple-100 text-purple-600",
      onClick: onInvest,
    },
    {
      icon: Bitcoin,
      label: "Crypto",
      color: "bg-orange-100 text-orange-600",
      onClick: onCrypto,
    },

    {
      icon: Zap,
      label: "Pay Bills",
      color: "bg-yellow-100 text-yellow-600",
      onClick: onPayBills,
    },
    {
      icon: Building,
      label: "Transfer",
      color: "bg-indigo-100 text-indigo-600",
      onClick: onTransfer,
    },
    {
      icon: Gift,
      label: "More",
      color: "bg-gray-100 text-gray-600",
      onClick: onMore,
    },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${action.color}`}
              >
                <action.icon className="w-6 h-6" />
              </div>
              <span className="text-xs text-gray-700 text-center">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
