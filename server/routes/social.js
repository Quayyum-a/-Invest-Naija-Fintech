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
exports.getChallenges = exports.sendMoney = exports.getSocialPayments = exports.requestMoney = exports.getMoneyRequests = exports.createGroup = exports.getSocialGroups = void 0;
const storage_1 = require("../data/storage");
const storage_2 = require("../data/storage");
const userLookup_1 = require("../data/userLookup");
// Get user's social groups
const getSocialGroups = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        const user = token ? (0, storage_2.getSessionUser)(token) : null;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        const groups = (0, storage_1.getUserSocialGroups)(user.id);
        const groupsWithMembers = groups.map((group) => {
            const members = (0, storage_1.getGroupMembers)(group.id);
            return Object.assign(Object.assign({}, group), { members: members.map((member) => ({
                    id: member.userId,
                    name: `${member.firstName} ${member.lastName}`,
                    avatar: "", // TODO: Add avatar support
                    contribution: member.contribution,
                    joinedAt: member.joinedAt,
                    status: member.status,
                })) });
        });
        res.json({
            success: true,
            groups: groupsWithMembers,
        });
    }
    catch (error) {
        console.error("Get social groups error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.getSocialGroups = getSocialGroups;
// Create a new social group
const createGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        const user = token ? (0, storage_2.getSessionUser)(token) : null;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        const { name, description, targetAmount, endDate, category } = req.body;
        if (!name || !targetAmount) {
            return res.status(400).json({
                success: false,
                error: "Group name and target amount are required",
            });
        }
        const group = (0, storage_1.createSocialGroup)({
            name,
            description,
            targetAmount: parseFloat(targetAmount),
            createdBy: user.id,
            endDate,
            category,
        });
        // Create notification
        (0, storage_1.createNotification)({
            userId: user.id,
            title: "Group Created",
            message: `You created the group "${name}"`,
            type: "social",
        });
        res.json({
            success: true,
            group: Object.assign(Object.assign({}, group), { members: [
                    {
                        id: user.id,
                        name: `${user.firstName} ${user.lastName}`,
                        avatar: "",
                        contribution: 0,
                        joinedAt: group.createdAt,
                        status: "active",
                    },
                ] }),
        });
    }
    catch (error) {
        console.error("Create group error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.createGroup = createGroup;
// Get money requests
const getMoneyRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        const user = token ? (0, storage_2.getSessionUser)(token) : null;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        const requests = (0, storage_1.getUserMoneyRequests)(user.id);
        const formattedRequests = requests.map((request) => ({
            id: request.id,
            from: request.fromUserId,
            to: request.toUserId,
            amount: request.amount,
            reason: request.reason,
            status: request.status,
            createdAt: request.createdAt,
            dueDate: request.dueDate,
            fromName: `${request.fromFirstName} ${request.fromLastName}`,
            toName: `${request.toFirstName} ${request.toLastName}`,
        }));
        res.json({
            success: true,
            requests: formattedRequests,
        });
    }
    catch (error) {
        console.error("Get money requests error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.getMoneyRequests = getMoneyRequests;
// Create money request
const requestMoney = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        const user = token ? (0, storage_2.getSessionUser)(token) : null;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        const { to, amount, reason, dueDate } = req.body;
        if (!to || !amount || !reason) {
            return res.status(400).json({
                success: false,
                error: "Recipient, amount, and reason are required",
            });
        }
        // Validate and find recipient
        const recipientValidation = (0, userLookup_1.validateRecipient)(to);
        if (!recipientValidation.valid) {
            return res.status(400).json({
                success: false,
                error: recipientValidation.error,
            });
        }
        const recipient = recipientValidation.user;
        // Check if recipient can receive this amount
        const canReceive = (0, userLookup_1.canReceiveMoney)(recipient, parseFloat(amount));
        if (!canReceive.canReceive) {
            return res.status(400).json({
                success: false,
                error: canReceive.reason,
            });
        }
        // Prevent self-requests
        if (recipient.id === user.id) {
            return res.status(400).json({
                success: false,
                error: "You cannot request money from yourself",
            });
        }
        const request = (0, storage_1.createMoneyRequest)({
            fromUserId: user.id,
            toUserId: recipient.id,
            amount: parseFloat(amount),
            reason,
            dueDate,
        });
        // Create notification for recipient
        (0, storage_1.createNotification)({
            userId: recipient.id,
            title: "Money Request",
            message: `${(0, userLookup_1.getUserDisplayName)(user)} requested ₦${amount.toLocaleString()}`,
            type: "money_request",
            metadata: { requestId: request.id },
        });
        res.json({
            success: true,
            request,
        });
    }
    catch (error) {
        console.error("Request money error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.requestMoney = requestMoney;
// Get social payments
const getSocialPayments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        const user = token ? (0, storage_2.getSessionUser)(token) : null;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        const payments = (0, storage_1.getUserSocialPayments)(user.id);
        const formattedPayments = payments.map((payment) => ({
            id: payment.id,
            from: payment.fromUserId,
            to: payment.toUserId,
            amount: payment.amount,
            message: payment.message,
            type: payment.type,
            isPublic: payment.isPublic,
            createdAt: payment.createdAt,
            fromName: `${payment.fromFirstName} ${payment.fromLastName}`,
            toName: `${payment.toFirstName} ${payment.toLastName}`,
        }));
        res.json({
            success: true,
            payments: formattedPayments,
        });
    }
    catch (error) {
        console.error("Get social payments error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.getSocialPayments = getSocialPayments;
// Send money
const sendMoney = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        const user = token ? (0, storage_2.getSessionUser)(token) : null;
        if (!user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        const { to, amount, message, type, isPublic } = req.body;
        if (!to || !amount) {
            return res.status(400).json({
                success: false,
                error: "Recipient and amount are required",
            });
        }
        const amountNum = parseFloat(amount);
        // Validate and find recipient
        const recipientValidation = (0, userLookup_1.validateRecipient)(to);
        if (!recipientValidation.valid) {
            return res.status(400).json({
                success: false,
                error: recipientValidation.error,
            });
        }
        const recipient = recipientValidation.user;
        // Check if recipient can receive this amount
        const canReceive = (0, userLookup_1.canReceiveMoney)(recipient, amountNum);
        if (!canReceive.canReceive) {
            return res.status(400).json({
                success: false,
                error: canReceive.reason,
            });
        }
        // Prevent self-payments
        if (recipient.id === user.id) {
            return res.status(400).json({
                success: false,
                error: "You cannot send money to yourself",
            });
        }
        // Check sender's wallet balance
        const fromWallet = (0, storage_1.getUserWallet)(user.id);
        if (!fromWallet || fromWallet.balance < amountNum) {
            return res.status(400).json({
                success: false,
                error: "Insufficient wallet balance",
            });
        }
        // Get recipient's wallet
        const toWallet = (0, storage_1.getUserWallet)(recipient.id);
        if (!toWallet) {
            return res.status(404).json({
                success: false,
                error: "Recipient wallet not found",
            });
        }
        // Update wallets
        (0, storage_1.updateWallet)(user.id, {
            balance: fromWallet.balance - amountNum,
        });
        (0, storage_1.updateWallet)(recipient.id, {
            balance: toWallet.balance + amountNum,
        });
        // Create transaction records
        (0, storage_1.createTransaction)({
            userId: user.id,
            type: "transfer_out",
            amount: amountNum,
            description: `Social payment to ${(0, userLookup_1.getUserDisplayName)(recipient)}`,
            status: "completed",
            metadata: {
                recipientId: recipient.id,
                recipientName: (0, userLookup_1.getUserDisplayName)(recipient),
                type,
                message,
            },
        });
        (0, storage_1.createTransaction)({
            userId: recipient.id,
            type: "transfer_in",
            amount: amountNum,
            description: `Social payment from ${(0, userLookup_1.getUserDisplayName)(user)}`,
            status: "completed",
            metadata: {
                senderId: user.id,
                senderName: (0, userLookup_1.getUserDisplayName)(user),
                type,
                message,
            },
        });
        // Create social payment record
        const payment = (0, storage_1.createSocialPayment)({
            fromUserId: user.id,
            toUserId: recipient.id,
            amount: amountNum,
            message: message || `Payment from ${(0, userLookup_1.getUserDisplayName)(user)}`,
            type: type || "payment",
            isPublic: isPublic || false,
        });
        // Create notifications
        (0, storage_1.createNotification)({
            userId: user.id,
            title: "Payment Sent",
            message: `You sent ₦${amountNum.toLocaleString()} to ${to}`,
            type: "payment",
        });
        (0, storage_1.createNotification)({
            userId: "demo-user-id",
            title: "Payment Received",
            message: `${user.firstName} ${user.lastName} sent you ₦${amountNum.toLocaleString()}`,
            type: "payment",
        });
        res.json({
            success: true,
            payment,
        });
    }
    catch (error) {
        console.error("Send money error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.sendMoney = sendMoney;
// Get financial challenges
const getChallenges = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const challenges = (0, storage_1.getFinancialChallenges)();
        const challengesWithParticipants = challenges.map((challenge) => {
            const participants = (0, storage_1.getChallengeParticipants)(challenge.id);
            return Object.assign(Object.assign({}, challenge), { participants: participants.map((p, index) => ({
                    id: p.userId,
                    name: `${p.firstName} ${p.lastName}`,
                    avatar: "",
                    progress: p.progress,
                    rank: index + 1,
                })) });
        });
        res.json({
            success: true,
            challenges: challengesWithParticipants,
        });
    }
    catch (error) {
        console.error("Get challenges error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
});
exports.getChallenges = getChallenges;
