import axios from "axios";

export interface CryptoCurrency {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export class CryptoService {
  private static readonly COINGECKO_BASE_URL =
    "https://api.coingecko.com/api/v3";
  private static readonly API_KEY = process.env.COINGECKO_API_KEY;

  // Get market data for cryptocurrencies
  static async getMarketData(): Promise<CryptoCurrency[]> {
    try {
      const url = `${this.COINGECKO_BASE_URL}/coins/markets`;
      const params = {
        vs_currency: "ngn",
        order: "market_cap_desc",
        per_page: 20,
        page: 1,
        sparkline: true,
        price_change_percentage: "24h",
      };

      // Add API key if available
      if (this.API_KEY) {
        (params as any).x_cg_demo_api_key = this.API_KEY;
      }

      const response = await axios.get(url, { params });

      return response.data.map((crypto: any) => ({
        id: crypto.id,
        symbol: crypto.symbol.toUpperCase(),
        name: crypto.name,
        current_price: crypto.current_price,
        market_cap: crypto.market_cap,
        market_cap_rank: crypto.market_cap_rank,
        price_change_percentage_24h: crypto.price_change_percentage_24h,
        image: crypto.image,
        sparkline_in_7d: crypto.sparkline_in_7d,
      }));
    } catch (error) {
      console.error("CoinGecko API error:", error);
      throw new Error("Failed to fetch cryptocurrency data");
    }
  }

  // Get fallback data for when API is unavailable
  static getFallbackData(): CryptoCurrency[] {
    return [
      {
        id: "bitcoin",
        symbol: "BTC",
        name: "Bitcoin",
        current_price: 85000000, // ~$50,000 in NGN
        market_cap: 1700000000000, // Estimate in NGN
        market_cap_rank: 1,
        price_change_percentage_24h: 2.5,
        image: "/crypto-icons/btc.png",
        sparkline_in_7d: {
          price: [83000000, 84000000, 85000000, 84500000, 85500000],
        },
      },
      {
        id: "ethereum",
        symbol: "ETH",
        name: "Ethereum",
        current_price: 5100000, // ~$3,000 in NGN
        market_cap: 612000000000,
        market_cap_rank: 2,
        price_change_percentage_24h: 3.2,
        image: "/crypto-icons/eth.png",
        sparkline_in_7d: {
          price: [4900000, 5000000, 5100000, 5050000, 5150000],
        },
      },
      {
        id: "tether",
        symbol: "USDT",
        name: "Tether",
        current_price: 1700, // ~$1 in NGN
        market_cap: 119000000000,
        market_cap_rank: 3,
        price_change_percentage_24h: 0.1,
        image: "/crypto-icons/usdt.png",
        sparkline_in_7d: {
          price: [1695, 1698, 1700, 1699, 1701],
        },
      },
      {
        id: "binancecoin",
        symbol: "BNB",
        name: "BNB",
        current_price: 1020000, // ~$600 in NGN
        market_cap: 93000000000,
        market_cap_rank: 4,
        price_change_percentage_24h: 1.8,
        image: "/crypto-icons/bnb.png",
        sparkline_in_7d: {
          price: [1000000, 1010000, 1020000, 1015000, 1025000],
        },
      },
      {
        id: "cardano",
        symbol: "ADA",
        name: "Cardano",
        current_price: 1530, // ~$0.90 in NGN
        market_cap: 53000000000,
        market_cap_rank: 5,
        price_change_percentage_24h: -0.5,
        image: "/crypto-icons/ada.png",
        sparkline_in_7d: {
          price: [1540, 1535, 1530, 1525, 1532],
        },
      },
    ];
  }

  // Get price alerts for a specific cryptocurrency
  static async getPriceAlerts(cryptoId: string): Promise<any> {
    try {
      // This would integrate with a price alert service
      // For now, return a simple structure
      return {
        id: cryptoId,
        alerts: [],
        price_targets: [],
      };
    } catch (error) {
      console.error("Price alerts error:", error);
      return { id: cryptoId, alerts: [], price_targets: [] };
    }
  }

  // Format currency for Nigerian display
  static formatNGN(amount: number): string {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Calculate percentage change color
  static getChangeColor(percentage: number): string {
    if (percentage > 0) return "text-green-600";
    if (percentage < 0) return "text-red-600";
    return "text-gray-600";
  }

  // Get market status
  static getMarketStatus(): {
    status: "open" | "closed";
    message: string;
  } {
    // Crypto markets are always open
    return {
      status: "open",
      message: "Markets are open 24/7",
    };
  }
}
