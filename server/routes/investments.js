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
exports.getInvestmentPerformance = exports.withdrawInvestment = exports.createRoundUpInvestment = exports.getInvestmentProducts = void 0;
const storage_1 = require("../data/storage");
const investmentService_1 = require("../services/investmentService");
const getInvestmentProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        const products = investmentService_1.InvestmentService.getAvailableProducts();
        const portfolio = yield investmentService_1.InvestmentService.getUserPortfolio(userId);
        // Get recommendations based on user profile
        const recommendations = investmentService_1.InvestmentService.getRecommendations(req.user.kycStatus || "unverified", "moderate", // Default risk tolerance
        "growth");
        res.json({
            success: true,
            data: {
                products,
                userInvestments: portfolio.userInvestments,
                portfolioSummary: portfolio.portfolioSummary,
                recommendations,
            },
        });
    }
    catch (error) {
        console.error("Get investment products error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to load investment data",
        });
    }
});
exports.getInvestmentProducts = getInvestmentProducts;
const createRoundUpInvestment = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { purchaseAmount, roundUpAmount } = req.body;
        if (!purchaseAmount || !roundUpAmount || roundUpAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid round-up amount",
            });
        }
        // Get current wallet
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Check sufficient balance
        if (wallet.balance < roundUpAmount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient wallet balance for round-up investment",
            });
        }
        // Create round-up investment
        const investment = (0, storage_1.createInvestment)({
            userId,
            type: "round_up",
            amount: roundUpAmount,
            status: "active",
        });
        // Create transaction record
        const transaction = (0, storage_1.createTransaction)({
            userId,
            type: "investment",
            amount: roundUpAmount,
            description: `Round-up investment from ₦${purchaseAmount.toFixed(2)} purchase`,
            status: "completed",
            metadata: {
                investmentId: investment.id,
                purchaseAmount,
                roundUpAmount,
                investmentType: "round_up",
            },
        });
        // Update wallet balances
        const updatedWallet = (0, storage_1.updateWallet)(userId, {
            balance: wallet.balance - roundUpAmount,
            totalInvested: wallet.totalInvested + roundUpAmount,
        });
        res.json({
            success: true,
            transaction,
            investment,
            wallet: updatedWallet,
            message: "Round-up investment successful",
        });
    }
    catch (error) {
        console.error("Round-up investment error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.createRoundUpInvestment = createRoundUpInvestment;
const withdrawInvestment = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { investmentId, amount } = req.body;
        if (!investmentId || !amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid withdrawal amount",
            });
        }
        // Get user's investments
        const investments = (0, storage_1.getUserInvestments)(userId);
        const investment = investments.find((inv) => inv.id === investmentId);
        if (!investment) {
            return res.status(404).json({
                success: false,
                error: "Investment not found",
            });
        }
        if (investment.currentValue < amount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient investment balance",
            });
        }
        // Get current wallet
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Update investment
        const updatedInvestment = (0, storage_1.updateInvestment)(investmentId, {
            currentValue: investment.currentValue - amount,
            status: investment.currentValue - amount <= 0 ? "withdrawn" : "active",
        });
        // Create transaction record
        const transaction = (0, storage_1.createTransaction)({
            userId,
            type: "withdrawal",
            amount,
            description: `Investment withdrawal from ${investment.type.replace("_", " ")}`,
            status: "completed",
            metadata: {
                investmentId,
                withdrawalType: "investment",
            },
        });
        // Update wallet balances
        const updatedWallet = (0, storage_1.updateWallet)(userId, {
            balance: wallet.balance + amount,
            totalInvested: wallet.totalInvested - Math.min(amount, investment.amount),
        });
        res.json({
            success: true,
            transaction,
            investment: updatedInvestment,
            wallet: updatedWallet,
            message: "Investment withdrawal successful",
        });
    }
    catch (error) {
        console.error("Investment withdrawal error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.withdrawInvestment = withdrawInvestment;
const getInvestmentPerformance = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const investments = (0, storage_1.getUserInvestments)(userId);
        // Calculate performance metrics
        const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalReturns = currentValue - totalInvested;
        const returnPercentage = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
        // Mock historical performance data
        // In a real app, this would come from actual market data
        const performanceHistory = generatePerformanceHistory(investments);
        res.json({
            success: true,
            performance: {
                totalInvested,
                currentValue,
                totalReturns,
                returnPercentage,
                history: performanceHistory,
            },
        });
    }
    catch (error) {
        console.error("Get investment performance error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getInvestmentPerformance = getInvestmentPerformance;
// Helper function to generate realistic performance history
function generatePerformanceHistory(investments) {
    const history = [];
    const days = 30;
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        // Simulate market performance with slight variations
        const baseValue = investments.reduce((sum, inv) => sum + inv.amount, 0);
        const performance = baseValue * (1 + (Math.random() * 0.02 - 0.01)); // ±1% variation
        history.push({
            date: date.toISOString().split("T")[0],
            value: Math.round(performance * 100) / 100,
        });
    }
    return history;
}
