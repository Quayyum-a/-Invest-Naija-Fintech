import { RequestHandler } from "express";
import {
  createSocialGroup,
  getUserSocialGroups,
  getGroupMembers,
  createMoneyRequest,
  getUserMoneyRequests,
  createSocialPayment,
  getUserSocialPayments,
  getFinancialChallenges,
  getChallengeParticipants,
  createNotification,
  getUserById,
  updateWallet,
  getUserWallet,
  createTransaction,
} from "../data/storage";
import { getSessionUser } from "../data/storage";
import {
  getUserByEmailOrPhone,
  validateRecipient,
  getUserDisplayName,
  canReceiveMoney,
} from "../data/userLookup";

// Get user's social groups
export const getSocialGroups: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = token ? getSessionUser(token) : null;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const groups = getUserSocialGroups(user.id);
    const groupsWithMembers = groups.map((group) => {
      const members = getGroupMembers(group.id);
      return {
        ...group,
        members: members.map((member) => ({
          id: member.userId,
          name: `${member.firstName} ${member.lastName}`,
          avatar: "", // TODO: Add avatar support
          contribution: member.contribution,
          joinedAt: member.joinedAt,
          status: member.status,
        })),
      };
    });

    res.json({
      success: true,
      groups: groupsWithMembers,
    });
  } catch (error) {
    console.error("Get social groups error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Create a new social group
export const createGroup: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = token ? getSessionUser(token) : null;

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

    const group = createSocialGroup({
      name,
      description,
      targetAmount: parseFloat(targetAmount),
      createdBy: user.id,
      endDate,
      category,
    });

    // Create notification
    createNotification({
      userId: user.id,
      title: "Group Created",
      message: `You created the group "${name}"`,
      type: "social",
    });

    res.json({
      success: true,
      group: {
        ...group,
        members: [
          {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            avatar: "",
            contribution: 0,
            joinedAt: group.createdAt,
            status: "active",
          },
        ],
      },
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get money requests
export const getMoneyRequests: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = token ? getSessionUser(token) : null;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const requests = getUserMoneyRequests(user.id);
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
  } catch (error) {
    console.error("Get money requests error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Create money request
export const requestMoney: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = token ? getSessionUser(token) : null;

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
    const recipientValidation = validateRecipient(to);

    if (!recipientValidation.valid) {
      return res.status(400).json({
        success: false,
        error: recipientValidation.error,
      });
    }

    const recipient = recipientValidation.user!;

    // Check if recipient can receive this amount
    const canReceive = canReceiveMoney(recipient, parseFloat(amount));
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

    const request = createMoneyRequest({
      fromUserId: user.id,
      toUserId: recipient.id,
      amount: parseFloat(amount),
      reason,
      dueDate,
    });

    // Create notification for recipient
    createNotification({
      userId: recipient.id,
      title: "Money Request",
      message: `${getUserDisplayName(user)} requested ₦${amount.toLocaleString()}`,
      type: "money_request",
      metadata: { requestId: request.id },
    });

    res.json({
      success: true,
      request,
    });
  } catch (error) {
    console.error("Request money error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get social payments
export const getSocialPayments: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = token ? getSessionUser(token) : null;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const payments = getUserSocialPayments(user.id);
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
  } catch (error) {
    console.error("Get social payments error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Send money
export const sendMoney: RequestHandler = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    const user = token ? getSessionUser(token) : null;

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
    const recipientValidation = validateRecipient(to);

    if (!recipientValidation.valid) {
      return res.status(400).json({
        success: false,
        error: recipientValidation.error,
      });
    }

    const recipient = recipientValidation.user!;

    // Check if recipient can receive this amount
    const canReceive = canReceiveMoney(recipient, amountNum);
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
    const fromWallet = getUserWallet(user.id);
    if (!fromWallet || fromWallet.balance < amountNum) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      });
    }

    // Get recipient's wallet
    const toWallet = getUserWallet(recipient.id);
    if (!toWallet) {
      return res.status(404).json({
        success: false,
        error: "Recipient wallet not found",
      });
    }

    // Update wallets
    updateWallet(user.id, {
      balance: fromWallet.balance - amountNum,
    });

    updateWallet(recipient.id, {
      balance: toWallet.balance + amountNum,
    });

    // Create transaction records
    createTransaction({
      userId: user.id,
      type: "transfer_out",
      amount: amountNum,
      description: `Social payment to ${getUserDisplayName(recipient)}`,
      status: "completed",
      metadata: {
        recipientId: recipient.id,
        recipientName: getUserDisplayName(recipient),
        type,
        message,
      },
    });

    createTransaction({
      userId: recipient.id,
      type: "transfer_in",
      amount: amountNum,
      description: `Social payment from ${getUserDisplayName(user)}`,
      status: "completed",
      metadata: {
        senderId: user.id,
        senderName: getUserDisplayName(user),
        type,
        message,
      },
    });

    // Create social payment record
    const payment = createSocialPayment({
      fromUserId: user.id,
      toUserId: recipient.id,
      amount: amountNum,
      message: message || `Payment from ${getUserDisplayName(user)}`,
      type: type || "payment",
      isPublic: isPublic || false,
    });

    // Create notifications
    createNotification({
      userId: user.id,
      title: "Payment Sent",
      message: `You sent ₦${amountNum.toLocaleString()} to ${to}`,
      type: "payment",
    });

    createNotification({
      userId: "demo-user-id",
      title: "Payment Received",
      message: `${user.firstName} ${user.lastName} sent you ₦${amountNum.toLocaleString()}`,
      type: "payment",
    });

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Send money error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get financial challenges
export const getChallenges: RequestHandler = async (req, res) => {
  try {
    const challenges = getFinancialChallenges();
    const challengesWithParticipants = challenges.map((challenge) => {
      const participants = getChallengeParticipants(challenge.id);
      return {
        ...challenge,
        participants: participants.map((p, index) => ({
          id: p.userId,
          name: `${p.firstName} ${p.lastName}`,
          avatar: "",
          progress: p.progress,
          rank: index + 1,
        })),
      };
    });

    res.json({
      success: true,
      challenges: challengesWithParticipants,
    });
  } catch (error) {
    console.error("Get challenges error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
