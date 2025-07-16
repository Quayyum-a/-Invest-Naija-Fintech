import { RequestHandler } from "express";
import { z } from "zod";
import axios from "axios";
// import { ErrorResponse } from "@shared/api";
import {
  getUserWallet,
  updateWallet,
  createTransaction,
  getUser,
} from "../data/storage";
import { termiiService } from "../services/termiiService";

// Validation schemas
const cryptoTradeSchema = z.object({
  cryptoId: z.string().min(1, "Crypto ID is required"),
  amount: z.number().min(1000, "Minimum trade amount is ₦1,000").max(1000000),
  type: z.enum(["buy", "sell"], {
    errorMap: () => ({ message: "Trade type must be 'buy' or 'sell'" }),
  }),
});

const cryptoWatchlistSchema = z.object({
  cryptoId: z.string().min(1, "Crypto ID is required"),
  targetPrice: z.number().optional(),
  priceAlert: z.boolean().default(false),
});

// USD to NGN conversion rate (in production, use a real forex API)
const USD_TO_NGN_RATE = 1650; // This should be dynamic in production

// Get real-time crypto market data with NGN conversion
export const getCryptoMarketData: RequestHandler = async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    // Fetch real cryptocurrency data from CoinGecko API
    const params: any = {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: limit,
      page: page,
      sparkline: true,
      price_change_percentage: "24h,7d,30d",
    };

    // Add search filter if provided
    if (search) {
      params.ids = search.toLowerCase();
    } else {
      // Default popular cryptocurrencies
      params.ids = [
        "bitcoin",
        "ethereum",
        "binancecoin",
        "cardano",
        "solana",
        "polkadot",
        "chainlink",
        "polygon",
        "avalanche-2",
        "uniswap",
        "ripple",
        "dogecoin",
        "shiba-inu",
        "litecoin",
        "tron",
        "stellar",
        "algorand",
        "cosmos",
        "filecoin",
        "sandbox",
      ].join(",");
    }

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params,
        timeout: 15000,
      },
    );

    // Transform CoinGecko data with NGN conversion
    const transformedData = response.data.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      current_price_usd: coin.current_price,
      current_price_ngn: Math.round(coin.current_price * USD_TO_NGN_RATE),
      price_change_percentage_24h: coin.price_change_percentage_24h,
      price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
      price_change_percentage_30d: coin.price_change_percentage_30d_in_currency,
      market_cap: coin.market_cap,
      market_cap_rank: coin.market_cap_rank,
      volume_24h: coin.total_volume,
      image: coin.image,
      sparkline_in_7d: {
        price: coin.sparkline_in_7d?.price?.slice(-7) || [],
        price_ngn:
          coin.sparkline_in_7d?.price?.map((price: number) =>
            Math.round(price * USD_TO_NGN_RATE),
          ) || [],
      },
      last_updated: coin.last_updated,
    }));

    res.json({
      success: true,
      data: {
        cryptocurrencies: transformedData,
        pagination: {
          page,
          limit,
          total: transformedData.length,
          hasNext: transformedData.length === limit,
        },
        exchange_rate: {
          usd_to_ngn: USD_TO_NGN_RATE,
          last_updated: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching crypto market data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch cryptocurrency data. Please try again.",
    });
  }
};

// Get user's crypto portfolio
export const getUserCryptoPortfolio: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // In a real implementation, fetch from crypto_holdings table
    // For now, simulate based on transaction history
    const cryptoTransactions = []; // This would be fetched from database

    const portfolio = {
      total_value_ngn: 0,
      total_value_usd: 0,
      total_profit_loss: 0,
      total_profit_loss_percentage: 0,
      holdings: [],
      recent_transactions: cryptoTransactions.slice(0, 10),
    };

    res.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    console.error("Error fetching crypto portfolio:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch crypto portfolio",
    });
  }
};

