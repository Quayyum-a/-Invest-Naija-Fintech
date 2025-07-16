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
Object.defineProperty(exports, "__esModule", { value: true });
exports.investRoundups = exports.getRoundupStats = exports.processRoundup = exports.updateRoundupSettings = exports.getRoundupSettings = void 0;
const storage_1 = require("../data/storage");
// Round-up settings storage (use database in production)
const roundupSettings = new Map();
// Get user's round-up settings
const getRoundupSettings = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const settings = roundupSettings.get(userId) || {
            enabled: false,
            roundupMethod: "nearest_100",
            autoInvestThreshold: 1000,
            targetInvestmentType: "money_market",
            maxDailyRoundup: 5000,
        };
        res.json({
            success: true,
            settings,
        });
    }
    catch (error) {
        console.error("Get roundup settings error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getRoundupSettings = getRoundupSettings;
// Update round-up settings
const updateRoundupSettings = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { enabled, roundupMethod, autoInvestThreshold, targetInvestmentType, maxDailyRoundup, } = req.body;
        // Validation
        const validMethods = ["nearest_50", "nearest_100", "nearest_500"];
        const validInvestmentTypes = ["money_market", "treasury_bills"];
        if (roundupMethod && !validMethods.includes(roundupMethod)) {
            return res.status(400).json({
                success: false,
                error: "Invalid roundup method",
            });
        }
        if (targetInvestmentType &&
            !validInvestmentTypes.includes(targetInvestmentType)) {
            return res.status(400).json({
                success: false,
                error: "Invalid investment type",
            });
        }
        if (autoInvestThreshold &&
            (autoInvestThreshold < 100 || autoInvestThreshold > 50000)) {
            return res.status(400).json({
                success: false,
                error: "Auto-invest threshold must be between ₦100 and ₦50,000",
            });
        }
        const currentSettings = roundupSettings.get(userId) || {};
        const newSettings = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, currentSettings), (enabled !== undefined && { enabled })), (roundupMethod && { roundupMethod })), (autoInvestThreshold && { autoInvestThreshold })), (targetInvestmentType && { targetInvestmentType })), (maxDailyRoundup && { maxDailyRoundup }));
        roundupSettings.set(userId, newSettings);
        res.json({
            success: true,
            settings: newSettings,
            message: "Round-up settings updated successfully",
        });
    }
    catch (error) {
        console.error("Update roundup settings error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.updateRoundupSettings = updateRoundupSettings;
// Calculate round-up amount
const calculateRoundup = (amount, method) => {
    switch (method) {
        case "nearest_50":
            return Math.ceil(amount / 50) * 50 - amount;
        case "nearest_100":
            return Math.ceil(amount / 100) * 100 - amount;
        case "nearest_500":
            return Math.ceil(amount / 500) * 500 - amount;
        default:
            return Math.ceil(amount / 100) * 100 - amount;
    }
};
// Process round-up for a transaction
const processRoundup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { transactionAmount, description = "Purchase" } = req.body;
        if (!transactionAmount || transactionAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid transaction amount",
            });
        }
        // Get user's round-up settings
        const settings = roundupSettings.get(userId);
        if (!settings || !settings.enabled) {
            return res.json({
                success: true,
                message: "Round-up is disabled",
                roundupAmount: 0,
            });
        }
        // Calculate round-up amount
        const roundupAmount = calculateRoundup(transactionAmount, settings.roundupMethod);
        if (roundupAmount === 0) {
            return res.json({
                success: true,
                message: "No round-up needed",
                roundupAmount: 0,
            });
        }
        // Check daily round-up limit
        const today = new Date().toDateString();
        const dailyRoundupKey = `${userId}_${today}`;
        // In production, store this in database with proper date queries
        // Get wallet and check balance
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        if (wallet.balance < roundupAmount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient balance for round-up",
            });
        }
        // Create round-up transaction
        const roundupTransaction = (0, storage_1.createTransaction)({
            userId,
            type: "withdrawal",
            amount: roundupAmount,
            description: `Round-up from ${description} (₦${transactionAmount})`,
            status: "completed",
            metadata: {
                type: "roundup",
                originalAmount: transactionAmount,
                roundupMethod: settings.roundupMethod,
                autoInvest: false,
            },
        });
        // Update wallet balance
        (0, storage_1.updateWallet)(userId, {
            balance: wallet.balance - roundupAmount,
        });
        // Check if we should auto-invest
        const currentRoundupBalance = roundupAmount; // In production, sum all pending roundups
        if (currentRoundupBalance >= settings.autoInvestThreshold) {
            // Auto-invest the accumulated round-ups
            const investment = (0, storage_1.createInvestment)({
                userId,
                type: settings.targetInvestmentType,
                amount: currentRoundupBalance,
                status: "active",
            });
            const investmentTransaction = (0, storage_1.createTransaction)({
                userId,
                type: "investment",
                amount: currentRoundupBalance,
                description: `Auto-investment from round-ups`,
                status: "completed",
                metadata: {
                    type: "auto_roundup_investment",
                    investmentId: investment.id,
                    investmentType: settings.targetInvestmentType,
                },
            });
            // Update wallet
            (0, storage_1.updateWallet)(userId, {
                totalInvested: wallet.totalInvested + currentRoundupBalance,
            });
            return res.json({
                success: true,
                roundupAmount,
                autoInvested: true,
                investmentAmount: currentRoundupBalance,
                investment,
                transactions: [roundupTransaction, investmentTransaction],
                message: `Rounded up ₦${roundupAmount} and auto-invested ₦${currentRoundupBalance}`,
            });
        }
        res.json({
            success: true,
            roundupAmount,
            autoInvested: false,
            transaction: roundupTransaction,
            message: `Rounded up ₦${roundupAmount} successfully`,
        });
    }
    catch (error) {
        console.error("Process roundup error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.processRoundup = processRoundup;
// Get round-up statistics
const getRoundupStats = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        // In production, calculate these from actual transaction data
        const stats = {
            totalRoundups: 45,
            totalAmount: 2340.5,
            averageRoundup: 52.01,
            lastRoundup: "2024-01-15T10:30:00Z",
            autoInvestments: 3,
            autoInvestedAmount: 1500.0,
            pendingRoundup: 840.5,
        };
        res.json({
            success: true,
            stats,
        });
    }
    catch (error) {
        console.error("Get roundup stats error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getRoundupStats = getRoundupStats;
// Manual round-up investment
const investRoundups = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { investmentType = "money_market" } = req.body;
        // In production, get actual accumulated round-up balance
        const pendingRoundupAmount = 840.5; // Mock value
        if (pendingRoundupAmount < 100) {
            return res.status(400).json({
                success: false,
                error: "Minimum round-up investment is ₦100",
            });
        }
        // Create investment
        const investment = (0, storage_1.createInvestment)({
            userId,
            type: investmentType,
            amount: pendingRoundupAmount,
            status: "active",
        });
        const transaction = (0, storage_1.createTransaction)({
            userId,
            type: "investment",
            amount: pendingRoundupAmount,
            description: "Manual round-up investment",
            status: "completed",
            metadata: {
                type: "manual_roundup_investment",
                investmentId: investment.id,
                investmentType,
            },
        });
        // Update wallet
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (wallet) {
            (0, storage_1.updateWallet)(userId, {
                totalInvested: wallet.totalInvested + pendingRoundupAmount,
            });
        }
        res.json({
            success: true,
            investment,
            transaction,
            message: `Successfully invested ₦${pendingRoundupAmount} from round-ups`,
        });
    }
    catch (error) {
        console.error("Invest roundups error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.investRoundups = investRoundups;
