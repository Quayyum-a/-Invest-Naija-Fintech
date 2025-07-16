"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotification = exports.markAllNotificationsRead = exports.markNotificationRead = exports.getUserNotifications = exports.notifySecurityAlert = exports.notifyInvestmentCreated = exports.notifyTransactionSuccess = exports.notifyDailyLimitExceeded = exports.notifyKYCRequired = exports.notifyInvalidAmount = exports.notifyInsufficientFunds = exports.createNotification = void 0;
// In-memory notification storage (use database in production)
const notifications = new Map();
const createNotification = (userId, notification) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = Object.assign(Object.assign({}, notification), { id,
        userId, read: false, createdAt: new Date().toISOString() });
    const userNotifications = notifications.get(userId) || [];
    userNotifications.unshift(newNotification);
    // Keep only last 50 notifications per user
    if (userNotifications.length > 50) {
        userNotifications.splice(50);
    }
    notifications.set(userId, userNotifications);
    return newNotification;
};
exports.createNotification = createNotification;
// Common transaction error notifications
const notifyInsufficientFunds = (userId, requiredAmount, availableAmount) => {
    return (0, exports.createNotification)(userId, {
        type: "error",
        title: "Insufficient Funds",
        message: `You need ₦${requiredAmount.toLocaleString()} but only have ₦${availableAmount.toLocaleString()} available.`,
        category: "transaction",
        metadata: { requiredAmount, availableAmount },
    });
};
exports.notifyInsufficientFunds = notifyInsufficientFunds;
const notifyInvalidAmount = (userId, minAmount, maxAmount) => {
    let message = "Please enter a valid amount.";
    if (minAmount && maxAmount) {
        message = `Amount must be between ₦${minAmount.toLocaleString()} and ₦${maxAmount.toLocaleString()}.`;
    }
    else if (minAmount) {
        message = `Minimum amount is ₦${minAmount.toLocaleString()}.`;
    }
    else if (maxAmount) {
        message = `Maximum amount is ₦${maxAmount.toLocaleString()}.`;
    }
    return (0, exports.createNotification)(userId, {
        type: "error",
        title: "Invalid Amount",
        message,
        category: "transaction",
        metadata: { minAmount, maxAmount },
    });
};
exports.notifyInvalidAmount = notifyInvalidAmount;
const notifyKYCRequired = (userId, action) => {
    return (0, exports.createNotification)(userId, {
        type: "warning",
        title: "KYC Verification Required",
        message: `Please complete your KYC verification to ${action}. This helps us keep your account secure.`,
        category: "kyc",
        metadata: { action },
    });
};
exports.notifyKYCRequired = notifyKYCRequired;
const notifyDailyLimitExceeded = (userId, limit, attemptedAmount) => {
    return (0, exports.createNotification)(userId, {
        type: "error",
        title: "Daily Limit Exceeded",
        message: `Daily limit is ₦${limit.toLocaleString()}. You attempted ₦${attemptedAmount.toLocaleString()}.`,
        category: "transaction",
        metadata: { limit, attemptedAmount },
    });
};
exports.notifyDailyLimitExceeded = notifyDailyLimitExceeded;
const notifyTransactionSuccess = (userId, type, amount, recipient) => {
    let message = `Successfully processed ₦${amount.toLocaleString()} ${type}.`;
    if (recipient) {
        message = `Successfully sent ₦${amount.toLocaleString()} to ${recipient}.`;
    }
    return (0, exports.createNotification)(userId, {
        type: "success",
        title: "Transaction Successful",
        message,
        category: "transaction",
        metadata: { type, amount, recipient },
    });
};
exports.notifyTransactionSuccess = notifyTransactionSuccess;
const notifyInvestmentCreated = (userId, amount, type) => {
    return (0, exports.createNotification)(userId, {
        type: "success",
        title: "Investment Created",
        message: `Successfully invested ₦${amount.toLocaleString()} in ${type.replace("_", " ")}.`,
        category: "investment",
        metadata: { amount, type },
    });
};
exports.notifyInvestmentCreated = notifyInvestmentCreated;
const notifySecurityAlert = (userId, action, ipAddress) => {
    return (0, exports.createNotification)(userId, {
        type: "warning",
        title: "Security Alert",
        message: `${action} detected on your account. If this wasn't you, please contact support immediately.`,
        category: "security",
        metadata: { action, ipAddress },
    });
};
exports.notifySecurityAlert = notifySecurityAlert;
// API Routes
const getUserNotifications = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const limit = parseInt(req.query.limit) || 20;
        const unreadOnly = req.query.unread === "true";
        let userNotifications = notifications.get(userId) || [];
        if (unreadOnly) {
            userNotifications = userNotifications.filter((n) => !n.read);
        }
        const limitedNotifications = userNotifications.slice(0, limit);
        const unreadCount = userNotifications.filter((n) => !n.read).length;
        res.json({
            success: true,
            notifications: limitedNotifications,
            unreadCount,
            total: userNotifications.length,
        });
    }
    catch (error) {
        console.error("Get notifications error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.getUserNotifications = getUserNotifications;
const markNotificationRead = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { notificationId } = req.params;
        const userNotifications = notifications.get(userId) || [];
        const notification = userNotifications.find((n) => n.id === notificationId);
        if (!notification) {
            return res.status(404).json({
                success: false,
                error: "Notification not found",
            });
        }
        notification.read = true;
        notifications.set(userId, userNotifications);
        res.json({
            success: true,
            message: "Notification marked as read",
        });
    }
    catch (error) {
        console.error("Mark notification read error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.markNotificationRead = markNotificationRead;
const markAllNotificationsRead = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const userNotifications = notifications.get(userId) || [];
        userNotifications.forEach((n) => (n.read = true));
        notifications.set(userId, userNotifications);
        res.json({
            success: true,
            message: "All notifications marked as read",
        });
    }
    catch (error) {
        console.error("Mark all notifications read error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.markAllNotificationsRead = markAllNotificationsRead;
const deleteNotification = (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const { notificationId } = req.params;
        const userNotifications = notifications.get(userId) || [];
        const filteredNotifications = userNotifications.filter((n) => n.id !== notificationId);
        if (filteredNotifications.length === userNotifications.length) {
            return res.status(404).json({
                success: false,
                error: "Notification not found",
            });
        }
        notifications.set(userId, filteredNotifications);
        res.json({
            success: true,
            message: "Notification deleted",
        });
    }
    catch (error) {
        console.error("Delete notification error:", error);
        res.status(500).json({
            success: false,
            error: "Internal server error",
        });
    }
};
exports.deleteNotification = deleteNotification;
