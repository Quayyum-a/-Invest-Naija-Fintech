import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Search,
  Star,
  DollarSign,
  BarChart3,
  Eye,
  Plus,
  Minus,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import BottomNavigation from "../components/BottomNavigation";

interface CryptoCurrency {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface CryptoHolding {
  currency: string;
  symbol: string;
  amount: number;
  value: number;
  averagePrice: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export default function Crypto() {
  const [cryptos, setCryptos] = useState<CryptoCurrency[]>([]);
  const [holdings, setHoldings] = useState<CryptoHolding[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoCurrency | null>(
    null,
  );
  const [buyAmount, setBuyAmount] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [portfolioValue, setPortfolioValue] = useState(0);

  useEffect(() => {
    fetchCryptoData();
    fetchHoldings();
  }, []);

  const fetchCryptoData = async () => {
    try {
      setRefreshing(true);
      // Use actual API endpoint
      const response = await fetch("/api/crypto/market");
      const data = await response.json();

      if (data.success) {
        setCryptos(data.data);
      } else {
        // Fallback to mock data if API fails
        const mockCryptos: CryptoCurrency[] = [
          {
            id: "bitcoin",
            name: "Bitcoin",
            symbol: "BTC",
            current_price: 43250.45,
            price_change_percentage_24h: 2.45,
            market_cap: 848000000000,
            image:
              "https://raw.githubusercontent.com/cryptoicons/cryptoicons/master/svg/color/btc.svg",
            sparkline_in_7d: {
              price: [42000, 42500, 41800, 43000, 42800, 43500, 43250],
            },
          },
          {
            id: "ethereum",
            name: "Ethereum",
            symbol: "ETH",
            current_price: 2650.75,
            price_change_percentage_24h: -1.23,
            market_cap: 318000000000,
            image:
              "https://raw.githubusercontent.com/cryptoicons/cryptoicons/master/svg/color/eth.svg",
            sparkline_in_7d: {
              price: [2700, 2680, 2620, 2650, 2670, 2640, 2650],
            },
          },
          {
            id: "usdc",
            name: "USD Coin",
            symbol: "USDC",
            current_price: 1.0,
            price_change_percentage_24h: 0.01,
            market_cap: 28000000000,
            image:
              "https://raw.githubusercontent.com/cryptoicons/cryptoicons/master/svg/color/usdc.svg",
          },
          {
            id: "binancecoin",
            name: "BNB",
            symbol: "BNB",
            current_price: 312.45,
            price_change_percentage_24h: 3.67,
            market_cap: 46000000000,
            image:
              "https://raw.githubusercontent.com/cryptoicons/cryptoicons/master/svg/color/bnb.svg",
          },
          {
            id: "cardano",
            name: "Cardano",
            symbol: "ADA",
            current_price: 0.485,
            price_change_percentage_24h: -2.15,
            market_cap: 17000000000,
            image:
              "https://raw.githubusercontent.com/cryptoicons/cryptoicons/master/svg/color/ada.svg",
          },
        ];

        setCryptos(mockCryptos);
      }
    } catch (error) {
      console.error("Failed to fetch crypto data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch cryptocurrency data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchHoldings = async () => {
    try {
      const response = await fetch("/api/crypto/holdings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("investnaija_token")}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setHoldings(data.data.holdings || []);
        setPortfolioValue(data.data.portfolioValue || 0);
      } else {
        // No dummy data - start with empty portfolio
        setHoldings([]);
        setPortfolioValue(0);
      }
    } catch (error) {
      console.error("Failed to fetch holdings:", error);
      setHoldings([]);
      setPortfolioValue(0);
    }
  };

  const formatPrice = (price: number) => {
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) {
      return `$${(cap / 1e12).toFixed(2)}T`;
    }
    if (cap >= 1e9) {
      return `$${(cap / 1e9).toFixed(2)}B`;
    }
    if (cap >= 1e6) {
      return `$${(cap / 1e6).toFixed(2)}M`;
    }
    return `$${cap.toLocaleString()}`;
  };

  const filteredCryptos = cryptos.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleBuy = async () => {
    if (!selectedCrypto || !buyAmount || parseFloat(buyAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use API to buy crypto
      const response = await fetch("/api/crypto/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("investnaija_token")}`,
        },
        body: JSON.stringify({
          cryptoId: selectedCrypto.id,
          amount: parseFloat(buyAmount),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Purchase Successful!",
          description:
            data.message ||
            `Successfully bought $${buyAmount} worth of ${selectedCrypto.name}`,
        });
        setBuyAmount("");
        setIsBuyOpen(false);
        fetchHoldings(); // Refresh holdings
      } else {
        toast({
          title: "Purchase Failed",
          description: data.error || "Failed to process crypto purchase",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Purchase Failed",
        description: "Network error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Loading crypto data...</p>
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
          <h1 className="text-lg font-bold text-gray-900">Crypto</h1>
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={fetchCryptoData}
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Portfolio Overview */}
        {holdings.length > 0 && (
          <Card className="bg-gradient-to-br from-orange-500 to-amber-600 text-white">
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <p className="text-orange-100 text-sm mb-1">Crypto Portfolio</p>
                <h2 className="text-3xl font-bold">
                  {formatPrice(portfolioValue)}
                </h2>
                <div className="flex items-center justify-center mt-2">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span className="text-sm">+2.1% today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Holdings */}
        {holdings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Holdings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {holdings.map((holding, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-bold text-sm">
                        {holding.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {holding.currency}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {holding.amount} {holding.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatPrice(holding.value)}
                    </p>
                    <div
                      className={`flex items-center text-sm ${
                        holding.profitLoss >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {holding.profitLoss >= 0 ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span>
                        {holding.profitLoss >= 0 ? "+" : ""}
                        {holding.profitLossPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search cryptocurrencies..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Market Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Market Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredCryptos.map((crypto) => (
              <div
                key={crypto.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setSelectedCrypto(crypto);
                  setIsBuyOpen(true);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold text-sm">
                      {crypto.symbol.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{crypto.name}</h3>
                    <p className="text-sm text-gray-500">
                      {crypto.symbol.toUpperCase()} •{" "}
                      {formatMarketCap(crypto.market_cap)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatPrice(crypto.current_price)}
                  </p>
                  <div
                    className={`flex items-center text-sm ${
                      crypto.price_change_percentage_24h >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {crypto.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-1" />
                    )}
                    <span>
                      {crypto.price_change_percentage_24h >= 0 ? "+" : ""}
                      {crypto.price_change_percentage_24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Market Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Fear & Greed Index</p>
                <div className="text-2xl font-bold text-orange-600">47</div>
                <p className="text-xs text-gray-500">Neutral</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Market Cap</p>
                <div className="text-2xl font-bold text-gray-900">$1.7T</div>
                <p className="text-xs text-green-600">+2.4%</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Buy Crypto Dialog */}
        <Dialog open={isBuyOpen} onOpenChange={setIsBuyOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Buy {selectedCrypto?.name}</DialogTitle>
            </DialogHeader>
            {selectedCrypto && (
              <div className="space-y-4 py-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {selectedCrypto.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedCrypto.symbol.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatPrice(selectedCrypto.current_price)}
                      </p>
                      <div
                        className={`flex items-center text-sm ${
                          selectedCrypto.price_change_percentage_24h >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedCrypto.price_change_percentage_24h >= 0 ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        <span>
                          {selectedCrypto.price_change_percentage_24h >= 0
                            ? "+"
                            : ""}
                          {selectedCrypto.price_change_percentage_24h.toFixed(
                            2,
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedCrypto.sparkline_in_7d?.price &&
                  selectedCrypto.sparkline_in_7d.price.length > 0 && (
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={selectedCrypto.sparkline_in_7d.price.map(
                            (price, index) => ({
                              index,
                              price: price || 0,
                            }),
                          )}
                        >
                          <XAxis dataKey="index" hide />
                          <YAxis hide />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke={
                              selectedCrypto.price_change_percentage_24h >= 0
                                ? "#10b981"
                                : "#ef4444"
                            }
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Amount (USD)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter amount to invest"
                    value={buyAmount}
                    onChange={(e) => setBuyAmount(e.target.value)}
                  />
                  {buyAmount && parseFloat(buyAmount) > 0 && (
                    <p className="text-sm text-gray-600">
                      ≈{" "}
                      {(
                        parseFloat(buyAmount) / selectedCrypto.current_price
                      ).toFixed(6)}{" "}
                      {selectedCrypto.symbol.toUpperCase()}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[25, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setBuyAmount(amount.toString())}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleBuy}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={!buyAmount || parseFloat(buyAmount) <= 0}
                >
                  Buy {selectedCrypto.symbol.toUpperCase()}
                </Button>
              </div>
            )}
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
