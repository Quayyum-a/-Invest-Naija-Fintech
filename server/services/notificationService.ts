import axios from "axios";
import DatabaseManager from "../database/connection";

interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: "transaction" | "security" | "promotion" | "system" | "kyc" | "loan";
  priority: "low" | "normal" | "high" | "urgent";
  data?: any;
  channels?: ("push" | "email" | "sms" | "in_app")[];
  scheduledFor?: Date;
}

interface PushNotificationData {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationService {
  private db: DatabaseManager;
  private firebaseServerKey: string;
  private sendgridApiKey: string;
  private termiiApiKey: string;

  constructor() {
    this.db = DatabaseManager.getInstance();
    this.firebaseServerKey = process.env.FIREBASE_SERVER_KEY || "";
    this.sendgridApiKey = process.env.SENDGRID_API_KEY || "";
    this.termiiApiKey = process.env.TERMII_API_KEY || "";
  }

  // Send notification through all specified channels
  async sendNotification(payload: NotificationPayload): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // Store notification in database first
      const notificationResult = await this.db.query(
        `INSERT INTO notifications (
          user_id, title, message, type, priority, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id`,
        [
          payload.userId,
          payload.title,
          payload.message,
          payload.type,
          payload.priority,
          JSON.stringify(payload.data || {}),
        ],
      );

      const notificationId = notificationResult.rows[0].id;

      // Get user's notification preferences and device tokens
      const userResult = await this.db.query(
        `SELECT notification_preferences, device_tokens, email, phone
         FROM users WHERE id = $1`,
        [payload.userId],
      );

      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      }

      const user = userResult.rows[0];
      const preferences = user.notification_preferences || {};
      const deviceTokens = user.device_tokens || {};

      // Determine which channels to use
      const channels = payload.channels || this.getDefaultChannels(payload);
      const results: any = {};

      // Send through each channel
      for (const channel of channels) {
        if (this.shouldSendToChannel(channel, payload, preferences)) {
          try {
            switch (channel) {
              case "push":
                results.push = await this.sendPushNotification(
                  deviceTokens,
                  payload,
                );
                break;
              case "email":
                results.email = await this.sendEmailNotification(
                  user.email,
                  payload,
                );
                break;
              case "sms":
                results.sms = await this.sendSMSNotification(
                  user.phone,
                  payload,
                );
                break;
              case "in_app":
                results.in_app = { success: true, stored: true };
                break;
            }
          } catch (channelError) {
            console.error(
              `Failed to send ${channel} notification:`,
              channelError,
            );
            results[channel] = { success: false, error: channelError };
          }
        }
      }

      // Update notification status in database
      await this.updateNotificationStatus(notificationId, results);

