"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimReward = exports.getUserLevel = exports.getLeaderboard = exports.getUserAchievements = void 0;
const storage_1 = require("../data/storage");
// Achievement definitions
const achievements = [
    {
        id: "first_investment",
        name: "First Step",
        description: "Make your first investment",
        icon: "🎯",
        category: "investment",
        requirement: { type: "first_action", value: 1 },
        reward: { type: "badge", value: "Investor" },
        rarity: "common",
    },
    {
        id: "hundred_naira_investor",
        name: "Hundred Naira Hero",
        description: "Invest at least ₦100",
        icon: "💰",
        category: "investment",
        requirement: { type: "investment_amount", value: 100 },
        reward: { type: "badge", value: "Micro Investor" },
        rarity: "common",
    },
    {
        id: "thousand_naira_investor",
        name: "Thousand Naira Champion",
        description: "Invest at least ₦1,000",
        icon: "🏆",
        category: "investment",
        requirement: { type: "investment_amount", value: 1000 },
        reward: { type: "bonus", value: 50 },
        rarity: "rare",
    },
    {
        id: "ten_thousand_investor",
        name: "Elite Investor",
        description: "Reach ₦10,000 in total investments",
        icon: "👑",
        category: "milestone",
        requirement: { type: "portfolio_value", value: 10000 },
        reward: { type: "badge", value: "Elite" },
        rarity: "epic",
    },
    {
        id: "streak_7_days",
        name: "Week Warrior",
        description: "Invest for 7 consecutive days",
        icon: "🔥",
        category: "streak",
        requirement: { type: "streak_days", value: 7 },
        reward: { type: "bonus", value: 100 },
        rarity: "rare",
    },
    {
        id: "streak_30_days",
        name: "Monthly Master",
        description: "Invest for 30 consecutive days",
        icon: "⚡",
        category: "streak",
        requirement: { type: "streak_days", value: 30 },
        reward: { type: "bonus", value: 500 },
        rarity: "epic",
    },
    {
        id: "hundred_transactions",
        name: "Transaction Hero",
        description: "Complete 100 transactions",
        icon: "🎖️",
        category: "savings",
        requirement: { type: "transaction_count", value: 100 },
        reward: { type: "feature_unlock", value: "premium_analytics" },
        rarity: "epic",
    },
    {
        id: "millionaire_portfolio",
        name: "Millionaire Status",
        description: "Reach ₦1,000,000 portfolio value",
        icon: "💎",
        category: "milestone",
        requirement: { type: "portfolio_value", value: 1000000 },
        reward: { type: "badge", value: "Millionaire" },
        rarity: "legendary",
    },
    {
        id: "roundup_master",
        name: "Round-up Master",
        description: "Complete 50 round-up investments",
        icon: "🎯",
        category: "investment",
        requirement: { type: "transaction_count", value: 50 },
        reward: { type: "badge", value: "Round-up Master" },
        rarity: "rare",
    },
    {
        id: "early_adopter",
        name: "Early Bird",
        description: "Join InvestNaija in the first month",
        icon: "🐦",
        category: "special",
        requirement: { type: "first_action", value: 1 },
        reward: { type: "badge", value: "Early Adopter" },
        rarity: "legendary",
    },
];
// User achievements storage (use database in production)
const userAchievements = new Map();
// Calculate user's current streak
const calculateStreak = (transactions) => {
    if (transactions.length === 0)
        return 0;
    const investmentTransactions = transactions
        .filter((t) => t.type === "investment")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (investmentTransactions.length === 0)
        return 0;
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    for (let i = 0; i < investmentTransactions.length; i++) {
        const transactionDate = new Date(investmentTransactions[i].createdAt);
        transactionDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((currentDate.getTime() - transactionDate.getTime()) /
            (1000 * 60 * 60 * 24));
        if (daysDiff === streak) {
            streak++;
            currentDate = new Date(transactionDate);
        }
        else if (daysDiff > streak) {
            break;
        }
    }
    return streak;
};
// Check and unlock achievements
const checkAchievements = (userId) => {
    const wallet = (0, storage_1.getUserWallet)(userId);
    const transactions = (0, storage_1.getUserTransactions)(userId);
    const investments = (0, storage_1.getUserInvestments)(userId);
    const userAchs = userAchievements.get(userId) || [];
    if (!wallet)
        return [];
    const newAchievements = [];
    const portfolioValue = wallet.totalInvested + wallet.totalReturns;
    const totalInvestmentAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const streak = calculateStreak(transactions);
    for (const achievement of achievements) {
        // Check if already unlocked
        const existingAch = userAchs.find((ua) => ua.achievementId === achievement.id);
        if (existingAch && existingAch.completed)
            continue;
        let progress = 0;
        let completed = false;
        switch (achievement.requirement.type) {
            case "first_action":
                if (achievement.id === "first_investment" && investments.length > 0) {
                    progress = 100;
                    completed = true;
                }
                else if (achievement.id === "early_adopter") {
                    // Check if user joined in first month (mock logic)
                    progress = 100;
                    completed = true;
                }
                break;
            case "investment_amount":
                const singleInvestmentMax = Math.max(...investments.map((inv) => inv.amount), 0);
                progress = Math.min(100, (singleInvestmentMax / achievement.requirement.value) * 100);
                completed = singleInvestmentMax >= achievement.requirement.value;
                break;
            case "portfolio_value":
                progress = Math.min(100, (portfolioValue / achievement.requirement.value) * 100);
                completed = portfolioValue >= achievement.requirement.value;
                break;
            case "transaction_count":
                const relevantCount = achievement.id === "roundup_master"
                    ? transactions.filter((t) => { var _a; return ((_a = t.metadata) === null || _a === void 0 ? void 0 : _a.type) === "roundup"; }).length
                    : transactions.length;
                progress = Math.min(100, (relevantCount / achievement.requirement.value) * 100);
                completed = relevantCount >= achievement.requirement.value;
                break;
            case "streak_days":
                progress = Math.min(100, (streak / achievement.requirement.value) * 100);
                completed = streak >= achievement.requirement.value;
                break;
        }
        if (completed && !existingAch) {
            newAchievements.push({
                achievementId: achievement.id,
                unlockedAt: new Date().toISOString(),
                progress: 100,
                completed: true,
            });
        }
        else if (!existingAch) {
            newAchievements.push({
                achievementId: achievement.id,
                unlockedAt: "",
                progress,
                completed: false,
            });
        }
    }
    // Update user achievements
    const updatedAchievements = [...userAchs];
    for (const newAch of newAchievements) {
        const existingIndex = updatedAchievements.findIndex((ua) => ua.achievementId === newAch.achievementId);
        if (existingIndex >= 0) {
            updatedAchievements[existingIndex] = newAch;
        }
        else {
            updatedAchievements.push(newAch);
        }
    }
    userAchievements.set(userId, updatedAchievements);
    return newAchievements.filter((ach) => ach.completed && ach.unlockedAt);
};
// Get user achievements
const getUserAchievements = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        // Check for new achievements
        const newAchievements = checkAchievements(userId);
        const userAchs = userAchievements.get(userId) || [];
        // Combine achievements with their definitions
        const achievementsWithDetails = userAchs.map((userAch) => {
            const definition = achievements.find((ach) => ach.id === userAch.achievementId);
            return Object.assign(Object.assign({}, userAch), definition);
        });
        const completedAchievements = achievementsWithDetails.filter((ach) => ach.completed);
        const inProgressAchievements = achievementsWithDetails.filter((ach) => !ach.completed);
        res.json({
            success: true,
            achievements: {
                completed: completedAchievements,
                inProgress: inProgressAchievements,
                newlyUnlocked: newAchievements.map((newAch) => {
                    const definition = achievements.find((ach) => ach.id === newAch.achievementId);
                    return Object.assign(Object.assign({}, newAch), definition);
                }),
            },
            stats: {
                totalCompleted: completedAchievements.length,
                totalAvailable: achievements.length,
                completionRate: (completedAchievements.length / achievements.length) * 100,
            },
        });
    }
    catch (error) {
        console.error("Get user achievements error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getUserAchievements = getUserAchievements;
// Get leaderboard
const getLeaderboard = (req, res) => {
    try {
        const { category = "portfolio_value", period = "all_time" } = req.query;
        // Mock leaderboard data (in production, calculate from real user data)
        const leaderboard = [
            {
                rank: 1,
                userId: "user1",
                username: "InvestorPro",
                value: 250000,
                achievements: 8,
                avatar: "👑",
            },
            {
                rank: 2,
                userId: "user2",
                username: "NaijaWealth",
                value: 180000,
                achievements: 6,
                avatar: "🏆",
            },
            {
                rank: 3,
                userId: "user3",
                username: "SmartSaver",
                value: 125000,
                achievements: 5,
                avatar: "🎯",
            },
            {
                rank: 4,
                userId: "user4",
                username: "CryptoKing",
                value: 95000,
                achievements: 4,
                avatar: "💎",
            },
            {
                rank: 5,
                userId: "user5",
                username: "MoneyMaster",
                value: 75000,
                achievements: 4,
                avatar: "💰",
            },
        ];
        res.json({
            success: true,
            leaderboard,
            userRank: Math.floor(Math.random() * 100) + 1, // Mock user rank
            category,
            period,
        });
    }
    catch (error) {
        console.error("Get leaderboard error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getLeaderboard = getLeaderboard;
// Get user level and progress
const getUserLevel = (req, res) => {
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
        const userAchs = userAchievements.get(userId) || [];
        if (!wallet) {
            return res.status(404).json({
                success: false,
                error: "Wallet not found",
            });
        }
        // Calculate level based on portfolio value and achievements
        const portfolioValue = wallet.totalInvested + wallet.totalReturns;
        const completedAchievements = userAchs.filter((ach) => ach.completed).length;
        let level = 1;
        let xp = portfolioValue / 1000 + completedAchievements * 50; // XP calculation
        // Level calculation
        if (xp >= 1000)
            level = Math.floor(xp / 1000) + 1;
        if (level > 50)
            level = 50; // Max level
        const currentLevelXP = (level - 1) * 1000;
        const nextLevelXP = level * 1000;
        const progressToNext = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
        // Level titles
        const levelTitles = [
            "Beginner",
            "Saver",
            "Investor",
            "Achiever",
            "Expert",
            "Master",
            "Elite",
            "Champion",
            "Legend",
            "Grandmaster",
        ];
        const titleIndex = Math.min(Math.floor((level - 1) / 5), levelTitles.length - 1);
        const title = levelTitles[titleIndex];
        res.json({
            success: true,
            level: {
                current: level,
                title,
                xp: Math.floor(xp),
                progressToNext: Math.min(100, progressToNext),
                nextLevelXP: nextLevelXP,
                achievements: completedAchievements,
                portfolioValue,
            },
        });
    }
    catch (error) {
        console.error("Get user level error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getUserLevel = getUserLevel;
// Claim achievement reward
const claimReward = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { achievementId } = req.body;
        const userAchs = userAchievements.get(userId) || [];
        const achievement = userAchs.find((ach) => ach.achievementId === achievementId);
        if (!achievement || !achievement.completed) {
            return res.status(400).json({
                success: false,
                error: "Achievement not completed or not found",
            });
        }
        const achievementDef = achievements.find((ach) => ach.id === achievementId);
        if (!achievementDef) {
            return res.status(404).json({
                success: false,
                error: "Achievement definition not found",
            });
        }
        // Process reward
        let rewardMessage = "";
        if (achievementDef.reward.type === "bonus") {
            // Add bonus to wallet (in production, create a transaction)
            rewardMessage = `You received ₦${achievementDef.reward.value} bonus!`;
        }
        else if (achievementDef.reward.type === "badge") {
            rewardMessage = `You earned the "${achievementDef.reward.value}" badge!`;
        }
        else if (achievementDef.reward.type === "feature_unlock") {
            rewardMessage = `You unlocked ${achievementDef.reward.value}!`;
        }
        res.json({
            success: true,
            reward: achievementDef.reward,
            message: rewardMessage,
        });
    }
    catch (error) {
        console.error("Claim reward error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.claimReward = claimReward;
