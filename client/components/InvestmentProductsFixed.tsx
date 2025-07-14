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
import { toast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Shield,
  Clock,
  Building,
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
      const response = await fetch("/investments/products");
      const result = await response.json();

      if (result.success) {
        setProducts(result.data.products);
        setUserInvestments(result.data.userInvestments);
        setPortfolioSummary(result.data.portfolioSummary);
        setLoading(false);
        return;
      } else {
        throw new Error(result.error || "Failed to load investment data");
      }
    } catch (error) {
      console.error("Error fetching investment data:", error);

      // Show user-friendly error
      toast({
        title: "Connection Error",
        description:
          "Unable to load live investment data. Showing sample products.",
        variant: "destructive",
      });

      // Fallback to sample data
      setProducts([
        {
          id: "treasury_91",
          name: "91-Day Treasury Bills",
          category: "treasury_bills",
          description:
            "Short-term government securities backed by the Central Bank of Nigeria",
          minimumAmount: 1000,
          currentYield: 15.0,
          duration: 91,
          riskLevel: "low",
          provider: "Central Bank of Nigeria",
          totalInvested: 0,
          availableUnits: 1000,
          status: "active",
          features: [
            "Government guaranteed",
            "Low risk",
            "91-day maturity",
            "Competitive returns",
          ],
        },
        {
          id: "money_market",
          name: "Money Market Fund",
          category: "mutual_funds",
          description:
            "Low-risk fund investing in short-term financial instruments",
          minimumAmount: 100,
          currentYield: 12.5,
          duration: 30,
          riskLevel: "low",
          provider: "ARM Investment",
          totalInvested: 0,
          availableUnits: 5000,
          status: "active",
          features: [
            "Daily liquidity",
            "Professional management",
            "Diversified portfolio",
            "Low minimum investment",
          ],
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
      setLoading(false);
    }
  };

  const handleInvest = async () => {
    if (!selectedProduct || !investmentAmount) {
      toast({
        title: "Error",
        description: "Please enter an investment amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(investmentAmount);

    if (amount < selectedProduct.minimumAmount) {
      toast({
        title: "Error",
        description: `Minimum investment amount is ₦${selectedProduct.minimumAmount.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/wallet/invest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount,
          investmentType: selectedProduct.category,
          productId: selectedProduct.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: `Successfully invested ₦${amount.toLocaleString()} in ${selectedProduct.name}`,
        });
        setShowInvestDialog(false);
        setInvestmentAmount("");
        setSelectedProduct(null);
        loadInvestmentData(); // Refresh data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Investment error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Investment failed",
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

  const getRiskBadgeColor = (risk: string) => {
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading investment products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Investment Products</h2>
          <p className="text-gray-600">
            Grow your wealth with our curated investment options
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: "products", label: "Products" },
          { id: "portfolio", label: "My Portfolio" },
          { id: "performance", label: "Performance" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card
              key={product.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {product.provider}
                    </p>
                  </div>
                  <Badge className={getRiskBadgeColor(product.riskLevel)}>
                    {product.riskLevel.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{product.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-gray-600">Yield</p>
                      <p className="font-semibold">{product.currentYield}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-semibold">{product.duration} days</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-gray-600" />
                  <div>
                    <p className="text-gray-600">Minimum Investment</p>
                    <p className="font-semibold">
                      {formatCurrency(product.minimumAmount)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Dialog
                  open={showInvestDialog && selectedProduct?.id === product.id}
                  onOpenChange={(open) => {
                    setShowInvestDialog(open);
                    if (!open) {
                      setSelectedProduct(null);
                      setInvestmentAmount("");
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedProduct(product);
                        setShowInvestDialog(true);
                      }}
                      disabled={product.status !== "active"}
                    >
                      {product.status === "active"
                        ? "Invest Now"
                        : product.status === "sold_out"
                          ? "Sold Out"
                          : "Coming Soon"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invest in {product.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Expected Yield</p>
                          <p className="font-semibold text-green-600">
                            {product.currentYield}% p.a.
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Duration</p>
                          <p className="font-semibold">
                            {product.duration} days
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="amount">Investment Amount</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder={product.minimumAmount.toString()}
                          value={investmentAmount}
                          onChange={(e) => setInvestmentAmount(e.target.value)}
                          min={product.minimumAmount}
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Minimum: {formatCurrency(product.minimumAmount)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setShowInvestDialog(false);
                            setSelectedProduct(null);
                            setInvestmentAmount("");
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleInvest} className="flex-1">
                          Invest Now
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === "portfolio" && (
        <div className="space-y-6">
          {portfolioSummary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Invested</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(portfolioSummary.totalInvested)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Current Value</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(portfolioSummary.currentValue)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Returns</p>
                      <p
                        className={`text-xl font-bold ${
                          portfolioSummary.totalReturns >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(portfolioSummary.totalReturns)}
                      </p>
                    </div>
                    {portfolioSummary.totalReturns >= 0 ? (
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    ) : (
                      <TrendingDown className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Active Investments
                      </p>
                      <p className="text-xl font-bold">
                        {portfolioSummary.activeInvestments}
                      </p>
                    </div>
                    <Building className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {userInvestments.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Your Investments</h3>
              <div className="grid gap-4">
                {userInvestments.map((investment) => (
                  <Card key={investment.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold">
                            {investment.productName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Started: {investment.startDate}
                          </p>
                        </div>
                        <Badge
                          variant={
                            investment.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {investment.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-600">Invested</p>
                          <p className="font-semibold">
                            {formatCurrency(investment.amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Current Value</p>
                          <p className="font-semibold">
                            {formatCurrency(investment.currentValue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Returns</p>
                          <p
                            className={`font-semibold ${
                              investment.returns >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(investment.returns)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Return %</p>
                          <p
                            className={`font-semibold ${
                              investment.returnPercentage >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {investment.returnPercentage.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Investments Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start investing today to grow your wealth
                </p>
                <Button onClick={() => setActiveTab("products")}>
                  Browse Products
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === "performance" && (
        <Card>
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Performance Analytics Coming Soon
            </h3>
            <p className="text-gray-600">
              Detailed performance charts and analytics will be available soon
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
