import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  BarChart3,
  DollarSign,
  Plus,
  ArrowDownLeft,
  Shield,
  Clock,
  Target,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { apiService } from "../lib/api";
import { PortfolioData } from "@shared/api";
import BottomNavigation from "../components/BottomNavigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function Portfolio() {
  const { user } = useAuth();
  const [isInvestOpen, setIsInvestOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [investAmount, setInvestAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedInvestmentType, setSelectedInvestmentType] =
    useState("money_market");
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(
    null,
  );
  const [investmentProducts, setInvestmentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();
    fetchInvestmentProducts();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      const response = await apiService.getPortfolioData();
      if (response.success) {
        setPortfolioData(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio data:", error);
      toast({
        title: "Error",
        description: "Failed to load portfolio data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestmentProducts = async () => {
    try {
      const response = await apiService.getInvestmentProducts();
      if (response.success) {
        setInvestmentProducts(response.products);
      }
    } catch (error) {
      console.error("Failed to fetch investment products:", error);
    }
  };

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleInvest = async () => {
    if (!investAmount || parseFloat(investAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to invest.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(investAmount);
    const selectedProduct = investmentProducts.find(
      (p) => p.id === selectedInvestmentType,
    );

    if (selectedProduct && amount < selectedProduct.minAmount) {
      toast({
        title: "Amount Too Low",
        description: `Minimum investment for ${selectedProduct.name} is ${formatNaira(selectedProduct.minAmount)}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiService.investMoney(
        amount,
        selectedInvestmentType,
      );
      toast({
        title: "Investment Successful",
        description:
          response.message || `Successfully invested ${formatNaira(amount)}.`,
      });
      setInvestAmount("");
      setIsInvestOpen(false);
      fetchPortfolioData(); // Refresh data
    } catch (error) {
      toast({
        title: "Investment Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process investment",
        variant: "destructive",
      });
    }
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

    if (!selectedInvestmentId) {
      toast({
        title: "No Investment Selected",
        description: "Please select an investment to withdraw from.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiService.withdrawInvestment(
        selectedInvestmentId,
        parseFloat(withdrawAmount),
      );
      toast({
        title: "Withdrawal Successful",
        description:
          response.message ||
          `Successfully withdrew ${formatNaira(parseFloat(withdrawAmount))}.`,
      });
      setWithdrawAmount("");
      setIsWithdrawOpen(false);
      fetchPortfolioData(); // Refresh data
    } catch (error) {
      toast({
        title: "Withdrawal Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process withdrawal",
        variant: "destructive",
      });
    }
  };

  const handleExportData = () => {
    toast({
      title: "Export Started",
      description: "Your portfolio data is being prepared for download.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-naira-green rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-sm">₦</span>
          </div>
          <div className="animate-spin w-6 h-6 border-2 border-naira-green border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Portfolio</h1>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={handleExportData}
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Portfolio Overview */}
        <Card className="bg-gradient-to-br from-naira-green to-green-600 text-white">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <p className="text-green-100 text-sm mb-1">
                Total Portfolio Value
              </p>
              <h2 className="text-3xl font-bold">
                {formatNaira(
                  (portfolioData?.wallet.totalInvested || 0) +
                    (portfolioData?.wallet.totalReturns || 0),
                )}
              </h2>
              <div className="flex items-center justify-center mt-2">
                {(portfolioData?.wallet.totalReturns || 0) >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                <span className="text-sm">
                  {portfolioData?.wallet.totalReturns
                    ? `${portfolioData.wallet.totalReturns >= 0 ? "+" : ""}${formatNaira(portfolioData.wallet.totalReturns)} (${portfolioData.performance.allTime.toFixed(1)}%)`
                    : "No returns yet"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-500/30">
              <div className="text-center">
                <p className="text-green-100 text-xs">Total Invested</p>
                <p className="font-semibold">
                  {formatNaira(portfolioData?.wallet.totalInvested || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-green-100 text-xs">Total Returns</p>
                <p className="font-semibold">
                  {formatNaira(portfolioData?.wallet.totalReturns || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Investment Status Alerts */}
        {user?.kycStatus !== "verified" && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Complete your KYC verification to unlock higher investment limits
              (currently limited to ₦50,000).
              <Link to="/onboarding" className="ml-1 underline font-medium">
                Verify now
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {(portfolioData?.wallet.totalInvested || 0) === 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Target className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Start your investment journey! Even ₦100 can grow significantly
              over time with compound returns.
            </AlertDescription>
          </Alert>
        )}

        {/* Performance Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="growth" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="growth">Growth</TabsTrigger>
                <TabsTrigger value="allocation">Allocation</TabsTrigger>
              </TabsList>

              <TabsContent value="growth" className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { month: "Jan", value: 10000 },
                        { month: "Feb", value: 11200 },
                        { month: "Mar", value: 12800 },
                        { month: "Apr", value: 14100 },
                        { month: "May", value: 15900 },
                        { month: "Jun", value: 17300 },
                      ]}
                    >
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500">7 Days</p>
                    <p
                      className={`font-semibold ${(portfolioData?.performance.sevenDays || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {(portfolioData?.performance.sevenDays || 0) >= 0
                        ? "+"
                        : ""}
                      {portfolioData?.performance.sevenDays?.toFixed(1) ||
                        "0.0"}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">30 Days</p>
                    <p
                      className={`font-semibold ${(portfolioData?.performance.thirtyDays || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {(portfolioData?.performance.thirtyDays || 0) >= 0
                        ? "+"
                        : ""}
                      {portfolioData?.performance.thirtyDays?.toFixed(1) ||
                        "0.0"}
                      %
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">All Time</p>
                    <p
                      className={`font-semibold ${(portfolioData?.performance.allTime || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {(portfolioData?.performance.allTime || 0) >= 0
                        ? "+"
                        : ""}
                      {portfolioData?.performance.allTime?.toFixed(1) || "0.0"}%
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="allocation" className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Money Market", value: 45, color: "#10b981" },
                          {
                            name: "Treasury Bills",
                            value: 30,
                            color: "#3b82f6",
                          },
                          {
                            name: "Corporate Bonds",
                            value: 15,
                            color: "#f59e0b",
                          },
                          { name: "Cash", value: 10, color: "#6b7280" },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[
                          { name: "Money Market", value: 45, color: "#10b981" },
                          {
                            name: "Treasury Bills",
                            value: 30,
                            color: "#3b82f6",
                          },
                          {
                            name: "Corporate Bonds",
                            value: 15,
                            color: "#f59e0b",
                          },
                          { name: "Cash", value: 10, color: "#6b7280" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-naira-green rounded-full"></div>
                      <span className="text-sm">Money Market Fund</span>
                    </div>
                    <span className="text-sm font-medium">
                      {portfolioData?.allocation.moneyMarket?.toFixed(0) || 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Treasury Bills</span>
                    </div>
                    <span className="text-sm font-medium">
                      {portfolioData?.allocation.treasuryBills?.toFixed(0) || 0}
                      %
                    </span>
                  </div>
                  {(portfolioData?.allocation.moneyMarket || 0) === 0 &&
                    (portfolioData?.allocation.treasuryBills || 0) === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No investments yet</p>
                        <p className="text-xs">
                          Start investing to see your allocation
                        </p>
                      </div>
                    )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Holdings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current Holdings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-naira-light/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-naira-green rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    Money Market Fund
                  </h3>
                  <p className="text-sm text-gray-500">
                    Stanbic IBTC Asset Mgmt
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatNaira(33894.13)}
                </p>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs">+4.2%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    91-Day Treasury Bills
                  </h3>
                  <p className="text-sm text-gray-500">
                    Federal Government of Nigeria
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatNaira(11298.04)}
                </p>
                <div className="flex items-center text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span className="text-xs">+2.1%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Investments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Auto Round-up</p>
                <p className="text-sm text-gray-500">Today, 2:30 PM</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  +{formatNaira(67.5)}
                </p>
                <Badge variant="secondary" className="text-xs">
                  Money Market
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Weekly Auto-invest</p>
                <p className="text-sm text-gray-500">Monday, 9:00 AM</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  +{formatNaira(1000.0)}
                </p>
                <Badge variant="secondary" className="text-xs">
                  Money Market
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Manual Investment</p>
                <p className="text-sm text-gray-500">Last Friday, 11:45 AM</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  +{formatNaira(5000.0)}
                </p>
                <Badge variant="outline" className="text-xs">
                  Treasury Bills
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full text-naira-green"
              onClick={() => {
                // Navigate to detailed transaction history
                window.location.href = "/transactions?type=investment";
              }}
            >
              View All Transactions
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Dialog open={isInvestOpen} onOpenChange={setIsInvestOpen}>
            <DialogTrigger asChild>
              <Button className="bg-naira-green hover:bg-green-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Invest More
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Investment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="investment-type">Investment Type</Label>
                  <Select
                    value={selectedInvestmentType}
                    onValueChange={setSelectedInvestmentType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose investment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {investmentProducts.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.expectedReturn}% p.a.
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invest-amount">Amount (NGN)</Label>
                  <Input
                    id="invest-amount"
                    type="number"
                    placeholder="Enter amount to invest"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                  />
                </div>

                {selectedInvestmentType &&
                  investmentProducts.find(
                    (p) => p.id === selectedInvestmentType,
                  ) && (
                    <div className="bg-naira-light/30 p-3 rounded-lg">
                      {(() => {
                        const product = investmentProducts.find(
                          (p) => p.id === selectedInvestmentType,
                        );
                        return (
                          <div className="text-sm">
                            <h4 className="font-medium text-gray-900 mb-2">
                              {product.name}
                            </h4>
                            <ul className="space-y-1 text-gray-600">
                              <li>
                                • Expected Return: {product.expectedReturn}% per
                                annum
                              </li>
                              <li>
                                • Minimum Amount:{" "}
                                {formatNaira(product.minAmount)}
                              </li>
                              <li>• Risk Level: {product.riskLevel}</li>
                              <li>• Duration: {product.duration}</li>
                              <li>• Provider: {product.provider}</li>
                            </ul>
                            {investAmount &&
                              parseFloat(investAmount) >= product.minAmount && (
                                <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                                  <p className="text-green-800 text-xs">
                                    Estimated annual return:{" "}
                                    {formatNaira(
                                      parseFloat(investAmount) *
                                        (product.expectedReturn / 100),
                                    )}
                                  </p>
                                </div>
                              )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <Shield className="w-4 h-4 inline mr-1" />
                    Your investments are protected and managed by licensed fund
                    managers.
                  </p>
                </div>

                <Button
                  onClick={handleInvest}
                  className="w-full bg-naira-green hover:bg-green-600 text-white"
                  disabled={!investAmount || parseFloat(investAmount) <= 0}
                >
                  Invest Now
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="border-naira-green text-naira-green"
              >
                <ArrowDownLeft className="w-4 h-4 mr-2" />
                Withdraw Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Withdraw Investment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {portfolioData?.investments &&
                portfolioData.investments.length > 0 ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="investment-select">
                        Select Investment
                      </Label>
                      <Select
                        value={selectedInvestmentId}
                        onValueChange={setSelectedInvestmentId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose investment to withdraw from" />
                        </SelectTrigger>
                        <SelectContent>
                          {portfolioData.investments
                            .filter((inv) => inv.status === "active")
                            .map((investment) => (
                              <SelectItem
                                key={investment.id}
                                value={investment.id}
                              >
                                {investment.type.replace("_", " ")} -{" "}
                                {formatNaira(investment.currentValue)}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount (NGN)</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="Enter amount to withdraw"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                      />
                    </div>

                    {selectedInvestmentId && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {(() => {
                          const selectedInvestment =
                            portfolioData.investments.find(
                              (inv) => inv.id === selectedInvestmentId,
                            );
                          if (!selectedInvestment) return null;
                          return (
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">
                                Investment Details
                              </p>
                              <p className="text-gray-600">
                                Available:{" "}
                                {formatNaira(selectedInvestment.currentValue)}
                              </p>
                              <p className="text-gray-600">
                                Original:{" "}
                                {formatNaira(selectedInvestment.amount)}
                              </p>
                              <p className="text-gray-600">
                                Returns:{" "}
                                {formatNaira(selectedInvestment.returns)}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-800">
                        <Clock className="w-4 h-4 inline mr-1" />
                        Withdrawals are processed within 24 hours. Early
                        withdrawal may affect your returns.
                      </p>
                    </div>

                    <Button
                      onClick={handleWithdraw}
                      className="w-full bg-naira-green hover:bg-green-600 text-white"
                      disabled={
                        !selectedInvestmentId ||
                        !withdrawAmount ||
                        parseFloat(withdrawAmount) <= 0
                      }
                    >
                      Continue Withdrawal
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-12 h-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      No Active Investments
                    </h3>
                    <p>
                      You don't have any active investments to withdraw from.
                    </p>
                    <Button
                      onClick={() => {
                        setIsWithdrawOpen(false);
                        setIsInvestOpen(true);
                      }}
                      className="mt-4 bg-naira-green text-white"
                    >
                      Start Investing
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bottom padding for navigation */}
        <div className="h-20"></div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}