      return {
        success: true,
        data: {
          notificationId,
          channels: results,
          userId: payload.userId,
        },
      };
    } catch (error) {
      console.error("Send notification error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to send notification",
      };
    }
  }

  // Send push notification via Firebase FCM
  private async sendPushNotification(
    deviceTokens: any,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.firebaseServerKey || !deviceTokens?.fcm_tokens?.length) {
        return { success: false, error: "No FCM tokens or server key" };
      }

      const fcmPayload = {
        registration_ids: deviceTokens.fcm_tokens,
        notification: {
          title: payload.title,
          body: payload.message,
          icon: this.getNotificationIcon(payload.type),
          badge: "/assets/badge.png",
          sound: payload.priority === "urgent" ? "urgent.wav" : "default",
          click_action: this.getClickAction(payload),
        },
        data: {
          type: payload.type,
          priority: payload.priority,
          userId: payload.userId,
          timestamp: new Date().toISOString(),
          ...payload.data,
        },
        android: {
          priority: payload.priority === "urgent" ? "high" : "normal",
          notification: {
            channel_id: payload.type,
            color: this.getNotificationColor(payload.type),
            notification_priority: payload.priority === "urgent" ? 2 : 0,
          },
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: payload.priority === "urgent" ? "urgent.wav" : "default",
              category: payload.type,
            },
          },
        },
      };

      const response = await axios.post(
        "https://fcm.googleapis.com/fcm/send",
        fcmPayload,
        {
          headers: {
            Authorization: `key=${this.firebaseServerKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: response.data.success > 0,
        data: {
          successCount: response.data.success,
          failureCount: response.data.failure,
          results: response.data.results,
        },
      };
    } catch (error) {
      console.error("FCM push notification error:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Push notification failed",
      };
    }
  }

  // Send email notification via SendGrid
  private async sendEmailNotification(
    email: string,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.sendgridApiKey || !email) {
        return { success: false, error: "No SendGrid API key or email" };
      }

      const emailPayload = {
        personalizations: [
          {
            to: [{ email }],
            subject: payload.title,
          },
        ],
        from: {
          email: "noreply@investnaija.com",
          name: "InvestNaija",
        },
        content: [
          {
            type: "text/html",
            value: this.generateEmailTemplate(payload),
          },
        ],
        categories: [payload.type],
        custom_args: {
          user_id: payload.userId,
          notification_type: payload.type,
        },
      };

      const response = await axios.post(
        "https://api.sendgrid.com/v3/mail/send",
        emailPayload,
        {
          headers: {
            Authorization: `Bearer ${this.sendgridApiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: response.status === 202,
        data: { messageId: response.headers["x-message-id"] },
      };
    } catch (error) {
      console.error("SendGrid email error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Email sending failed",
      };
    }
  }

  // Send SMS notification via Termii
  private async sendSMSNotification(
    phone: string,
    payload: NotificationPayload,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!this.termiiApiKey || !phone) {
        return { success: false, error: "No Termii API key or phone number" };
      }

      const smsPayload = {
        to: phone,
        from: "InvestNaija",
        sms: `${payload.title}\n\n${payload.message}`,
        type: "plain",
        api_key: this.termiiApiKey,
        channel: "dnd",
      };

      const response = await axios.post(
        "https://api.ng.termii.com/api/sms/send",
        smsPayload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      return {
        success: response.data.message_id !== undefined,
        data: {
          messageId: response.data.message_id,
          balance: response.data.balance,
        },
      };
    } catch (error) {
      console.error("Termii SMS error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "SMS sending failed",
      };
    }
  }

  // Get user's notifications
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const result = await this.db.query(
        `SELECT * FROM notifications 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );

      return { success: true, data: result.rows };
    } catch (error) {
      console.error("Get notifications error:", error);
      return { success: false, error: "Failed to retrieve notifications" };
    }
  }

  // Mark notification as read
  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await this.db.query(
        `UPDATE notifications 
         SET in_app_read = true, read_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [notificationId, userId],
      );

      return {
        success: result.rowCount > 0,
        error: result.rowCount === 0 ? "Notification not found" : undefined,
      };
    } catch (error) {
      console.error("Mark as read error:", error);
      return { success: false, error: "Failed to mark notification as read" };
    }
  }

  // Register device token for push notifications
  async registerDeviceToken(
    userId: string,
    platform: "ios" | "android" | "web",
    token: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current device tokens
      const userResult = await this.db.query(
        "SELECT device_tokens FROM users WHERE id = $1",
        [userId],
      );

      if (userResult.rows.length === 0) {
        return { success: false, error: "User not found" };
      }

      let deviceTokens = userResult.rows[0].device_tokens || {};

      // Initialize fcm_tokens array if it doesn't exist
      if (!deviceTokens.fcm_tokens) {
        deviceTokens.fcm_tokens = [];
      }

      // Add new token if it doesn't exist
      if (!deviceTokens.fcm_tokens.includes(token)) {
        deviceTokens.fcm_tokens.push(token);
      }

      // Store platform-specific token
      deviceTokens[`${platform}_token`] = token;
      deviceTokens.last_updated = new Date().toISOString();

      // Update in database
      await this.db.query("UPDATE users SET device_tokens = $1 WHERE id = $2", [
        JSON.stringify(deviceTokens),
        userId,
      ]);

      return { success: true };
    } catch (error) {
      console.error("Register device token error:", error);
      return { success: false, error: "Failed to register device token" };
    }
  }

  // Send transaction notifications
  async sendTransactionNotification(
    userId: string,
    transactionType: string,
    amount: number,
    description: string,
    metadata?: any,
  ): Promise<void> {
    const titles: { [key: string]: string } = {
      deposit: "Money Received",
      withdrawal: "Money Sent",
      transfer: "Transfer Completed",
      investment: "Investment Made",
      loan_disbursement: "Loan Disbursed",
      loan_repayment: "Payment Received",
      card_payment: "Card Transaction",
      bill_payment: "Bill Payment",
    };

    const title = titles[transactionType] || "Transaction Alert";
    const emoji = amount > 0 ? "💰" : "💸";

    await this.sendNotification({
      userId,
      title: `${emoji} ${title}`,
      message: `₦${amount.toLocaleString()} - ${description}`,
      type: "transaction",
      priority: amount > 1000000 ? "high" : "normal",
      data: {
        transactionType,
        amount,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
      channels: ["push", "email"],
    });
  }

  // Send security alerts
  async sendSecurityAlert(
    userId: string,
    alertType: string,
    details: any,
  ): Promise<void> {
    const alerts: { [key: string]: { title: string; message: string } } = {
      login_new_device: {
        title: "🔒 New Device Login",
        message:
          "Your account was accessed from a new device. If this wasn't you, please secure your account immediately.",
      },
      password_changed: {
        title: "🔐 Password Changed",
        message: "Your account password has been changed successfully.",
      },
      failed_login_attempts: {
        title: "⚠️ Failed Login Attempts",
        message: "Multiple failed login attempts detected on your account.",
      },
      account_locked: {
        title: "🚫 Account Locked",
        message:
          "Your account has been temporarily locked due to suspicious activity.",
      },
    };

    const alert = alerts[alertType] || {
      title: "🔔 Security Alert",
      message: "There has been security-related activity on your account.",
    };

    await this.sendNotification({
      userId,
      title: alert.title,
      message: alert.message,
      type: "security",
      priority: "urgent",
      data: { alertType, ...details },
      channels: ["push", "email", "sms"],
    });
  }

  // Bulk notification for system announcements
  async sendBulkNotification(
    userIds: string[],
    payload: Omit<NotificationPayload, "userId">,
  ): Promise<{
    success: boolean;
    results?: any[];
    error?: string;
  }> {
    try {
      const results = [];

      // Process in batches to avoid overwhelming the system
      const batchSize = 100;
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const batchPromises = batch.map((userId) =>
          this.sendNotification({ ...payload, userId }),
        );

        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);

        // Small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const successCount = results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
      ).length;

      return {
        success: true,
        results: [
          {
            total: userIds.length,
            successful: successCount,
            failed: userIds.length - successCount,
          },
        ],
      };
    } catch (error) {
      console.error("Bulk notification error:", error);
      return {
        success: false,
        error: "Failed to send bulk notifications",
      };
    }
  }

  // Helper methods

  private getDefaultChannels(payload: NotificationPayload): string[] {
    const channelMap: { [key: string]: string[] } = {
      transaction: ["push", "in_app"],
      security: ["push", "email", "sms", "in_app"],
      loan: ["push", "email", "in_app"],
      kyc: ["push", "email", "in_app"],
      promotion: ["push", "in_app"],
      system: ["push", "in_app"],
    };

    return channelMap[payload.type] || ["push", "in_app"];
  }

  private shouldSendToChannel(
    channel: string,
    payload: NotificationPayload,
    preferences: any,
  ): boolean {
    // Always send security and urgent notifications
    if (payload.type === "security" || payload.priority === "urgent") {
      return true;
    }

    // Check user preferences
    const channelPrefs = preferences[`${payload.type}_${channel}`];
    return channelPrefs !== false; // Default to true if not explicitly disabled
  }

  private getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      transaction: "/assets/icons/transaction.png",
      security: "/assets/icons/security.png",
      loan: "/assets/icons/loan.png",
      kyc: "/assets/icons/kyc.png",
      promotion: "/assets/icons/promotion.png",
      system: "/assets/icons/system.png",
    };

    return icons[type] || "/assets/icons/default.png";
  }

  private getNotificationColor(type: string): string {
    const colors: { [key: string]: string } = {
      transaction: "#10b981",
      security: "#ef4444",
      loan: "#3b82f6",
      kyc: "#f59e0b",
      promotion: "#8b5cf6",
      system: "#6b7280",
    };

    return colors[type] || "#6b7280";
  }

  private getClickAction(payload: NotificationPayload): string {
    const actions: { [key: string]: string } = {
      transaction: "/transactions",
      security: "/security",
      loan: "/loans",
      kyc: "/profile/kyc",
      promotion: "/promotions",
      system: "/dashboard",
    };

    return actions[payload.type] || "/dashboard";
  }

  private generateEmailTemplate(payload: NotificationPayload): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${payload.title}</title>
        <style>
          .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; }
          .button { background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>InvestNaija</h1>
          </div>
          <div class="content">
            <h2>${payload.title}</h2>
            <p>${payload.message}</p>
            <p><a href="https://investnaija.com${this.getClickAction(payload)}" class="button">View Details</a></p>
          </div>
          <div class="footer">
            <p>© 2024 InvestNaija. All rights reserved.</p>
            <p>This email was sent to you because you have an account with InvestNaija.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async updateNotificationStatus(
    notificationId: string,
    results: any,
  ): Promise<void> {
    try {
      await this.db.query(
        `UPDATE notifications 
         SET push_sent = $1, email_sent = $2, sms_sent = $3
         WHERE id = $4`,
        [
          results.push?.success || false,
          results.email?.success || false,
          results.sms?.success || false,
          notificationId,
        ],
      );
    } catch (error) {
      console.error("Failed to update notification status:", error);
    }
  }
}

export const notificationService = new NotificationService();
