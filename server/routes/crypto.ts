import { RequestHandler } from "express";
import { z } from "zod";
import axios from "axios";

// Real cryptocurrency API using CoinGecko (free, no API key required)
export const getCryptoMarketData: RequestHandler = async (req, res) => {
  try {
    // Fetch real cryptocurrency data from CoinGecko API
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids: "bitcoin,ethereum,binancecoin,cardano,solana,polkadot,chainlink,polygon,avalanche-2,uniswap",
          order: "market_cap_desc",
          per_page: 10,
          page: 1,
          sparkline: true,
          price_change_percentage: "24h,7d",
        },
        timeout: 10000, // 10 seconds timeout
      },
    );

    // Transform CoinGecko data to our format
    const transformedData = response.data.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      current_price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h,
      market_cap: coin.market_cap,
      image: coin.image,
      sparkline_in_7d: {
        price: coin.sparkline_in_7d?.price?.slice(-7) || [],
      },
    }));

    res.json({
      success: true,
      data: transformedData,
    });
  } catch (error) {
    console.error("Error fetching crypto market data:", error);

    // Return error response instead of dummy data
    res.status(500).json({
      success: false,
      error: "Failed to fetch real-time cryptocurrency data. Please try again.",
    });
  }
};

export const getUserCryptoHoldings: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    // In a real implementation, you would fetch user's actual crypto holdings from database
    // For now, return empty holdings - users start with no crypto until they buy some
    res.json({
      success: true,
      data: {
        holdings: [], // No dummy holdings - users must actually buy crypto
        portfolioValue: 0,
        totalProfitLoss: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching user crypto holdings:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch crypto holdings",
    });
  }
};

const buyCryptoSchema = z.object({
  cryptoId: z.string(),
  amount: z.number().positive(),
});

export const buyCrypto: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const { cryptoId, amount } = buyCryptoSchema.parse(req.body);

    // Fetch real crypto data to get current price
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}`,
      { timeout: 5000 },
    );

    const crypto = response.data;
    if (!crypto) {
      return res.status(404).json({
        success: false,
        error: "Cryptocurrency not found",
      });
    }

    // Calculate crypto amount
    const cryptoAmount = amount / crypto.current_price;

    // In a real implementation, you would:
    // 1. Check user's wallet balance
    // 2. Deduct the amount from wallet
    // 3. Add the crypto to user's portfolio
    // 4. Record the transaction

    // Simulate database operations
    await new Promise((resolve) => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: `Successfully purchased ${cryptoAmount.toFixed(6)} ${crypto.symbol}`,
      data: {
        cryptoId,
        cryptoSymbol: crypto.symbol,
        cryptoName: crypto.name,
        amountSpent: amount,
        cryptoAmount,
        price: crypto.current_price,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: error.errors,
      });
    }

    console.error("Error buying crypto:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process crypto purchase",
    });
  }
};

const sellCryptoSchema = z.object({
  cryptoId: z.string(),
  amount: z.number().positive(),
});

export const sellCrypto: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const { cryptoId, amount } = sellCryptoSchema.parse(req.body);

    // Fetch real crypto data to get current price
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}`,
      { timeout: 5000 },
    );

    const crypto = response.data;
    if (!crypto) {
      return res.status(404).json({
        success: false,
        error: "Cryptocurrency not found",
      });
    }

    // In a real implementation, you would:
    // 1. Check user's crypto holdings
    // 2. Verify they have enough crypto to sell
    // 3. Calculate the sale value
    // 4. Add proceeds to user's wallet
    // 5. Update crypto holdings
    // 6. Record the transaction

    const saleValue = amount * crypto.current_price;

    // Simulate database operations
    await new Promise((resolve) => setTimeout(resolve, 1000));

    res.json({
      success: true,
      message: `Successfully sold ${amount} ${crypto.symbol} for $${saleValue.toFixed(2)}`,
      data: {
        cryptoId,
        cryptoSymbol: crypto.symbol,
        cryptoName: crypto.name,
        amountSold: amount,
        saleValue,
        price: crypto.current_price,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: error.errors,
      });
    }

    console.error("Error selling crypto:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process crypto sale",
    });
  }
};
