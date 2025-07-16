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
exports.getTradingStats = exports.getCryptoNews = exports.addToWatchlist = exports.getCryptoWatchlist = exports.sellCryptocurrency = exports.buyCryptocurrency = exports.getUserCryptoPortfolio = exports.getCryptoMarketData = void 0;
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
const storage_1 = require("../data/storage");
const termiiService_1 = require("../services/termiiService");
// Validation schemas
const cryptoTradeSchema = zod_1.z.object({
    cryptoId: zod_1.z.string().min(1, "Crypto ID is required"),
    amount: zod_1.z.number().min(1000, "Minimum trade amount is ₦1,000").max(1000000),
    type: zod_1.z.enum(["buy", "sell"], {
        errorMap: () => ({ message: "Trade type must be 'buy' or 'sell'" }),
    }),
});
const cryptoWatchlistSchema = zod_1.z.object({
    cryptoId: zod_1.z.string().min(1, "Crypto ID is required"),
    targetPrice: zod_1.z.number().optional(),
    priceAlert: zod_1.z.boolean().default(false),
});
// USD to NGN conversion rate (in production, use a real forex API)
const USD_TO_NGN_RATE = 1650; // This should be dynamic in production
// Get real-time crypto market data with NGN conversion
const getCryptoMarketData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search;
        // Fetch real cryptocurrency data from CoinGecko API
        const params = {
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
        }
        else {
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
        const response = yield axios_1.default.get("https://api.coingecko.com/api/v3/coins/markets", {
            params,
            timeout: 15000,
        });
        // Transform CoinGecko data with NGN conversion
        const transformedData = response.data.map((coin) => {
            var _a, _b, _c, _d;
            return ({
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
                    price: ((_b = (_a = coin.sparkline_in_7d) === null || _a === void 0 ? void 0 : _a.price) === null || _b === void 0 ? void 0 : _b.slice(-7)) || [],
                    price_ngn: ((_d = (_c = coin.sparkline_in_7d) === null || _c === void 0 ? void 0 : _c.price) === null || _d === void 0 ? void 0 : _d.map((price) => Math.round(price * USD_TO_NGN_RATE))) || [],
                },
                last_updated: coin.last_updated,
            });
        });
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
    }
    catch (error) {
        console.error("Error fetching crypto market data:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch cryptocurrency data. Please try again.",
        });
    }
});
exports.getCryptoMarketData = getCryptoMarketData;
// Get user's crypto portfolio
const getUserCryptoPortfolio = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
    }
    catch (error) {
        console.error("Error fetching crypto portfolio:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch crypto portfolio",
        });
    }
});
exports.getUserCryptoPortfolio = getUserCryptoPortfolio;
// Buy cryptocurrency (simulation)
const buyCryptocurrency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
        const wallet = (0, storage_1.getUserWallet)(userId);
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
        const priceResponse = yield axios_1.default.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd`, { timeout: 10000 });
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
        const cryptoDetailsResponse = yield axios_1.default.get(`https://api.coingecko.com/api/v3/coins/${cryptoId}`, { timeout: 10000 });
        const cryptoDetails = cryptoDetailsResponse.data;
        const reference = `crypto_buy_${Date.now()}_${userId.slice(0, 8)}`;
        // Create transaction
        const transaction = (0, storage_1.createTransaction)({
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
                image: (_b = cryptoDetails.image) === null || _b === void 0 ? void 0 : _b.small,
            },
        });
        // Update wallet
        const updatedWallet = (0, storage_1.updateWallet)(userId, {
            balance: wallet.balance - amount,
        });
        // Send SMS notification
        if (req.user.phone) {
            try {
                yield termiiService_1.termiiService.sendSMSSafe({
                    to: req.user.phone,
                    message: `InvestNaija: You've purchased ${cryptoAmount.toFixed(6)} ${cryptoDetails.symbol.toUpperCase()} for ₦${amount.toLocaleString()}. Balance: ₦${updatedWallet.balance.toLocaleString()}`,
                });
            }
            catch (smsError) {
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
                    image: (_c = cryptoDetails.image) === null || _c === void 0 ? void 0 : _c.small,
                },
                wallet: updatedWallet,
            },
            message: `Successfully purchased ${cryptoAmount.toFixed(6)} ${cryptoDetails.symbol.toUpperCase()}`,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
});
exports.buyCryptocurrency = buyCryptocurrency;
// Sell cryptocurrency (simulation)
const sellCryptocurrency = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        // For simulation, return appropriate message
        res.json({
            success: false,
            error: "Cryptocurrency selling is currently disabled due to CBN regulations. P2P crypto trading is restricted in Nigeria.",
            message: "You can view market data and simulate purchases, but actual trading requires regulatory approval.",
        });
    }
    catch (error) {
        console.error("Sell cryptocurrency error:", error);
        res.status(500).json({
            success: false,
            error: "Cryptocurrency sale failed",
        });
    }
});
exports.sellCryptocurrency = sellCryptocurrency;
// Get crypto price alerts and watchlist
const getCryptoWatchlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
    }
    catch (error) {
        console.error("Get crypto watchlist error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch crypto watchlist",
        });
    }
});
exports.getCryptoWatchlist = getCryptoWatchlist;
// Add to crypto watchlist
const addToWatchlist = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = cryptoWatchlistSchema.parse(req.body);
        const { cryptoId, targetPrice, priceAlert } = validatedData;
        // Get crypto details
        const cryptoResponse = yield axios_1.default.get(`https://api.coingecko.com/api/v3/coins/${cryptoId}`, { timeout: 10000 });
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
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
});
exports.addToWatchlist = addToWatchlist;
// Get crypto news and insights
const getCryptoNews = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    catch (error) {
        console.error("Get crypto news error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch crypto news",
        });
    }
});
exports.getCryptoNews = getCryptoNews;
// Get trading statistics
const getTradingStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
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
    }
    catch (error) {
        console.error("Get trading stats error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch trading statistics",
        });
    }
});
exports.getTradingStats = getTradingStats;
