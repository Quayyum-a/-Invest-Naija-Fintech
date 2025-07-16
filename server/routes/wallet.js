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
exports.getTransactionHistory = exports.withdrawToBank = exports.transferToUser = exports.verifyWalletFunding = exports.initiateWalletFunding = exports.getPortfolioData = exports.getDashboardData = exports.getTransactions = exports.investMoney = exports.withdrawMoney = exports.processDeposit = exports.getWallet = void 0;
const storage_1 = require("../data/storage");
const userLookup_1 = require("../data/userLookup");
const getWallet = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        res.json({
            success: true,
            wallet,
        });
    }
    catch (error) {
        console.error("Get wallet error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getWallet = getWallet;
const processDeposit = (req, res) => {
    try {
        res.status(400).json({
            success: false,
            error: "Manual deposits are not allowed. Please use Paystack, bank transfer, or virtual account funding.",
        });
    }
    catch (error) {
        console.error("Process deposit error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.processDeposit = processDeposit;
const withdrawMoney = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { amount, description = "Wallet withdrawal", metadata, } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid amount",
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
        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient balance",
            });
        }
        // Create transaction record
        const transaction = (0, storage_1.createTransaction)({
            userId,
            type: "withdrawal",
            amount,
            description,
            status: "completed",
            metadata,
        });
        // Update wallet balance
        const updatedWallet = (0, storage_1.updateWallet)(userId, {
            balance: wallet.balance - amount,
        });
        res.json({
            success: true,
            transaction,
            wallet: updatedWallet,
            message: "Withdrawal successful",
        });
    }
    catch (error) {
        console.error("Withdraw money error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.withdrawMoney = withdrawMoney;
const investMoney = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { amount, investmentType = "money_market", description, } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid amount",
            });
        }
        // Investment type validation
        const validTypes = ["money_market", "treasury_bills", "fixed_deposit"];
        if (!validTypes.includes(investmentType)) {
            return res.status(400).json({
                success: false,
                error: "Invalid investment type",
            });
        }
        // Minimum investment amounts by type
        const minimumAmounts = {
            money_market: 100,
            treasury_bills: 1000,
            fixed_deposit: 5000,
        };
        if (amount < minimumAmounts[investmentType]) {
            return res.status(400).json({
                success: false,
                error: `Minimum investment for ${investmentType.replace("_", " ")} is ₦${minimumAmounts[investmentType]}`,
            });
        }
        // Check user KYC status for larger investments
        if (amount > 50000 && req.user.kycStatus !== "verified") {
            return res.status(400).json({
                success: false,
                error: "KYC verification required for investments above ₦50,000",
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
        if (wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient wallet balance. Please fund your wallet first.",
            });
        }
        // Calculate expected returns (annualized)
        const returnRates = {
            money_market: 0.125, // 12.5%
            treasury_bills: 0.152, // 15.2%
            fixed_deposit: 0.1, // 10%
        };
        const expectedAnnualReturn = amount * returnRates[investmentType];
        // Create investment record
        const investment = (0, storage_1.createInvestment)({
            userId,
            type: investmentType,
            amount,
            status: "active",
        });
        // Create transaction record
        const transaction = (0, storage_1.createTransaction)({
            userId,
            type: "investment",
            amount,
            description: description || `Investment in ${investmentType.replace("_", " ")}`,
            status: "completed",
            metadata: {
                investmentId: investment.id,
                investmentType,
                expectedAnnualReturn,
                returnRate: returnRates[investmentType],
            },
        });
        // Update wallet balances
        const updatedWallet = (0, storage_1.updateWallet)(userId, {
            balance: wallet.balance - amount,
            totalInvested: wallet.totalInvested + amount,
        });
        res.json({
            success: true,
            transaction,
            investment,
            wallet: updatedWallet,
            expectedReturn: expectedAnnualReturn,
            message: `Successfully invested ₦${amount.toLocaleString()} in ${investmentType.replace("_", " ")}`,
        });
    }
    catch (error) {
        console.error("Invest money error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.investMoney = investMoney;
const getTransactions = (req, res) => {
    var _a;
    try {
        // Ensure we always return JSON
        res.setHeader("Content-Type", "application/json");
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const limit = req.query.limit
            ? parseInt(req.query.limit)
            : undefined;
        const transactions = (0, storage_1.getUserTransactions)(userId, limit);
        // Ensure transactions is always an array
        const safeTransactions = Array.isArray(transactions) ? transactions : [];
        res.status(200).json({
            success: true,
            data: {
                transactions: safeTransactions,
                count: safeTransactions.length,
            },
        });
    }
    catch (error) {
        console.error("Get transactions error:", error);
        res.setHeader("Content-Type", "application/json");
        res.status(500).json({
            success: false,
            error: "Internal server error",
            details: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};
exports.getTransactions = getTransactions;
const getDashboardData = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const wallet = (0, storage_1.getUserWallet)(userId);
        const recentTransactions = (0, storage_1.getUserTransactions)(userId, 5);
        const recentInvestments = (0, storage_1.getUserInvestments)(userId).slice(0, 3);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Calculate investment goal (example: ₦10,000 monthly)
        const monthlyGoal = 10000;
        const currentMonthInvestments = recentInvestments
            .filter((inv) => {
            const investmentDate = new Date(inv.createdAt);
            const now = new Date();
            return (investmentDate.getMonth() === now.getMonth() &&
                investmentDate.getFullYear() === now.getFullYear());
        })
            .reduce((sum, inv) => sum + inv.amount, 0);
        // Calculate streak (days with investments in the last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentInvestmentDays = recentInvestments
            .filter((inv) => new Date(inv.createdAt) >= thirtyDaysAgo)
            .map((inv) => new Date(inv.createdAt).toDateString());
        const uniqueDays = new Set(recentInvestmentDays);
        const streak = uniqueDays.size;
        const dashboardData = {
            user: req.user,
            wallet,
            recentTransactions,
            recentInvestments,
            investmentGoal: {
                target: monthlyGoal,
                current: currentMonthInvestments,
                percentage: (currentMonthInvestments / monthlyGoal) * 100,
            },
            streak,
        };
        res.json({
            success: true,
            data: dashboardData,
        });
    }
    catch (error) {
        console.error("Get dashboard data error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getDashboardData = getDashboardData;
const getPortfolioData = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const wallet = (0, storage_1.getUserWallet)(userId);
        const investments = (0, storage_1.getUserInvestments)(userId);
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Calculate performance based on actual user data
        const performance = {
            sevenDays: 0, // Real calculation needed based on 7-day investment performance
            thirtyDays: 0, // Real calculation needed based on 30-day investment performance
            allTime: wallet.totalInvested > 0
                ? (wallet.totalReturns / wallet.totalInvested) * 100
                : 0,
        };
        // Calculate allocation
        const moneyMarketAmount = investments
            .filter((inv) => inv.type === "money_market" && inv.status === "active")
            .reduce((sum, inv) => sum + inv.currentValue, 0);
        const treasuryBillsAmount = investments
            .filter((inv) => inv.type === "treasury_bills" && inv.status === "active")
            .reduce((sum, inv) => sum + inv.currentValue, 0);
        const totalActive = moneyMarketAmount + treasuryBillsAmount;
        const allocation = {
            moneyMarket: totalActive > 0 ? (moneyMarketAmount / totalActive) * 100 : 0,
            treasuryBills: totalActive > 0 ? (treasuryBillsAmount / totalActive) * 100 : 0,
        };
        const portfolioData = {
            wallet,
            investments,
            performance,
            allocation,
        };
        res.json({
            success: true,
            data: portfolioData,
        });
    }
    catch (error) {
        console.error("Get portfolio data error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getPortfolioData = getPortfolioData;
// Enhanced wallet endpoints with real-time features
const initiateWalletFunding = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        const userEmail = (_b = req.user) === null || _b === void 0 ? void 0 : _b.email;
        if (!userId || !userEmail) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { amount, provider = "paystack" } = req.body;
        const result = yield paymentsService.initializePaystackPayment(userId, amount, userEmail);
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: "Payment initialization successful",
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error("Initiate wallet funding error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.initiateWalletFunding = initiateWalletFunding;
const verifyWalletFunding = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { reference } = req.params;
        if (!reference) {
            return res.status(400).json({
                success: false,
                error: "Payment reference is required",
            });
        }
        const result = yield paymentsService.verifyPaystackPayment(reference);
        if (result.success) {
            res.json({
                success: true,
                data: result.data,
                message: "Payment verified successfully",
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error("Verify wallet funding error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.verifyWalletFunding = verifyWalletFunding;
const transferToUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const fromUserId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!fromUserId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { toUserIdentifier, amount, description } = req.body;
        // Validate and find recipient
        const recipientValidation = (0, userLookup_1.validateRecipient)(toUserIdentifier);
        if (!recipientValidation.valid) {
            return res.status(400).json({
                success: false,
                error: recipientValidation.error,
            });
        }
        const recipient = recipientValidation.user;
        // Check if recipient can receive this amount
        const canReceive = (0, userLookup_1.canReceiveMoney)(recipient, amount);
        if (!canReceive.canReceive) {
            return res.status(400).json({
                success: false,
                error: canReceive.reason,
            });
        }
        // Prevent self-transfers
        if (recipient.id === fromUserId) {
            return res.status(400).json({
                success: false,
                error: "You cannot transfer money to yourself",
            });
        }
        const toUserId = recipient.id;
        const result = yield walletService.transferFunds(fromUserId, toUserId, amount, description);
        if (result.success) {
            res.json({
                success: true,
                transaction: result.transaction,
                message: "Transfer successful",
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error("Transfer to user error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.transferToUser = transferToUser;
const withdrawToBank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { amount, bankDetails } = req.body;
        const result = yield walletService.withdrawToBank(userId, amount, bankDetails);
        if (result.success) {
            res.json({
                success: true,
                transaction: result.transaction,
                message: "Withdrawal initiated successfully",
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error("Withdraw to bank error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.withdrawToBank = withdrawToBank;
const getTransactionHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const filters = {
            type: req.query.type,
            status: req.query.status,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
        };
        const result = yield walletService.getTransactionHistory(userId, page, limit, filters);
        if (result.success) {
            res.json({
                success: true,
                transactions: result.transactions,
                pagination: result.pagination,
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error("Get transaction history error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.getTransactionHistory = getTransactionHistory;
