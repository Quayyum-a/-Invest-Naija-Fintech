import { RequestHandler } from "express";
import { z } from "zod";
import { randomUUID } from "crypto";
import { ErrorResponse } from "@shared/api";
import {
  getUserWallet,
  updateWallet,
  createTransaction,
  getUser,
  getUserByEmail,
} from "../data/storage";
import { termiiService } from "../services/termiiService";

// Validation schemas
const createGroupSchema = z.object({
  name: z.string().min(3, "Group name must be at least 3 characters").max(50),
  description: z.string().max(200).optional(),
  target_amount: z.number().min(10000, "Minimum target amount is ₦10,000"),
  contribution_frequency: z.enum(["daily", "weekly", "monthly"], {
    errorMap: () => ({ message: "Invalid contribution frequency" }),
  }),
  contribution_amount: z.number().min(500, "Minimum contribution is ₦500"),
  max_members: z.number().min(2).max(50).default(10),
  auto_save: z.boolean().default(false),
  privacy: z.enum(["public", "private", "invite_only"]).default("private"),
});

const joinGroupSchema = z.object({
  group_id: z.string().min(1, "Group ID is required"),
  invite_code: z.string().optional(),
});

const moneyRequestSchema = z.object({
  recipient_email: z.string().email("Invalid email address"),
  amount: z.number().min(100, "Minimum request amount is ₦100").max(500000),
  reason: z.string().min(1, "Reason is required").max(100),
  due_date: z.string().optional(),
});

const respondToRequestSchema = z.object({
  request_id: z.string().min(1, "Request ID is required"),
  action: z.enum(["approve", "decline"], {
    errorMap: () => ({ message: "Action must be 'approve' or 'decline'" }),
  }),
  message: z.string().max(200).optional(),
});

const socialPaymentSchema = z.object({
  recipient_email: z.string().email("Invalid email address"),
  amount: z.number().min(100, "Minimum payment amount is ₦100").max(500000),
  message: z.string().max(200).optional(),
  occasion: z
    .enum(["birthday", "graduation", "wedding", "general", "other"])
    .default("general"),
  is_gift: z.boolean().default(false),
});

// Mock data storage (in production, use database)
const mockGroups: any[] = [];
const mockMoneyRequests: any[] = [];
const mockChallenges: any[] = [
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
export const getSocialGroups: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    // Filter groups where user is a member
    const userGroups = mockGroups.filter((group) =>
      group.members.some((member: any) => member.user_id === userId),
    );

    // Add user role and contribution status to each group
    const groupsWithStatus = userGroups.map((group) => {
      const userMembership = group.members.find(
        (member: any) => member.user_id === userId,
      );
      const totalContributed = group.contributions
        .filter((contrib: any) => contrib.user_id === userId)
        .reduce((sum: number, contrib: any) => sum + contrib.amount, 0);

      return {
        ...group,
        user_role: userMembership?.role || "member",
        user_total_contributed: totalContributed,
        user_next_contribution_due: userMembership?.next_contribution_due,
        progress_percentage: Math.min(
          (group.total_saved / group.target_amount) * 100,
          100,
        ),
      };
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
          total_saved: groupsWithStatus.reduce(
            (sum, g) => sum + g.user_total_contributed,
            0,
          ),
        },
      },
    });
  } catch (error) {
    console.error("Get social groups error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch social groups",
    } as ErrorResponse);
  }
};

// Create a new social group
export const createSocialGroup: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const validatedData = createGroupSchema.parse(req.body);
    const {
      name,
      description,
      target_amount,
      contribution_frequency,
      contribution_amount,
      max_members,
      auto_save,
      privacy,
    } = validatedData;

    // Check if user can create groups (basic validation)
    if (req.user.kycStatus !== "verified") {
      return res.status(400).json({
        success: false,
        error: "KYC verification required to create groups",
      } as ErrorResponse);
    }

    const groupId = `group_${Date.now()}_${randomUUID().slice(0, 8)}`;
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
          next_contribution_due: new Date(
            Date.now() +
              (contribution_frequency === "daily"
                ? 24 * 60 * 60 * 1000
                : contribution_frequency === "weekly"
                  ? 7 * 24 * 60 * 60 * 1000
                  : 30 * 24 * 60 * 60 * 1000),
          ).toISOString(),
        },
      ],
      contributions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    mockGroups.push(newGroup);

    // Create audit transaction
    createTransaction({
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      } as ErrorResponse);
    }

    console.error("Create social group error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create group",
    } as ErrorResponse);
  }
};

