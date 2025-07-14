import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Award,
  Shield,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Building,
  Banknote,
  Zap,
} from "lucide-react";

interface InvestmentProduct {
  id: string;
  name: string;
  category: "treasury_bills" | "bonds" | "mutual_funds" | "fixed_deposit";
  description: string;
  minimumAmount: number;
  currentYield: number;
  duration: number; // in days
  riskLevel: "low" | "medium" | "high";
  provider: string;
  totalInvested: number;
  availableUnits: number;
  status: "active" | "sold_out" | "upcoming";
  maturityDate?: string;
  features: string[];
}

interface UserInvestment {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  units: number;
  currentValue: number;
  returns: number;
  returnPercentage: number;
  startDate: string;
  maturityDate: string;
  status: "active" | "matured" | "liquidated";
  category: string;
}

interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalReturns: number;
  returnPercentage: number;
  activeInvestments: number;
}

export default function InvestmentProducts() {
  const [activeTab, setActiveTab] = useState<
    "products" | "portfolio" | "performance"
  >("products");
  const [products, setProducts] = useState<InvestmentProduct[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [portfolioSummary, setPortfolioSummary] =
    useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] =
    useState<InvestmentProduct | null>(null);
  const [showInvestDialog, setShowInvestDialog] = useState(false);

  // Form state
  const [investmentAmount, setInvestmentAmount] = useState("");

  useEffect(() => {
    loadInvestmentData();
  }, []);

    const loadInvestmentData = async () => {
    try {
      // Fetch real investment products from API
      const response = await fetch('/investments/products');
      const result = await response.json();

      if (result.success) {
        setProducts(result.data.products);
        setUserInvestments(result.data.userInvestments);
        setPortfolioSummary(result.data.portfolioSummary);
        setLoading(false);
        return;
      } else {
        throw new Error(result.error || 'Failed to load investment data');
      }
    } catch (error) {
      console.error('Error fetching investment data:', error);

      // Show user-friendly error
      toast({
        title: "Warning",
        description: "Unable to load live investment data. Please check your connection and try again.",
        variant: "destructive",
      });

      // Fallback to basic sample data
      const fallbackProducts: InvestmentProduct[] = [
        {
          id: "1",
          name: "91-Day Treasury Bills",
          category: "treasury_bills",
          description:
            "Short-term government securities backed by the Central Bank of Nigeria",
          minimumAmount: 100000,
          currentYield: 14.5,
          duration: 91,
          riskLevel: "low",
          provider: "CBN via InvestNaija",
          totalInvested: 2500000000,
          availableUnits: 1000000,
          status: "active",
          features: [
            "Government guaranteed",
            "Quarterly returns",
            "High liquidity",
            "Tax efficient",
          ],
        },
        {
          id: "2",
          name: "182-Day Treasury Bills",
          category: "treasury_bills",
          description: "Medium-term government securities with higher yields",
          minimumAmount: 100000,
          currentYield: 15.2,
          duration: 182,
          riskLevel: "low",
          provider: "CBN via InvestNaija",
          totalInvested: 1800000000,
          availableUnits: 800000,
          status: "active",
          features: [
            "Government guaranteed",
            "Bi-annual returns",
            "Competitive rates",
            "Secondary market trading",
          ],
        },
        {
          id: "3",
          name: "365-Day Treasury Bills",
          category: "treasury_bills",
          description: "Long-term treasury bills with maximum returns",
          minimumAmount: 100000,
          currentYield: 16.8,
          duration: 365,
          riskLevel: "low",
          provider: "CBN via InvestNaija",
          totalInvested: 3200000000,
          availableUnits: 1500000,
          status: "active",
          features: [
            "Government guaranteed",
            "Annual returns",
            "Highest treasury yield",
            "Capital preservation",
          ],
        },
        {
          id: "4",
          name: "FGN Savings Bond 2027",
          category: "bonds",
          description:
            "Federal Government of Nigeria retail bonds for individual investors",
          minimumAmount: 5000,
          currentYield: 13.5,
          duration: 1095, // 3 years
          riskLevel: "low",
          provider: "FGN via InvestNaija",
          totalInvested: 850000000,
          availableUnits: 200000,
          status: "active",
          maturityDate: "2027-12-31",
          features: [
            "Low minimum investment",
            "Quarterly coupon payments",
            "Government guaranteed",
            "Early redemption allowed",
          ],
        },
        {
          id: "5",
          name: "Stanbic Money Market Fund",
          category: "mutual_funds",
          description:
            "Diversified money market fund investing in high-quality short-term securities",
          minimumAmount: 10000,
          currentYield: 12.8,
          duration: 30, // Open-ended, minimum holding
          riskLevel: "low",
          provider: "Stanbic IBTC Asset Management",
          totalInvested: 4500000000,
          availableUnits: 999999,
          status: "active",
          features: [
            "Daily liquidity",
            "Professional management",
            "Diversified portfolio",
            "Competitive returns",
          ],
        },
        {
          id: "6",
          name: "ARM Equity Fund",
          category: "mutual_funds",
          description:
            "Growth-focused equity fund investing in Nigerian blue-chip stocks",
          minimumAmount: 25000,
          currentYield: 18.5,
          duration: 365, // Recommended minimum
          riskLevel: "high",
          provider: "ARM Investment Managers",
          totalInvested: 2200000000,
          availableUnits: 500000,
          status: "active",
          features: [
            "High growth potential",
            "Blue-chip portfolio",
            "Professional management",
            "Quarterly distributions",
          ],
        },
        {
          id: "7",
          name: "InvestNaija Fixed Deposit",
          category: "fixed_deposit",
          description:
            "High-yield fixed deposit with guaranteed returns and flexible tenure",
          minimumAmount: 50000,
          currentYield: 11.5,
          duration: 180,
          riskLevel: "low",
          provider: "InvestNaija",
          totalInvested: 1200000000,
          availableUnits: 999999,
          status: "active",
          features: [
            "Guaranteed returns",
            "Flexible tenure",
            "NDIC insured",
            "Auto-renewal option",
          ],
        },
      ];

      // Mock user investments
      const mockUserInvestments: UserInvestment[] = [
        {
          id: "1",
          productId: "1",
          productName: "91-Day Treasury Bills",
          amount: 500000,
          units: 5000,
          currentValue: 518750,
          returns: 18750,
          returnPercentage: 3.75,
          startDate: "2024-01-15",
          maturityDate: "2024-04-15",
          status: "active",
          category: "treasury_bills",
        },
        {
          id: "2",
          productId: "5",
          productName: "Stanbic Money Market Fund",
          amount: 250000,
          units: 25000,
          currentValue: 266000,
          returns: 16000,
          returnPercentage: 6.4,
          startDate: "2023-12-01",
          maturityDate: "2024-12-01",
          status: "active",
          category: "mutual_funds",
        },
        {
          id: "3",
          productId: "7",
          productName: "InvestNaija Fixed Deposit",
          amount: 1000000,
          units: 10000,
          currentValue: 1057500,
          returns: 57500,
          returnPercentage: 5.75,
          startDate: "2023-11-01",
          maturityDate: "2024-05-01",
          status: "active",
          category: "fixed_deposit",
        },
      ];

      // Calculate portfolio summary
      const totalInvested = mockUserInvestments.reduce(
        (sum, inv) => sum + inv.amount,
        0,
      );
      const currentValue = mockUserInvestments.reduce(
        (sum, inv) => sum + inv.currentValue,
        0,
      );
      const totalReturns = currentValue - totalInvested;
      const returnPercentage = (totalReturns / totalInvested) * 100;

      const mockPortfolioSummary: PortfolioSummary = {
        totalInvested,
        currentValue,
        totalReturns,
        returnPercentage,
        activeInvestments: mockUserInvestments.filter(
          (inv) => inv.status === "active",
        ).length,
      };

            // Create basic sample data for fallback
      setProducts([
        {
          id: "sample_treasury",
          name: "Treasury Bills",
          category: "treasury_bills",
          description: "Government-backed short-term securities",
          minimumAmount: 1000,
          currentYield: 15.0,
          duration: 91,
          riskLevel: "low",
          provider: "Central Bank of Nigeria",
          totalInvested: 0,
          availableUnits: 1000,
          status: "active",
          features: ["Government guaranteed", "Low risk", "Flexible duration"],
        },
      ]);
      setUserInvestments([]);
      setPortfolioSummary({
        totalInvested: 0,
        currentValue: 0,
        totalReturns: 0,
        returnPercentage: 0,
        activeInvestments: 0,
      });
    } catch (error) {
      console.error("Failed to load investment data:", error);
      toast({
        title: "Error",
        description: "Unable to load investment data. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!selectedProduct || !investmentAmount) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid investment amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(investmentAmount);
    if (amount < selectedProduct.minimumAmount) {
      toast({
        title: "Minimum Amount Required",
        description: `Minimum investment is ${formatCurrency(selectedProduct.minimumAmount)}`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate maturity date
      const startDate = new Date();
      const maturityDate = new Date(startDate);
      maturityDate.setDate(startDate.getDate() + selectedProduct.duration);

      // Calculate projected returns
      const projectedReturns =
        (amount * selectedProduct.currentYield * selectedProduct.duration) /
        (365 * 100);
      const projectedValue = amount + projectedReturns;

      const newInvestment: UserInvestment = {
        id: Date.now().toString(),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        amount,
        units: Math.floor(amount / 100), // Simplified unit calculation
        currentValue: amount, // Will grow over time
        returns: 0, // Will accrue over time
        returnPercentage: 0,
        startDate: startDate.toISOString().split("T")[0],
        maturityDate: maturityDate.toISOString().split("T")[0],
        status: "active",
        category: selectedProduct.category,
      };

      setUserInvestments([...userInvestments, newInvestment]);

      // Update portfolio summary
      if (portfolioSummary) {
        const updatedSummary: PortfolioSummary = {
          totalInvested: portfolioSummary.totalInvested + amount,
          currentValue: portfolioSummary.currentValue + amount,
          totalReturns: portfolioSummary.totalReturns,
          returnPercentage:
            (portfolioSummary.totalReturns /
              (portfolioSummary.totalInvested + amount)) *
            100,
          activeInvestments: portfolioSummary.activeInvestments + 1,
        };
        setPortfolioSummary(updatedSummary);
      }

      setInvestmentAmount("");
      setSelectedProduct(null);
      setShowInvestDialog(false);

      toast({
        title: "Investment Successful!",
        description: `Successfully invested ${formatCurrency(amount)} in ${selectedProduct.name}`,
      });
    } catch (error) {
      toast({
        title: "Investment Failed",
        description: "Failed to process your investment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "treasury_bills":
        return <Building className="w-5 h-5" />;
      case "bonds":
        return <Shield className="w-5 h-5" />;
      case "mutual_funds":
        return <PieChart className="w-5 h-5" />;
      case "fixed_deposit":
        return <Banknote className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "treasury_bills":
        return "bg-blue-100 text-blue-800";
      case "bonds":
        return "bg-green-100 text-green-800";
      case "mutual_funds":
        return "bg-purple-100 text-purple-800";
      case "fixed_deposit":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Investment Products
          </h2>
          <p className="text-gray-600">
            Grow your wealth with treasury bills, bonds, and mutual funds
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Market Analysis
          </Button>
          <Button className="bg-naira-green text-white">
            <Target className="w-4 h-4 mr-2" />
            Investment Calculator
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {portfolioSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Invested
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(portfolioSummary.totalInvested)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-naira-light rounded-lg">
                  <TrendingUp className="w-5 h-5 text-naira-green" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Current Value
                  </p>
                  <p className="text-xl font-bold">
                    {formatCurrency(portfolioSummary.currentValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Returns
                  </p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(portfolioSummary.totalReturns)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatPercentage(portfolioSummary.returnPercentage)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Active Investments
                  </p>
                  <p className="text-xl font-bold">
                    {portfolioSummary.activeInvestments}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: "products", label: "Investment Products", icon: Target },
          { key: "portfolio", label: "My Portfolio", icon: PieChart },
          { key: "performance", label: "Performance", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-white text-naira-green shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Investment Products Tab */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-naira-light rounded-lg">
                      {getCategoryIcon(product.category)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      <p className="text-sm text-gray-600">
                        {product.provider}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getCategoryColor(product.category)}>
                      {product.category.replace("_", " ")}
                    </Badge>
                    <Badge className={getRiskColor(product.riskLevel)}>
                      {product.riskLevel} risk
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{product.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Annual Yield
                    </p>
                    <p className="text-xl font-bold text-naira-green">
                      {formatPercentage(product.currentYield)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Duration
                    </p>
                    <p className="text-lg font-semibold">
                      {product.duration} days
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Minimum Investment
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(product.minimumAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    Key Features
                  </p>
                  <div className="space-y-1">
                    {product.features.slice(0, 2).map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-xs text-gray-600"
                      >
                        <div className="w-1 h-1 bg-naira-green rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button variant="outline" size="sm" className="flex-1">
                    Learn More
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-naira-green text-white"
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowInvestDialog(true);
                    }}
                    disabled={product.status !== "active"}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Invest Now
                  </Button>
                </div>

                {product.status !== "active" && (
                  <div className="text-center text-sm text-gray-500">
                    {product.status === "sold_out" ? "Sold Out" : "Coming Soon"}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">My Investments</h3>
          <div className="space-y-4">
            {userInvestments.map((investment) => (
              <Card key={investment.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-naira-light rounded-lg">
                        {getCategoryIcon(investment.category)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {investment.productName}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>
                            Started{" "}
                            {new Date(
                              investment.startDate,
                            ).toLocaleDateString()}
                          </span>
                          <span>
                            Matures{" "}
                            {new Date(
                              investment.maturityDate,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold">
                          {formatCurrency(investment.currentValue)}
                        </span>
                        {investment.returns > 0 ? (
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        <span>
                          {investment.returns > 0 ? "+" : ""}
                          {formatCurrency(investment.returns)} (
                          {formatPercentage(investment.returnPercentage)})
                        </span>
                      </div>
                      <Badge
                        className={
                          investment.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }
                      >
                        {investment.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Principal</p>
                      <p className="font-semibold">
                        {formatCurrency(investment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Units</p>
                      <p className="font-semibold">
                        {investment.units.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Days to Maturity</p>
                      <p className="font-semibold">
                        {Math.max(
                          0,
                          Math.ceil(
                            (new Date(investment.maturityDate).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24),
                          ),
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Action</p>
                      <Button variant="outline" size="sm">
                        {investment.status === "active" ? "Monitor" : "Renew"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {userInvestments.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Investments Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start your investment journey with as little as ₦5,000
                  </p>
                  <Button
                    className="bg-naira-green text-white"
                    onClick={() => setActiveTab("products")}
                  >
                    Browse Investment Products
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Performance Analytics</h3>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Portfolio Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold text-green-600">+3.2%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last 3 Months</span>
                    <span className="font-semibold text-green-600">+8.7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Year</span>
                    <span className="font-semibold text-green-600">+12.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Asset Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Treasury Bills
                    </span>
                    <span className="font-semibold">28.6%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Mutual Funds</span>
                    <span className="font-semibold">14.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Fixed Deposits
                    </span>
                    <span className="font-semibold">57.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Risk Score</span>
                    <span className="font-semibold text-green-600">Low</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Volatility</span>
                    <span className="font-semibold">2.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Sharpe Ratio</span>
                    <span className="font-semibold">1.8</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Investment Dialog */}
      <Dialog open={showInvestDialog} onOpenChange={setShowInvestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Invest in {selectedProduct?.name || "Investment"}
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-naira-light rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Annual Yield:</span>
                    <span className="font-semibold ml-2">
                      {formatPercentage(selectedProduct.currentYield)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-semibold ml-2">
                      {selectedProduct.duration} days
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Risk Level:</span>
                    <span className="font-semibold ml-2">
                      {selectedProduct.riskLevel}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Minimum:</span>
                    <span className="font-semibold ml-2">
                      {formatCurrency(selectedProduct.minimumAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="investmentAmount">Investment Amount (₦)</Label>
                <Input
                  id="investmentAmount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(e.target.value)}
                  placeholder={selectedProduct.minimumAmount.toString()}
                  min={selectedProduct.minimumAmount}
                />
                <p className="text-xs text-gray-500">
                  Minimum investment:{" "}
                  {formatCurrency(selectedProduct.minimumAmount)}
                </p>
              </div>

              {investmentAmount &&
                parseFloat(investmentAmount) >=
                  selectedProduct.minimumAmount && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">
                      Projected Returns
                    </h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Investment Amount:</span>
                        <span>
                          {formatCurrency(parseFloat(investmentAmount))}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Projected Returns:</span>
                        <span>
                          {formatCurrency(
                            (parseFloat(investmentAmount) *
                              selectedProduct.currentYield *
                              selectedProduct.duration) /
                              (365 * 100),
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total at Maturity:</span>
                        <span>
                          {formatCurrency(
                            parseFloat(investmentAmount) +
                              (parseFloat(investmentAmount) *
                                selectedProduct.currentYield *
                                selectedProduct.duration) /
                                (365 * 100),
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowInvestDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-naira-green text-white"
                  onClick={handleInvest}
                >
                  Invest Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}