// Buy cryptocurrency (simulation)
export const buyCryptocurrency: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const validatedData = cryptoTradeSchema.parse(req.body);
    const { cryptoId, amount, type } = validatedData;

    if (type !== "buy") {
      return res.status(400).json({
        success: false,
        error: "This endpoint only supports buying cryptocurrency",
      });
    }

    // Check KYC status for crypto trading
    if (req.user.kycStatus !== "verified") {
      return res.status(400).json({
        success: false,
        error: "KYC verification required for cryptocurrency trading",
      });
    }

    // Get wallet
    const wallet = getUserWallet(userId);
    if (!wallet) {
      return res.status(404).json({
        success: false,
        error: "Wallet not found",
      });
    }

    // Check sufficient balance
    if (wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    // Fetch current crypto price
    const priceResponse = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`,
      { timeout: 10000 },
    );

    const cryptoData = priceResponse.data[cryptoId];
    if (!cryptoData) {
      return res.status(404).json({
        success: false,
        error: "Cryptocurrency not found",
      });
    }

    const priceUSD = cryptoData.usd;
    const priceNGN = Math.round(priceUSD * USD_TO_NGN_RATE);
    const cryptoAmount = amount / priceNGN;

    // Get crypto details
    const cryptoDetailsResponse = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}`,
      { timeout: 10000 },
    );

    const cryptoDetails = cryptoDetailsResponse.data;

    const reference = `crypto_buy_${Date.now()}_${userId.slice(0, 8)}`;

    // Create transaction
    const transaction = createTransaction({
      userId,
      type: "crypto_buy",
      amount: -amount, // Negative for debit
      description: `Buy ${cryptoAmount.toFixed(8)} ${cryptoDetails.symbol.toUpperCase()}`,
      status: "completed",
      metadata: {
        reference,
        crypto_id: cryptoId,
        crypto_symbol: cryptoDetails.symbol.toUpperCase(),
        crypto_name: cryptoDetails.name,
        crypto_amount: cryptoAmount,
        price_usd: priceUSD,
        price_ngn: priceNGN,
        exchange_rate: USD_TO_NGN_RATE,
        trade_type: "buy",
        image: cryptoDetails.image?.small,
      },
    });

    // Update wallet
    const updatedWallet = updateWallet(userId, {
      balance: wallet.balance - amount,
    });

    // Send SMS notification
    if (req.user.phone) {
      try {
        await termiiService.sendSMSSafe({
          to: req.user.phone,
          message: `InvestNaija: You've purchased ${cryptoAmount.toFixed(6)} ${cryptoDetails.symbol.toUpperCase()} for ₦${amount.toLocaleString()}. Balance: ₦${updatedWallet.balance.toLocaleString()}`,
        });
      } catch (smsError) {
        console.error("SMS notification failed:", smsError);
      }
    }

    res.json({
      success: true,
      data: {
        transaction,
        crypto_details: {
          id: cryptoId,
          name: cryptoDetails.name,
          symbol: cryptoDetails.symbol.toUpperCase(),
          amount_purchased: cryptoAmount,
          price_per_unit_ngn: priceNGN,
          price_per_unit_usd: priceUSD,
          total_cost_ngn: amount,
          image: cryptoDetails.image?.small,
        },
        wallet: updatedWallet,
      },
      message: `Successfully purchased ${cryptoAmount.toFixed(6)} ${cryptoDetails.symbol.toUpperCase()}`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Buy cryptocurrency error:", error);
    res.status(500).json({
      success: false,
      error: "Cryptocurrency purchase failed",
    });
  }
};

// Sell cryptocurrency (simulation)
export const sellCryptocurrency: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // For simulation, return appropriate message
    res.json({
      success: false,
      error:
        "Cryptocurrency selling is currently disabled due to CBN regulations. P2P crypto trading is restricted in Nigeria.",
      message:
        "You can view market data and simulate purchases, but actual trading requires regulatory approval.",
    });
  } catch (error) {
    console.error("Sell cryptocurrency error:", error);
    res.status(500).json({
      success: false,
      error: "Cryptocurrency sale failed",
    });
  }
};

// Get crypto price alerts and watchlist
export const getCryptoWatchlist: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // In a real implementation, fetch from user_crypto_watchlist table
    const watchlist = [
      {
        crypto_id: "bitcoin",
        crypto_name: "Bitcoin",
        crypto_symbol: "BTC",
        target_price: 70000,
        current_price: 65000,
        alert_enabled: true,
        created_at: new Date().toISOString(),
      },
    ];

    res.json({
      success: true,
      data: {
        watchlist,
        total: watchlist.length,
      },
    });
  } catch (error) {
    console.error("Get crypto watchlist error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch crypto watchlist",
    });
  }
};

// Add to crypto watchlist
export const addToWatchlist: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const validatedData = cryptoWatchlistSchema.parse(req.body);
    const { cryptoId, targetPrice, priceAlert } = validatedData;

    // Get crypto details
    const cryptoResponse = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}`,
      { timeout: 10000 },
    );

    const crypto = cryptoResponse.data;

    // In a real implementation, save to database
    const watchlistItem = {
      id: `watchlist_${Date.now()}`,
      user_id: userId,
      crypto_id: cryptoId,
      crypto_name: crypto.name,
      crypto_symbol: crypto.symbol.toUpperCase(),
      target_price: targetPrice,
      current_price: crypto.market_data.current_price.usd,
      alert_enabled: priceAlert,
      created_at: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: watchlistItem,
      message: `${crypto.name} added to your watchlist`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      });
    }

    console.error("Add to watchlist error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add to watchlist",
    });
  }
};

// Get crypto news and insights
export const getCryptoNews: RequestHandler = async (req, res) => {
  try {
    // In a real implementation, integrate with a crypto news API
    const mockNews = [
      {
        id: "news_1",
        title: "Bitcoin Reaches New All-Time High",
        summary: "Bitcoin breaks previous records amid institutional adoption",
        url: "https://example.com/news/1",
        published_at: new Date().toISOString(),
        source: "CryptoNews",
      },
      {
        id: "news_2",
        title: "Nigeria Considers CBDC Implementation",
        summary: "Central Bank explores digital currency options",
        url: "https://example.com/news/2",
        published_at: new Date().toISOString(),
        source: "FinTech Nigeria",
      },
    ];

    res.json({
      success: true,
      data: {
        news: mockNews,
        total: mockNews.length,
      },
    });
  } catch (error) {
    console.error("Get crypto news error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch crypto news",
    });
  }
};

// Get trading statistics
export const getTradingStats: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // In a real implementation, calculate from transaction history
    const stats = {
      total_trades: 0,
      total_invested: 0,
      current_value: 0,
      profit_loss: 0,
      profit_loss_percentage: 0,
      best_performing_crypto: null,
      worst_performing_crypto: null,
      trading_streak: 0,
      last_trade_date: null,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get trading stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch trading statistics",
    });
  }
};
