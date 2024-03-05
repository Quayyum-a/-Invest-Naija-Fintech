import { RequestHandler } from "express";
import { ErrorResponse } from "@shared/api";

interface Notification {
  id: string;
  userId: string;
  type: "error" | "warning" | "info" | "success";
  title: string;
  message: string;
  category: "transaction" | "investment" | "kyc" | "security" | "general";
  metadata?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

// In-memory notification storage (use database in production)
const notifications = new Map<string, Notification[]>();

export const createNotification = (
  userId: string,
  notification: Omit<Notification, "id" | "userId" | "read" | "createdAt">,
): Notification => {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newNotification: Notification = {
    ...notification,
    id,
    userId,
    read: false,
    createdAt: new Date().toISOString(),
  };

  const userNotifications = notifications.get(userId) || [];
  userNotifications.unshift(newNotification);

  // Keep only last 50 notifications per user
  if (userNotifications.length > 50) {
    userNotifications.splice(50);
  }

  notifications.set(userId, userNotifications);
  return newNotification;
};

// Common transaction error notifications
export const notifyInsufficientFunds = (
  userId: string,
  requiredAmount: number,
  availableAmount: number,
) => {
  return createNotification(userId, {
    type: "error",
    title: "Insufficient Funds",
    message: `You need ₦${requiredAmount.toLocaleString()} but only have ₦${availableAmount.toLocaleString()} available.`,
    category: "transaction",
    metadata: { requiredAmount, availableAmount },
  });
};

export const notifyInvalidAmount = (
  userId: string,
  minAmount?: number,
  maxAmount?: number,
) => {
  let message = "Please enter a valid amount.";
  if (minAmount && maxAmount) {
    message = `Amount must be between ₦${minAmount.toLocaleString()} and ₦${maxAmount.toLocaleString()}.`;
  } else if (minAmount) {
    message = `Minimum amount is ₦${minAmount.toLocaleString()}.`;
  } else if (maxAmount) {
    message = `Maximum amount is ₦${maxAmount.toLocaleString()}.`;
  }

  return createNotification(userId, {
    type: "error",
    title: "Invalid Amount",
    message,
    category: "transaction",
    metadata: { minAmount, maxAmount },
  });
};

export const notifyKYCRequired = (userId: string, action: string) => {
  return createNotification(userId, {
    type: "warning",
    title: "KYC Verification Required",
    message: `Please complete your KYC verification to ${action}. This helps us keep your account secure.`,
    category: "kyc",
    metadata: { action },
  });
};

export const notifyDailyLimitExceeded = (
  userId: string,
  limit: number,
  attemptedAmount: number,
) => {
  return createNotification(userId, {
    type: "error",
    title: "Daily Limit Exceeded",
    message: `Daily limit is ₦${limit.toLocaleString()}. You attempted ₦${attemptedAmount.toLocaleString()}.`,
    category: "transaction",
    metadata: { limit, attemptedAmount },
  });
};

export const notifyTransactionSuccess = (
  userId: string,
  type: string,
  amount: number,
  recipient?: string,
) => {
  let message = `Successfully processed ₦${amount.toLocaleString()} ${type}.`;
  if (recipient) {
    message = `Successfully sent ₦${amount.toLocaleString()} to ${recipient}.`;
  }

  return createNotification(userId, {
    type: "success",
    title: "Transaction Successful",
    message,
    category: "transaction",
    metadata: { type, amount, recipient },
  });
};

export const notifyInvestmentCreated = (
  userId: string,
  amount: number,
  type: string,
) => {
  return createNotification(userId, {
    type: "success",
    title: "Investment Created",
    message: `Successfully invested ₦${amount.toLocaleString()} in ${type.replace("_", " ")}.`,
    category: "investment",
    metadata: { amount, type },
  });
};

export const notifySecurityAlert = (
  userId: string,
  action: string,
  ipAddress?: string,
) => {
  return createNotification(userId, {
    type: "warning",
    title: "Security Alert",
    message: `${action} detected on your account. If this wasn't you, please contact support immediately.`,
    category: "security",
    metadata: { action, ipAddress },
  });
};

// API Routes
export const getUserNotifications: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const limit = parseInt(req.query.limit as string) || 20;
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
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const markNotificationRead: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { notificationId } = req.params;
    const userNotifications = notifications.get(userId) || [];

    const notification = userNotifications.find((n) => n.id === notificationId);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      } as ErrorResponse);
    }

    notification.read = true;
    notifications.set(userId, userNotifications);

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const markAllNotificationsRead: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const userNotifications = notifications.get(userId) || [];
    userNotifications.forEach((n) => (n.read = true));
    notifications.set(userId, userNotifications);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const deleteNotification: RequestHandler = (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const { notificationId } = req.params;
    const userNotifications = notifications.get(userId) || [];

    const filteredNotifications = userNotifications.filter(
      (n) => n.id !== notificationId,
    );

    if (filteredNotifications.length === userNotifications.length) {
      return res.status(404).json({
        success: false,
        error: "Notification not found",
      } as ErrorResponse);
    }

    notifications.set(userId, filteredNotifications);

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};
