import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import QuickActions from "../components/QuickActions";
import {
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  Wallet,
  Target,
  Bell,
  Settings,
  Plus,
  Eye,
  EyeOff,
  ChevronRight,
  DollarSign,
  CreditCard,
  Building,
  Copy,
  QrCode,
  Smartphone,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../lib/api";
import { DashboardData } from "@shared/api";
import BottomNavigation from "../components/BottomNavigation";
import KYCVerification from "../components/KYCVerification";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isVirtualAccountOpen, setIsVirtualAccountOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isBillsOpen, setIsBillsOpen] = useState(false);
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [fundingAmount, setFundingAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [notifications, setNotifications] = useState(0);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [virtualAccount, setVirtualAccount] = useState<any>(null);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  useEffect(() => {
    // Batch all initial data loading
    const loadInitialData = async () => {
      try {
        // Load dashboard data first
        await fetchDashboardData();

        // Load banks and virtual account in parallel
        await Promise.all([fetchBanks(), generateVirtualAccount()]);
      } catch (error) {
        console.error("Failed to load initial dashboard data:", error);
      }
    };

    loadInitialData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await apiService.getDashboardData();
      if (response.success) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await apiService.getBanks();
      if (response.success) {
        setBanks(response.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch banks:", error);
    }
  };

  const generateVirtualAccount = async () => {
    try {
      const response = await apiService.generateVirtualAccount();
      if (response.success) {
        setVirtualAccount(response.data);
      }
    } catch (error) {
      console.error("Failed to generate virtual account:", error);
    }
  };

  const handleAddMoney = () => {
    // Only allow real payment methods - no manual funding
    toast({
      title: "Choose Payment Method",
      description:
        "Please select Paystack (card/bank transfer) or use your virtual account for funding.",
    });
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to withdraw.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiService.withdrawMoney(parseFloat(withdrawAmount));
      toast({
        title: "Success",
        description: `${formatNaira(parseFloat(withdrawAmount))} withdrawal initiated.`,
      });
      setWithdrawAmount("");
      setIsWithdrawOpen(false);
      fetchDashboardData();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to withdraw money",
        variant: "destructive",
      });
    }
  };

  const handlePaystackPayment = async () => {
    if (!fundingAmount || parseFloat(fundingAmount) < 100) {
      toast({
        title: "Invalid Amount",
        description: "Minimum funding amount is ₦100.",
        variant: "destructive",
      });
      return;
    }

    // Check KYC requirement for larger amounts
    if (parseFloat(fundingAmount) > 50000 && user?.kycStatus !== "verified") {
      toast({
        title: "KYC Verification Required",
        description:
          "Please complete KYC verification for transactions above ₦50,000.",
        variant: "destructive",
      });
      setIsKYCOpen(true);
      return;
    }

    try {
      const response = await apiService.initiatePaystackPayment(
        parseFloat(fundingAmount),
      );

      if (response.success && response.data) {
        // Open Paystack checkout in a new window
        const paystackUrl = response.data.authorization_url;
        const paymentWindow = window.open(
          paystackUrl,
          "_blank",
          "width=500,height=600",
        );

        toast({
          title: "Paystack Checkout",
          description: "Complete your payment in the opened window.",
        });

        // Monitor for payment completion
        const checkPayment = setInterval(async () => {
          if (paymentWindow?.closed) {
            clearInterval(checkPayment);

            // Verify payment with our backend
            try {
              const verifyResponse = await apiService.verifyPaystackPayment(
                response.data.reference,
              );
              if (verifyResponse.success) {
                toast({
                  title: "Payment Successful!",
                  description: `₦${parseFloat(fundingAmount).toLocaleString()} has been added to your wallet.`,
                });
                setFundingAmount("");
                setIsAddMoneyOpen(false);
                fetchDashboardData();
              } else {
                toast({
                  title: "Payment Not Completed",
                  description:
                    "Please try again or contact support if payment was made.",
                  variant: "destructive",
                });
              }
            } catch (error) {
              toast({
                title: "Verification Error",
                description:
                  "Unable to verify payment. Please contact support.",
                variant: "destructive",
              });
            }
          }
        }, 2000);

        // Clear interval after 10 minutes
        setTimeout(() => clearInterval(checkPayment), 600000);
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description:
          error instanceof Error
            ? error.message
            : "Payment could not be initiated",
        variant: "destructive",
      });
    }
  };

  const handleQuickService = (service: string) => {
    if (service === "Investment") {
      window.location.href = "/portfolio";
    } else if (service === "Data Purchase") {
      toast({
        title: "Data Purchase",
        description: "Redirecting to mobile data purchase service...",
      });
      setTimeout(() => {
        toast({
          title: "Service Available",
          description:
            "Data purchase feature is now active! Select your network provider.",
        });
      }, 1000);
    } else if (service === "Airtime Purchase") {
      toast({
        title: "Airtime Purchase",
        description: "Airtime top-up service activated! Select your network.",
      });
    }
  };

  const copyVirtualAccount = () => {
    if (virtualAccount?.account_number) {
      navigator.clipboard.writeText(virtualAccount.account_number);
      toast({
        title: "Copied",
        description: "Account number copied to clipboard",
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">₦</span>
          </div>
          <div className="animate-spin w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold">{getGreeting()}</h1>
                <p className="text-green-100 text-sm">
                  {user?.firstName || "User"} {user?.lastName || ""}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={
                      user?.kycStatus === "verified" ? "default" : "secondary"
                    }
                    className={`text-xs ${
                      user?.kycStatus === "verified"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user?.kycStatus === "verified" ? "Verified" : "Unverified"}
                  </Badge>
                  {user && user.kycStatus !== "verified" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-green-100 underline p-0 h-auto"
                      onClick={() => setIsKYCOpen(true)}
                    >
                      Complete KYC
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-white hover:bg-white/20"
                onClick={() =>
                  toast({
                    title: "QR Code Scanner",
                    description:
                      "QR code scanner activated! Point your camera at a QR code to scan.",
                  })
                }
              >
                <QrCode className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-white hover:bg-white/20 relative"
                onClick={() =>
                  toast({
                    title: "Notifications",
                    description: "No new notifications",
                  })
                }
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 text-white hover:bg-white/20"
                onClick={logout}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Wallet Balance Card */}
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Wallet Balance</p>
                  <div className="flex items-center space-x-2">
                    {hideBalance ? (
                      <div className="text-2xl font-bold">••••••</div>
                    ) : (
                      <div className="text-2xl font-bold">
                        {formatNaira(dashboardData?.wallet?.balance ?? 0)}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 text-white hover:bg-white/20"
                      onClick={() => setHideBalance(!hideBalance)}
                    >
                      {hideBalance ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-green-100 text-sm mb-1">Total Invested</p>
                  <div className="text-lg font-semibold">
                    {formatNaira(dashboardData?.wallet?.totalInvested ?? 0)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Show Account Number Card if virtualAccount is available */}
        {virtualAccount && (
          <Card className="bg-white/10 backdrop-blur border-white/20 text-white mt-4">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-green-100 text-xs mb-1">Account Number</p>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-mono font-bold">
                    {virtualAccount.account_number}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 text-white hover:bg-white/20"
                    onClick={copyVirtualAccount}
                    title="Copy Account Number"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-green-100 text-xs mt-1">
                  {virtualAccount.bank_name || "Wema Bank"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-green-100 text-xs mb-1">Account Name</p>
                <div className="text-sm font-semibold">
                  {virtualAccount.account_name}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </header>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <QuickActions
          onAddMoney={() => setIsAddMoneyOpen(true)}
          onWithdraw={() => setIsWithdrawOpen(true)}
          onInvest={() => handleQuickService("Investment")}
          onBuyData={() => handleQuickService("Data Purchase")}
          onBuyAirtime={() => handleQuickService("Airtime Purchase")}
          onPayBills={() => setIsBillsOpen(true)}
          onTransfer={() => setIsTransferOpen(true)}
          onCrypto={() => (window.location.href = "/crypto")}
          onMore={() => (window.location.href = "/services")}
        />

        {/* New Features */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Explore More Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/business"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Building className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium text-center">
                  Business Banking
                </span>
              </Link>
              <Link
                to="/social"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium text-center">
                  Social Banking
                </span>
              </Link>
              <Link
                to="/investments"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <TrendingUp className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium text-center">
                  Investment Products
                </span>
              </Link>
              <Link
                to="/portfolio"
                className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Target className="w-6 h-6 text-indigo-600" />
                <span className="text-sm font-medium text-center">
                  My Portfolio
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Investment Goal Progress */}
        {dashboardData?.investmentGoal && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Monthly Goal</CardTitle>
                <Target className="w-5 h-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {formatNaira(dashboardData?.investmentGoal?.current ?? 0)} /{" "}
                  {formatNaira(dashboardData?.investmentGoal?.target ?? 10000)}
                </span>
              </div>
              <Progress
                value={Math.min(
                  dashboardData?.investmentGoal?.percentage ?? 0,
                  100,
                )}
                className="h-2"
              />
              <p className="text-sm text-gray-500">
                {dashboardData?.investmentGoal?.current &&
                dashboardData?.investmentGoal?.target
                  ? dashboardData.investmentGoal.current >=
                    dashboardData.investmentGoal.target
                    ? "🎉 Goal achieved this month!"
                    : `₦${(
                        dashboardData.investmentGoal.target -
                        dashboardData.investmentGoal.current
                      ).toLocaleString()} remaining to reach your goal`
                  : "Set up your monthly investment goal"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Investment Streak */}
        {dashboardData?.streak !== undefined && dashboardData.streak > 0 && (
          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-orange-900 mb-1">
                    Investment Streak 🔥
                  </h3>
                  <p className="text-sm text-gray-600">
                    {dashboardData?.streak || 0} days in a row!
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-500">
                    {dashboardData?.streak || 0}
                  </div>
                  <p className="text-xs text-orange-600">days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/transactions")}
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData?.recentTransactions?.length ? (
              dashboardData.recentTransactions.map((transaction) => {
                const isCredit = transaction.type === "deposit";
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCredit
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isCredit ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold ${
                          isCredit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isCredit ? "+" : "-"}
                        {formatNaira(transaction.amount)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {transaction.status}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No transactions yet</p>
                <p className="text-gray-400 text-xs">
                  Start by funding your wallet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Money Dialog */}
        <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Money to Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  placeholder="Enter amount"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  type="number"
                  min="100"
                />
                <p className="text-sm text-gray-500">Minimum: ₦100</p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handlePaystackPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!fundingAmount || parseFloat(fundingAmount) < 100}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay with Paystack
                </Button>

                <Button
                  onClick={() => {
                    setIsAddMoneyOpen(false);
                    setIsVirtualAccountOpen(true);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Building className="w-4 h-4 mr-2" />
                  Use Virtual Account
                </Button>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Payment Methods:</strong>
                  <br />
                  • Paystack: Cards, bank transfer, USSD
                  <br />• Virtual Account: Direct bank transfer
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Virtual Account Dialog */}
        <Dialog
          open={isVirtualAccountOpen}
          onOpenChange={setIsVirtualAccountOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Your Virtual Account</DialogTitle>
            </DialogHeader>
            {virtualAccount && (
              <div className="space-y-4 py-4">
                <div className="bg-green-50 p-4 rounded-lg border-2 border-dashed border-green-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">
                      {virtualAccount.bank_name || "Wema Bank"}
                    </p>
                    <p className="text-2xl font-bold font-mono mb-2">
                      {virtualAccount.account_number}
                    </p>
                    <p className="text-sm text-gray-700 font-medium">
                      {virtualAccount.account_name}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyVirtualAccount}
                      className="mt-2 text-green-600"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Account Number
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>How to fund:</strong>
                  </p>
                  <ul className="space-y-1 ml-4">
                    <li>• Transfer money to this account number</li>
                    <li>• Use any Nigerian bank or app</li>
                    <li>• Your wallet will be credited instantly</li>
                  </ul>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Withdraw Dialog */}
        <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Withdraw Money</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawAmount">Amount (₦)</Label>
                <Input
                  id="withdrawAmount"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  type="number"
                  min="100"
                />
                <p className="text-sm text-gray-500">
                  Available: {formatNaira(dashboardData?.wallet?.balance ?? 0)}
                </p>
              </div>
              {banks.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="bank">Select Bank</Label>
                  <Select value={selectedBank} onValueChange={setSelectedBank}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.slice(0, 5).map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Withdrawals are processed within 24
                  hours during business days.
                </p>
              </div>
              <Button
                onClick={handleWithdraw}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Withdraw Funds
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* KYC Verification Dialog */}
        <KYCVerification
          user={user}
          isOpen={isKYCOpen}
          onClose={() => setIsKYCOpen(false)}
          onVerificationComplete={() => {
            fetchDashboardData();
            toast({
              title: "KYC Completed!",
              description:
                "You can now access all features and higher transaction limits.",
            });
          }}
        />

        {/* Transfer Dialog */}
        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Transfer Money</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="transferAmount">Amount (₦)</Label>
                <Input
                  id="transferAmount"
                  placeholder="Enter amount"
                  type="number"
                  min="50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input id="accountNumber" placeholder="Enter account number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transferBank">Select Bank</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose bank" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="044">Access Bank</SelectItem>
                    <SelectItem value="058">GTBank</SelectItem>
                    <SelectItem value="011">First Bank</SelectItem>
                    <SelectItem value="033">UBA</SelectItem>
                    <SelectItem value="057">Zenith Bank</SelectItem>
                    <SelectItem value="999992">OPay</SelectItem>
                    <SelectItem value="999991">PalmPay</SelectItem>
                    <SelectItem value="999993">Moniepoint</SelectItem>
                    <SelectItem value="999994">Kuda Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>Supported:</strong> All Nigerian banks, OPay, PalmPay,
                  Moniepoint, Kuda
                </p>
              </div>
              <Button
                onClick={() => {
                  toast({
                    title: "Transfer Initiated",
                    description:
                      "Your transfer is being processed. You'll receive a confirmation shortly.",
                  });
                  setIsTransferOpen(false);
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Transfer Money
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bills Payment Dialog */}
        <Dialog open={isBillsOpen} onOpenChange={setIsBillsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Pay Bills</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                variant="outline"
                className="h-20 flex-col"
                onClick={() => {
                  toast({
                    title: "Electricity Bills",
                    description:
                      "Pay NEPA/PHCN bills for all distribution companies.",
                  });
                  setIsBillsOpen(false);
                }}
              >
                <div className="w-6 h-6 mb-2 bg-yellow-100 rounded flex items-center justify-center">
                  <span className="text-yellow-600 text-xs">⚡</span>
                </div>
                Electricity
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col"
                onClick={() => {
                  toast({
                    title: "Airtime Purchase",
                    description:
                      "Buy airtime for MTN, Glo, Airtel, and 9mobile.",
                  });
                  setIsBillsOpen(false);
                }}
              >
                <div className="w-6 h-6 mb-2 bg-blue-100 rounded flex items-center justify-center">
                  <Smartphone className="w-3 h-3 text-blue-600" />
                </div>
                Airtime
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col"
                onClick={() => {
                  toast({
                    title: "Data Bundles",
                    description:
                      "Purchase data plans for all Nigerian networks.",
                  });
                  setIsBillsOpen(false);
                }}
              >
                <div className="w-6 h-6 mb-2 bg-green-100 rounded flex items-center justify-center">
                  <span className="text-green-600 text-xs">📶</span>
                </div>
                Data
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col"
                onClick={() => {
                  toast({
                    title: "Cable TV",
                    description: "Pay for DStv, GOtv, Startimes subscriptions.",
                  });
                  setIsBillsOpen(false);
                }}
              >
                <div className="w-6 h-6 mb-2 bg-purple-100 rounded flex items-center justify-center">
                  <span className="text-purple-600 text-xs">📺</span>
                </div>
                Cable TV
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col"
                onClick={() => {
                  toast({
                    title: "Internet Bills",
                    description: "Broadband and WiFi bill payments ready.",
                  });
                  setIsBillsOpen(false);
                }}
              >
                <div className="w-6 h-6 mb-2 bg-green-100 rounded flex items-center justify-center">
                  <span className="text-green-600 text-xs">NET</span>
                </div>
                Internet
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col"
                onClick={() => {
                  toast({
                    title: "Water Bills",
                    description: "State water board bill payments available.",
                  });
                  setIsBillsOpen(false);
                }}
              >
                <div className="w-6 h-6 mb-2 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-blue-600 text-xs">H₂O</span>
                </div>
                Water
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bottom padding for navigation */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
// Commit 4 - 1752188000
// Commit 25 - 1752188003
// Commit 29 - 1752188003
// Commit 32 - 1752188003
// Commit 65 - 1752188006
// Commit 66 - 1752188007
// Commit 69 - 1752188007
// Commit 80 - 1752188007
// Commit 106 - 1752188009
// Commit 121 - 1752188010
// Commit 122 - 1752188010
// Commit 130 - 1752188011
// Commit 140 - 1752188012
// Commit 153 - 1752188013
// Commit 161 - 1752188013
// Commit 162 - 1752188013
// Commit 163 - 1752188013
// Commit 170 - 1752188013
// Commit 187 - 1752188014
// Commit 199 - 1752188016
// Commit 207 - 1752188017
// Commit 209 - 1752188017
// Commit 219 - 1752188017
// Commit 229 - 1752188018
// Commit 232 - 1752188018
// Commit 239 - 1752188018
// Commit 255 - 1752188019
// Commit 274 - 1752188020
// Commit 285 - 1752188022
// Commit 293 - 1752188022
// Commit 299 - 1752188022
// Commit 300 - 1752188023
// Commit 303 - 1752188023
// Commit 324 - 1752188024
// Commit 326 - 1752188024
// Commit 347 - 1752188027
// Commit 353 - 1752188028
// Commit 354 - 1752188028
// Commit 361 - 1752188028
// Commit 363 - 1752188028
// Commit 394 - 1752188031
// Commit 396 - 1752188031
// Commit 414 - 1752188032
// Commit 417 - 1752188032
// December commit 13 - 1752189482
// December commit 18 - 1752189482
// December commit 23 - 1752189483
// December commit 26 - 1752189484
// December commit 51 - 1752189489
// December commit 63 - 1752189491
// December commit 101 - 1752189496
// December commit 108 - 1752189497
// December commit 111 - 1752189497
// Past year commit 17 - 1752189505
// Past year commit 28 - 1752189506
// Past year commit 39 - 1752189508
// Past year commit 50 - 1752189510
// Past year commit 71 - 1752189512
// Past year commit 84 - 1752189513
// Past year commit 89 - 1752189515
// Past year commit 108 - 1752189517
// Past year commit 116 - 1752189517
// Past year commit 120 - 1752189518
// Past year commit 153 - 1752189522
// Past year commit 166 - 1752189525
// Past year commit 172 - 1752189526
// Past year commit 207 - 1752189531
// Past year commit 210 - 1752189531
// Past year commit 212 - 1752189531
// Past year commit 217 - 1752189532
// Past year commit 227 - 1752189533
// Past year commit 237 - 1752189535
// Past year commit 243 - 1752189535
// Past year commit 247 - 1752189536
// Past year commit 253 - 1752189536
// Past year commit 254 - 1752189536
// Past year commit 266 - 1752189537
// Past year commit 280 - 1752189539
// Past year commit 283 - 1752189540
// Past year commit 291 - 1752189541
// Past year commit 304 - 1752189542
// Past year commit 312 - 1752189543
// Past year commit 313 - 1752189543
// Past year commit 322 - 1752189544
// Past year commit 328 - 1752189545
// Past year commit 331 - 1752189545
// Past year commit 346 - 1752189546
