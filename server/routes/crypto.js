"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sellCrypto = exports.buyCrypto = exports.getUserCryptoHoldings = exports.getCryptoMarketData = void 0;
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
// Real cryptocurrency API using CoinGecko (free, no API key required)
const getCryptoMarketData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch real cryptocurrency data from CoinGecko API
        const response = yield axios_1.default.get("https://api.coingecko.com/api/v3/coins/markets", {
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
        });
        // Transform CoinGecko data to our format
        const transformedData = response.data.map((coin) => {
            var _a, _b;
            return ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol.toUpperCase(),
                current_price: coin.current_price,
                price_change_percentage_24h: coin.price_change_percentage_24h,
                market_cap: coin.market_cap,
                image: coin.image,
                sparkline_in_7d: {
                    price: ((_b = (_a = coin.sparkline_in_7d) === null || _a === void 0 ? void 0 : _a.price) === null || _b === void 0 ? void 0 : _b.slice(-7)) || [],
                },
            });
        });
        res.json({
            success: true,
            data: transformedData,
        });
    }
    catch (error) {
        console.error("Error fetching crypto market data:", error);
        // Return error response instead of dummy data
        res.status(500).json({
            success: false,
            error: "Failed to fetch real-time cryptocurrency data. Please try again.",
        });
    }
});
exports.getCryptoMarketData = getCryptoMarketData;
const getUserCryptoHoldings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
    }
    catch (error) {
        console.error("Error fetching user crypto holdings:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch crypto holdings",
        });
    }
});
exports.getUserCryptoHoldings = getUserCryptoHoldings;
const buyCryptoSchema = zod_1.z.object({
    cryptoId: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
});
const buyCrypto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        const { cryptoId, amount } = buyCryptoSchema.parse(req.body);
        // Fetch real crypto data to get current price
        const response = yield axios_1.default.get(`https://api.coingecko.com/api/v3/coins/${cryptoId}`, { timeout: 5000 });
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
        yield new Promise((resolve) => setTimeout(resolve, 1000));
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
});
exports.buyCrypto = buyCrypto;
const sellCryptoSchema = zod_1.z.object({
    cryptoId: zod_1.z.string(),
    amount: zod_1.z.number().positive(),
});
const sellCrypto = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        const { cryptoId, amount } = sellCryptoSchema.parse(req.body);
        // Fetch real crypto data to get current price
        const response = yield axios_1.default.get(`https://api.coingecko.com/api/v3/coins/${cryptoId}`, { timeout: 5000 });
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
        yield new Promise((resolve) => setTimeout(resolve, 1000));
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
});
exports.sellCrypto = sellCrypto;