// Join a social group
export const joinSocialGroup: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const validatedData = joinGroupSchema.parse(req.body);
    const { group_id, invite_code } = validatedData;

    const group = mockGroups.find((g) => g.id === group_id);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      } as ErrorResponse);
    }

    // Check if group is full
    if (group.members.length >= group.max_members) {
      return res.status(400).json({
        success: false,
        error: "Group is full",
      } as ErrorResponse);
    }

    // Check if user is already a member
    const isAlreadyMember = group.members.some(
      (member: any) => member.user_id === userId,
    );
    if (isAlreadyMember) {
      return res.status(400).json({
        success: false,
        error: "You are already a member of this group",
      } as ErrorResponse);
    }

    // Check invite code for private groups
    if (group.privacy !== "public" && group.invite_code !== invite_code) {
      return res.status(400).json({
        success: false,
        error: "Invalid invite code",
      } as ErrorResponse);
    }

    // Add user to group
    const newMember = {
      user_id: userId,
      user_name: `${req.user.firstName} ${req.user.lastName}`,
      user_email: req.user.email,
      role: "member",
      joined_at: new Date().toISOString(),
      next_contribution_due: new Date(
        Date.now() +
          (group.contribution_frequency === "daily"
            ? 24 * 60 * 60 * 1000
            : group.contribution_frequency === "weekly"
              ? 7 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000),
      ).toISOString(),
    };

    group.members.push(newMember);
    group.updated_at = new Date().toISOString();

    // Create audit transaction
    createTransaction({
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
        await termiiService.sendSMSSafe({
          to: req.user.phone,
          message: `InvestNaija: You've successfully joined the group "${group.name}". Next contribution of ₦${group.contribution_amount.toLocaleString()} is due ${group.contribution_frequency}.`,
        });
      } catch (smsError) {
        console.error("SMS notification failed:", smsError);
      }
    }

    res.json({
      success: true,
      data: {
        group: {
          ...group,
          user_role: "member",
          user_total_contributed: 0,
        },
        member: newMember,
      },
      message: `Successfully joined "${group.name}"`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      } as ErrorResponse);
    }

    console.error("Join social group error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join group",
    } as ErrorResponse);
  }
};

// Get money requests
export const getMoneyRequests: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const status = req.query.status as string;
    const type = req.query.type as "sent" | "received";

    let requests = mockMoneyRequests.filter(
      (request) =>
        request.sender_id === userId || request.recipient_id === userId,
    );

    // Filter by type
    if (type === "sent") {
      requests = requests.filter((request) => request.sender_id === userId);
    } else if (type === "received") {
      requests = requests.filter((request) => request.recipient_id === userId);
    }

    // Filter by status
    if (status) {
      requests = requests.filter((request) => request.status === status);
    }

    // Sort by date (newest first)
    requests.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const stats = {
      total_sent: mockMoneyRequests.filter((r) => r.sender_id === userId)
        .length,
      total_received: mockMoneyRequests.filter((r) => r.recipient_id === userId)
        .length,
      pending_sent: mockMoneyRequests.filter(
        (r) => r.sender_id === userId && r.status === "pending",
      ).length,
      pending_received: mockMoneyRequests.filter(
        (r) => r.recipient_id === userId && r.status === "pending",
      ).length,
    };

    res.json({
      success: true,
      data: {
        requests,
        stats,
        total: requests.length,
      },
    });
  } catch (error) {
    console.error("Get money requests error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch money requests",
    } as ErrorResponse);
  }
};

// Send money request
export const sendMoneyRequest: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const validatedData = moneyRequestSchema.parse(req.body);
    const { recipient_email, amount, reason, due_date } = validatedData;

    // Check if requesting from self
    if (recipient_email === req.user.email) {
      return res.status(400).json({
        success: false,
        error: "Cannot request money from yourself",
      } as ErrorResponse);
    }

    // Find recipient
    const recipient = getUserByEmail(recipient_email);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: "Recipient not found",
      } as ErrorResponse);
    }

    const requestId = `request_${Date.now()}_${randomUUID().slice(0, 8)}`;

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
    createTransaction({
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
        await termiiService.sendSMSSafe({
          to: recipient.phone,
          message: `InvestNaija: ${req.user.firstName} ${req.user.lastName} has requested ₦${amount.toLocaleString()} from you. Reason: ${reason}. Check your app to respond.`,
        });
      } catch (smsError) {
        console.error("SMS notification failed:", smsError);
      }
    }

    res.json({
      success: true,
      data: moneyRequest,
      message: `Money request sent to ${recipient.firstName} ${recipient.lastName}`,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      } as ErrorResponse);
    }

    console.error("Send money request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send money request",
    } as ErrorResponse);
  }
};

