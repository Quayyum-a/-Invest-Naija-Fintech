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
exports.getFinancialChallenges = exports.sendSocialPayment = exports.respondToMoneyRequest = exports.sendMoneyRequest = exports.getMoneyRequests = exports.joinSocialGroup = exports.createSocialGroup = exports.getSocialGroups = void 0;
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const storage_1 = require("../data/storage");
const termiiService_1 = require("../services/termiiService");
// Validation schemas
const createGroupSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Group name must be at least 3 characters").max(50),
    description: zod_1.z.string().max(200).optional(),
    target_amount: zod_1.z.number().min(10000, "Minimum target amount is ₦10,000"),
    contribution_frequency: zod_1.z.enum(["daily", "weekly", "monthly"], {
        errorMap: () => ({ message: "Invalid contribution frequency" }),
    }),
    contribution_amount: zod_1.z.number().min(500, "Minimum contribution is ₦500"),
    max_members: zod_1.z.number().min(2).max(50).default(10),
    auto_save: zod_1.z.boolean().default(false),
    privacy: zod_1.z.enum(["public", "private", "invite_only"]).default("private"),
});
const joinGroupSchema = zod_1.z.object({
    group_id: zod_1.z.string().min(1, "Group ID is required"),
    invite_code: zod_1.z.string().optional(),
});
const moneyRequestSchema = zod_1.z.object({
    recipient_email: zod_1.z.string().email("Invalid email address"),
    amount: zod_1.z.number().min(100, "Minimum request amount is ₦100").max(500000),
    reason: zod_1.z.string().min(1, "Reason is required").max(100),
    due_date: zod_1.z.string().optional(),
});
const respondToRequestSchema = zod_1.z.object({
    request_id: zod_1.z.string().min(1, "Request ID is required"),
    action: zod_1.z.enum(["approve", "decline"], {
        errorMap: () => ({ message: "Action must be 'approve' or 'decline'" }),
    }),
    message: zod_1.z.string().max(200).optional(),
});
const socialPaymentSchema = zod_1.z.object({
    recipient_email: zod_1.z.string().email("Invalid email address"),
    amount: zod_1.z.number().min(100, "Minimum payment amount is ₦100").max(500000),
    message: zod_1.z.string().max(200).optional(),
    occasion: zod_1.z
        .enum(["birthday", "graduation", "wedding", "general", "other"])
        .default("general"),
    is_gift: zod_1.z.boolean().default(false),
});
// Mock data storage (in production, use database)
const mockGroups = [];
const mockMoneyRequests = [];
const mockChallenges = [
    {
        id: "challenge_1",
        title: "Save ₦100k in 30 Days",
        description: "Join others to save ₦100,000 in 30 days",
        target_amount: 100000,
        duration_days: 30,
        participants: 156,
        prize: "₦50,000 cash prize for top 10 savers",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
    },
    {
        id: "challenge_2",
        title: "Weekly Savings Challenge",
        description: "Save a minimum of ₦5,000 every week",
        target_amount: 20000,
        duration_days: 28,
        participants: 89,
        prize: "₦20,000 total prize pool",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
    },
];
// Get user's social groups
const getSocialGroups = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        // Filter groups where user is a member
        const userGroups = mockGroups.filter((group) => group.members.some((member) => member.user_id === userId));
        // Add user role and contribution status to each group
        const groupsWithStatus = userGroups.map((group) => {
            const userMembership = group.members.find((member) => member.user_id === userId);
            const totalContributed = group.contributions
                .filter((contrib) => contrib.user_id === userId)
                .reduce((sum, contrib) => sum + contrib.amount, 0);
            return Object.assign(Object.assign({}, group), { user_role: (userMembership === null || userMembership === void 0 ? void 0 : userMembership.role) || "member", user_total_contributed: totalContributed, user_next_contribution_due: userMembership === null || userMembership === void 0 ? void 0 : userMembership.next_contribution_due, progress_percentage: Math.min((group.total_saved / group.target_amount) * 100, 100) });
        });
        res.json({
            success: true,
            data: {
                groups: groupsWithStatus,
                total: groupsWithStatus.length,
                stats: {
                    total_groups: groupsWithStatus.length,
                    active_groups: groupsWithStatus.filter((g) => g.status === "active")
                        .length,
                    total_saved: groupsWithStatus.reduce((sum, g) => sum + g.user_total_contributed, 0),
                },
            },
        });
    }
    catch (error) {
        console.error("Get social groups error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch social groups",
        });
    }
});
exports.getSocialGroups = getSocialGroups;
// Create a new social group
const createSocialGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = createGroupSchema.parse(req.body);
        const { name, description, target_amount, contribution_frequency, contribution_amount, max_members, auto_save, privacy, } = validatedData;
        // Check if user can create groups (basic validation)
        if (req.user.kycStatus !== "verified") {
            return res.status(400).json({
                success: false,
                error: "KYC verification required to create groups",
            });
        }
        const groupId = `group_${Date.now()}_${(0, crypto_1.randomUUID)().slice(0, 8)}`;
        const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newGroup = {
            id: groupId,
            name,
            description: description || "",
            target_amount,
            contribution_frequency,
            contribution_amount,
            max_members,
            auto_save,
            privacy,
            invite_code: inviteCode,
            creator_id: userId,
            creator_name: `${req.user.firstName} ${req.user.lastName}`,
            status: "active",
            total_saved: 0,
            members: [
                {
                    user_id: userId,
                    user_name: `${req.user.firstName} ${req.user.lastName}`,
                    user_email: req.user.email,
                    role: "admin",
                    joined_at: new Date().toISOString(),
                    next_contribution_due: new Date(Date.now() +
                        (contribution_frequency === "daily"
                            ? 24 * 60 * 60 * 1000
                            : contribution_frequency === "weekly"
                                ? 7 * 24 * 60 * 60 * 1000
                                : 30 * 24 * 60 * 60 * 1000)).toISOString(),
                },
            ],
            contributions: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        mockGroups.push(newGroup);
        // Create audit transaction
        (0, storage_1.createTransaction)({
            userId,
            type: "social_activity",
            amount: 0,
            description: `Created group: ${name}`,
            status: "completed",
            metadata: {
                group_id: groupId,
                group_name: name,
                activity_type: "group_created",
            },
        });
        res.json({
            success: true,
            data: {
                group: newGroup,
                invite_link: `https://investnaija.com/groups/join/${groupId}?code=${inviteCode}`,
            },
            message: `Group "${name}" created successfully`,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Create social group error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to create group",
        });
    }
});
exports.createSocialGroup = createSocialGroup;
// Join a social group
const joinSocialGroup = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = joinGroupSchema.parse(req.body);
        const { group_id, invite_code } = validatedData;
        const group = mockGroups.find((g) => g.id === group_id);
        if (!group) {
            return res.status(404).json({
                success: false,
                error: "Group not found",
            });
        }
        // Check if group is full
        if (group.members.length >= group.max_members) {
            return res.status(400).json({
                success: false,
                error: "Group is full",
            });
        }
        // Check if user is already a member
        const isAlreadyMember = group.members.some((member) => member.user_id === userId);
        if (isAlreadyMember) {
            return res.status(400).json({
                success: false,
                error: "You are already a member of this group",
            });
        }
        // Check invite code for private groups
        if (group.privacy !== "public" && group.invite_code !== invite_code) {
            return res.status(400).json({
                success: false,
                error: "Invalid invite code",
            });
        }
        // Add user to group
        const newMember = {
            user_id: userId,
            user_name: `${req.user.firstName} ${req.user.lastName}`,
            user_email: req.user.email,
            role: "member",
            joined_at: new Date().toISOString(),
            next_contribution_due: new Date(Date.now() +
                (group.contribution_frequency === "daily"
                    ? 24 * 60 * 60 * 1000
                    : group.contribution_frequency === "weekly"
                        ? 7 * 24 * 60 * 60 * 1000
                        : 30 * 24 * 60 * 60 * 1000)).toISOString(),
        };
        group.members.push(newMember);
        group.updated_at = new Date().toISOString();
        // Create audit transaction
        (0, storage_1.createTransaction)({
            userId,
            type: "social_activity",
            amount: 0,
            description: `Joined group: ${group.name}`,
            status: "completed",
            metadata: {
                group_id,
                group_name: group.name,
                activity_type: "group_joined",
            },
        });
        // Send SMS notification to user
        if (req.user.phone) {
            try {
                yield termiiService_1.termiiService.sendSMSSafe({
                    to: req.user.phone,
                    message: `InvestNaija: You've successfully joined the group "${group.name}". Next contribution of ₦${group.contribution_amount.toLocaleString()} is due ${group.contribution_frequency}.`,
                });
            }
            catch (smsError) {
                console.error("SMS notification failed:", smsError);
            }
        }
        res.json({
            success: true,
            data: {
                group: Object.assign(Object.assign({}, group), { user_role: "member", user_total_contributed: 0 }),
                member: newMember,
            },
            message: `Successfully joined "${group.name}"`,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Join social group error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to join group",
        });
    }
});
exports.joinSocialGroup = joinSocialGroup;
// Get money requests
const getMoneyRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const status = req.query.status;
        const type = req.query.type;
        let requests = mockMoneyRequests.filter((request) => request.sender_id === userId || request.recipient_id === userId);
        // Filter by type
        if (type === "sent") {
            requests = requests.filter((request) => request.sender_id === userId);
        }
        else if (type === "received") {
            requests = requests.filter((request) => request.recipient_id === userId);
        }
        // Filter by status
        if (status) {
            requests = requests.filter((request) => request.status === status);
        }
        // Sort by date (newest first)
        requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const stats = {
            total_sent: mockMoneyRequests.filter((r) => r.sender_id === userId)
                .length,
            total_received: mockMoneyRequests.filter((r) => r.recipient_id === userId)
                .length,
            pending_sent: mockMoneyRequests.filter((r) => r.sender_id === userId && r.status === "pending").length,
            pending_received: mockMoneyRequests.filter((r) => r.recipient_id === userId && r.status === "pending").length,
        };
        res.json({
            success: true,
            data: {
                requests,
                stats,
                total: requests.length,
            },
        });
    }
    catch (error) {
        console.error("Get money requests error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch money requests",
        });
    }
});
exports.getMoneyRequests = getMoneyRequests;
// Send money request
const sendMoneyRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = moneyRequestSchema.parse(req.body);
        const { recipient_email, amount, reason, due_date } = validatedData;
        // Check if requesting from self
        if (recipient_email === req.user.email) {
            return res.status(400).json({
                success: false,
                error: "Cannot request money from yourself",
            });
        }
        // Find recipient
        const recipient = (0, storage_1.getUserByEmail)(recipient_email);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                error: "Recipient not found",
            });
        }
        const requestId = `request_${Date.now()}_${(0, crypto_1.randomUUID)().slice(0, 8)}`;
        const moneyRequest = {
            id: requestId,
            sender_id: userId,
            sender_name: `${req.user.firstName} ${req.user.lastName}`,
            sender_email: req.user.email,
            recipient_id: recipient.id,
            recipient_name: `${recipient.firstName} ${recipient.lastName}`,
            recipient_email: recipient.email,
            amount,
            reason,
            due_date: due_date || null,
            status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        mockMoneyRequests.push(moneyRequest);
        // Create audit transaction
        (0, storage_1.createTransaction)({
            userId,
            type: "social_activity",
            amount: 0,
            description: `Money request sent to ${recipient.firstName} ${recipient.lastName}`,
            status: "completed",
            metadata: {
                request_id: requestId,
                recipient_email,
                amount,
                reason,
                activity_type: "money_request_sent",
            },
        });
        // Send SMS notification to recipient
        if (recipient.phone) {
            try {
                yield termiiService_1.termiiService.sendSMSSafe({
                    to: recipient.phone,
                    message: `InvestNaija: ${req.user.firstName} ${req.user.lastName} has requested ₦${amount.toLocaleString()} from you. Reason: ${reason}. Check your app to respond.`,
                });
            }
            catch (smsError) {
                console.error("SMS notification failed:", smsError);
            }
        }
        res.json({
            success: true,
            data: moneyRequest,
            message: `Money request sent to ${recipient.firstName} ${recipient.lastName}`,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Send money request error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send money request",
        });
    }
});
exports.sendMoneyRequest = sendMoneyRequest;
// Respond to money request
const respondToMoneyRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = respondToRequestSchema.parse(req.body);
        const { request_id, action, message } = validatedData;
        const request = mockMoneyRequests.find((r) => r.id === request_id);
        if (!request) {
            return res.status(404).json({
                success: false,
                error: "Money request not found",
            });
        }
        // Check if user is the recipient
        if (request.recipient_id !== userId) {
            return res.status(403).json({
                success: false,
                error: "You can only respond to requests sent to you",
            });
        }
        // Check if request is still pending
        if (request.status !== "pending") {
            return res.status(400).json({
                success: false,
                error: "This request has already been processed",
            });
        }
        if (action === "approve") {
            // Check wallet balance
            const wallet = (0, storage_1.getUserWallet)(userId);
            if (!wallet || wallet.balance < request.amount) {
                return res.status(400).json({
                    success: false,
                    error: "Insufficient wallet balance",
                });
            }
            // Process the payment (similar to P2P transfer)
            const reference = `money_request_${Date.now()}_${userId.slice(0, 8)}`;
            // Get recipient wallet
            const recipientWallet = (0, storage_1.getUserWallet)(request.sender_id);
            if (!recipientWallet) {
                return res.status(404).json({
                    success: false,
                    error: "Recipient wallet not found",
                });
            }
            // Create transactions
            const senderTransaction = (0, storage_1.createTransaction)({
                userId,
                type: "transfer",
                amount: -request.amount,
                description: `Money request payment to ${request.sender_name}`,
                status: "completed",
                metadata: {
                    reference,
                    request_id,
                    recipient_id: request.sender_id,
                    type: "debit",
                    request_reason: request.reason,
                },
            });
            (0, storage_1.createTransaction)({
                userId: request.sender_id,
                type: "transfer",
                amount: request.amount,
                description: `Money request fulfilled by ${req.user.firstName} ${req.user.lastName}`,
                status: "completed",
                metadata: {
                    reference,
                    request_id,
                    sender_id: userId,
                    type: "credit",
                    request_reason: request.reason,
                },
            });
            // Update wallets
            const updatedSenderWallet = (0, storage_1.updateWallet)(userId, {
                balance: wallet.balance - request.amount,
            });
            (0, storage_1.updateWallet)(request.sender_id, {
                balance: recipientWallet.balance + request.amount,
            });
            // Update request status
            request.status = "approved";
            request.response_message = message || "Request approved";
            request.processed_at = new Date().toISOString();
            request.updated_at = new Date().toISOString();
            // Send SMS notifications
            if (req.user.phone) {
                try {
                    yield termiiService_1.termiiService.sendSMSSafe({
                        to: req.user.phone,
                        message: `InvestNaija: ₦${request.amount.toLocaleString()} sent to ${request.sender_name}. Balance: ₦${updatedSenderWallet.balance.toLocaleString()}`,
                    });
                }
                catch (smsError) {
                    console.error("SMS notification failed:", smsError);
                }
            }
            res.json({
                success: true,
                data: {
                    request,
                    transaction: senderTransaction,
                    wallet: updatedSenderWallet,
                },
                message: `₦${request.amount.toLocaleString()} sent to ${request.sender_name}`,
            });
        }
        else {
            // Decline the request
            request.status = "declined";
            request.response_message = message || "Request declined";
            request.processed_at = new Date().toISOString();
            request.updated_at = new Date().toISOString();
            res.json({
                success: true,
                data: request,
                message: "Money request declined",
            });
        }
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Respond to money request error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to process request response",
        });
    }
});
exports.respondToMoneyRequest = respondToMoneyRequest;
// Send social payment (gift)
const sendSocialPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId || !req.user) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const validatedData = socialPaymentSchema.parse(req.body);
        const { recipient_email, amount, message, occasion, is_gift } = validatedData;
        // Check if sending to self
        if (recipient_email === req.user.email) {
            return res.status(400).json({
                success: false,
                error: "Cannot send payment to yourself",
            });
        }
        // Find recipient
        const recipient = (0, storage_1.getUserByEmail)(recipient_email);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                error: "Recipient not found",
            });
        }
        // Get sender wallet
        const wallet = (0, storage_1.getUserWallet)(userId);
        if (!wallet || wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                error: "Insufficient wallet balance",
            });
        }
        // Get recipient wallet
        const recipientWallet = (0, storage_1.getUserWallet)(recipient.id);
        if (!recipientWallet) {
            return res.status(404).json({
                success: false,
                error: "Recipient wallet not found",
            });
        }
        const reference = `social_payment_${Date.now()}_${userId.slice(0, 8)}`;
        // Create transactions
        const senderTransaction = (0, storage_1.createTransaction)({
            userId,
            type: "social_payment",
            amount: -amount,
            description: `${is_gift ? "Gift" : "Payment"} to ${recipient.firstName} ${recipient.lastName}`,
            status: "completed",
            metadata: {
                reference,
                recipient_id: recipient.id,
                occasion,
                message,
                is_gift,
                type: "debit",
            },
        });
        (0, storage_1.createTransaction)({
            userId: recipient.id,
            type: "social_payment",
            amount: amount,
            description: `${is_gift ? "Gift" : "Payment"} from ${req.user.firstName} ${req.user.lastName}`,
            status: "completed",
            metadata: {
                reference,
                sender_id: userId,
                occasion,
                message,
                is_gift,
                type: "credit",
            },
        });
        // Update wallets
        const updatedSenderWallet = (0, storage_1.updateWallet)(userId, {
            balance: wallet.balance - amount,
        });
        (0, storage_1.updateWallet)(recipient.id, {
            balance: recipientWallet.balance + amount,
        });
        // Send SMS notifications
        if (req.user.phone) {
            try {
                yield termiiService_1.termiiService.sendSMSSafe({
                    to: req.user.phone,
                    message: `InvestNaija: ₦${amount.toLocaleString()} ${is_gift ? "gift" : "payment"} sent to ${recipient.firstName} ${recipient.lastName}. Balance: ₦${updatedSenderWallet.balance.toLocaleString()}`,
                });
            }
            catch (smsError) {
                console.error("SMS notification failed:", smsError);
            }
        }
        if (recipient.phone) {
            try {
                const messageText = message ? ` Message: "${message}"` : "";
                yield termiiService_1.termiiService.sendSMSSafe({
                    to: recipient.phone,
                    message: `InvestNaija: You received a ₦${amount.toLocaleString()} ${is_gift ? "gift" : "payment"} from ${req.user.firstName} ${req.user.lastName}${messageText}`,
                });
            }
            catch (smsError) {
                console.error("SMS notification failed:", smsError);
            }
        }
        res.json({
            success: true,
            data: {
                transaction: senderTransaction,
                wallet: updatedSenderWallet,
                recipient: {
                    name: `${recipient.firstName} ${recipient.lastName}`,
                    email: recipient.email,
                },
            },
            message: `₦${amount.toLocaleString()} ${is_gift ? "gift" : "payment"} sent successfully`,
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({
                success: false,
                error: error.errors[0].message,
            });
        }
        console.error("Send social payment error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to send payment",
        });
    }
});
exports.sendSocialPayment = sendSocialPayment;
// Get financial challenges
const getFinancialChallenges = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const status = req.query.status;
        let challenges = [...mockChallenges];
        // Filter by status
        if (status) {
            challenges = challenges.filter((challenge) => challenge.status === status);
        }
        // Add user participation status
        const challengesWithUserStatus = challenges.map((challenge) => (Object.assign(Object.assign({}, challenge), { user_participating: false, user_progress: 0, user_rank: null })));
        res.json({
            success: true,
            data: {
                challenges: challengesWithUserStatus,
                total: challengesWithUserStatus.length,
                user_stats: {
                    challenges_joined: 0,
                    challenges_completed: 0,
                    total_saved_in_challenges: 0,
                    current_streak: 0,
                },
            },
        });
    }
    catch (error) {
        console.error("Get financial challenges error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch financial challenges",
        });
    }
});
exports.getFinancialChallenges = getFinancialChallenges;