// Respond to money request
export const respondToMoneyRequest: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const validatedData = respondToRequestSchema.parse(req.body);
    const { request_id, action, message } = validatedData;

    const request = mockMoneyRequests.find((r) => r.id === request_id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: "Money request not found",
      } as ErrorResponse);
    }

    // Check if user is the recipient
    if (request.recipient_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "You can only respond to requests sent to you",
      } as ErrorResponse);
    }

    // Check if request is still pending
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "This request has already been processed",
      } as ErrorResponse);
    }

    if (action === "approve") {
      // Check wallet balance
      const wallet = getUserWallet(userId);
      if (!wallet || wallet.balance < request.amount) {
        return res.status(400).json({
          success: false,
          error: "Insufficient wallet balance",
        } as ErrorResponse);
      }

      // Process the payment (similar to P2P transfer)
      const reference = `money_request_${Date.now()}_${userId.slice(0, 8)}`;

      // Get recipient wallet
      const recipientWallet = getUserWallet(request.sender_id);
      if (!recipientWallet) {
        return res.status(404).json({
          success: false,
          error: "Recipient wallet not found",
        } as ErrorResponse);
      }

      // Create transactions
      const senderTransaction = createTransaction({
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

      createTransaction({
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
      const updatedSenderWallet = updateWallet(userId, {
        balance: wallet.balance - request.amount,
      });

      updateWallet(request.sender_id, {
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
          await termiiService.sendSMSSafe({
            to: req.user.phone,
            message: `InvestNaija: ₦${request.amount.toLocaleString()} sent to ${request.sender_name}. Balance: ₦${updatedSenderWallet.balance.toLocaleString()}`,
          });
        } catch (smsError) {
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
    } else {
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      } as ErrorResponse);
    }

    console.error("Respond to money request error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process request response",
    } as ErrorResponse);
  }
};

// Send social payment (gift)
export const sendSocialPayment: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId || !req.user) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const validatedData = socialPaymentSchema.parse(req.body);
    const { recipient_email, amount, message, occasion, is_gift } =
      validatedData;

    // Check if sending to self
    if (recipient_email === req.user.email) {
      return res.status(400).json({
        success: false,
        error: "Cannot send payment to yourself",
      } as ErrorResponse);
    }

    // Find recipient
    const recipient = getUserByEmail(recipient_email);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        error: "Recipient not found",
      } as ErrorResponse);
    }

    // Get sender wallet
    const wallet = getUserWallet(userId);
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient wallet balance",
      } as ErrorResponse);
    }

    // Get recipient wallet
    const recipientWallet = getUserWallet(recipient.id);
    if (!recipientWallet) {
      return res.status(404).json({
        success: false,
        error: "Recipient wallet not found",
      } as ErrorResponse);
    }

    const reference = `social_payment_${Date.now()}_${userId.slice(0, 8)}`;

    // Create transactions
    const senderTransaction = createTransaction({
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

    createTransaction({
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
    const updatedSenderWallet = updateWallet(userId, {
      balance: wallet.balance - amount,
    });

    updateWallet(recipient.id, {
      balance: recipientWallet.balance + amount,
    });

    // Send SMS notifications
    if (req.user.phone) {
      try {
        await termiiService.sendSMSSafe({
          to: req.user.phone,
          message: `InvestNaija: ₦${amount.toLocaleString()} ${is_gift ? "gift" : "payment"} sent to ${recipient.firstName} ${recipient.lastName}. Balance: ₦${updatedSenderWallet.balance.toLocaleString()}`,
        });
      } catch (smsError) {
        console.error("SMS notification failed:", smsError);
      }
    }

    if (recipient.phone) {
      try {
        const messageText = message ? ` Message: "${message}"` : "";
        await termiiService.sendSMSSafe({
          to: recipient.phone,
          message: `InvestNaija: You received a ₦${amount.toLocaleString()} ${is_gift ? "gift" : "payment"} from ${req.user.firstName} ${req.user.lastName}${messageText}`,
        });
      } catch (smsError) {
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
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors[0].message,
      } as ErrorResponse);
    }

    console.error("Send social payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to send payment",
    } as ErrorResponse);
  }
};

// Get financial challenges
export const getFinancialChallenges: RequestHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      } as ErrorResponse);
    }

    const status = req.query.status as string;

    let challenges = [...mockChallenges];

    // Filter by status
    if (status) {
      challenges = challenges.filter(
        (challenge) => challenge.status === status,
      );
    }

    // Add user participation status
    const challengesWithUserStatus = challenges.map((challenge) => ({
      ...challenge,
      user_participating: false, // In real implementation, check from database
      user_progress: 0,
      user_rank: null,
    }));

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
  } catch (error) {
    console.error("Get financial challenges error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch financial challenges",
    } as ErrorResponse);
  }
};
