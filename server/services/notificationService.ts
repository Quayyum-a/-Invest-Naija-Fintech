// import { Server as SocketIOServer } from 'socket.io'; // TODO: Install socket.io when needed
import { Server as HTTPServer } from "http";
import nodemailer from "nodemailer";
// import { sendSMS } from '../routes/otp'; // TODO: Export sendSMS from otp module

export interface NotificationData {
  userId: string;
  type: "transaction" | "investment" | "kyc" | "security" | "promo";
  title: string;
  message: string;
  data?: any;
  priority?: "low" | "medium" | "high";
  channels?: ("push" | "email" | "sms" | "in_app")[];
}

export class NotificationService {
  // private io: SocketIOServer; // TODO: Enable when socket.io is installed
  private emailTransporter: nodemailer.Transporter;

  constructor(server: HTTPServer) {
    // TODO: Enable socket.io when package is installed
    // this.io = new SocketIOServer(server, {
    //   cors: {
    //     origin: process.env.FRONTEND_URL || "http://localhost:5173",
    //     methods: ["GET", "POST"],
    //   },
    // });

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    // TODO: Enable when socket.io is installed
    // this.io.on("connection", (socket) => {
    //   console.log("Client connected:", socket.id);
    //   // Join user to their personal room
    //   socket.on("join-user", (userId: string) => {
    //     socket.join(`user-${userId}`);
    //     console.log(`User ${userId} joined their notification room`);
    //   });
    //   socket.on("disconnect", () => {
    //     console.log("Client disconnected:", socket.id);
    //   });
    // });
  }

  async sendNotification(notification: NotificationData) {
    try {
      const channels = notification.channels || ["in_app", "push"];

      // Send in-app notification (WebSocket)
      if (channels.includes("in_app")) {
        await this.sendInAppNotification(notification);
      }

      // Send push notification
      if (channels.includes("push")) {
        await this.sendPushNotification(notification);
      }

      // Send email notification
      if (channels.includes("email")) {
        await this.sendEmailNotification(notification);
      }

      // Send SMS notification
      if (channels.includes("sms")) {
        await this.sendSMSNotification(notification);
      }

      console.log(
        `Notification sent to user ${notification.userId}: ${notification.title}`,
      );
      return true;
    } catch (error) {
      console.error("Failed to send notification:", error);
      return false;
    }
  }

  private async sendInAppNotification(notification: NotificationData) {
    this.io.to(`user-${notification.userId}`).emit("notification", {
      id: Date.now().toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: new Date().toISOString(),
      read: false,
    });
  }

  private async sendPushNotification(notification: NotificationData) {
    // Get user's device tokens from database
    // For now, we'll implement a basic version
    const deviceTokens = await this.getUserDeviceTokens(notification.userId);

    if (deviceTokens.length > 0) {
      // Send to Firebase Cloud Messaging or similar
      console.log(`Push notification sent to ${deviceTokens.length} devices`);
    }
  }

  private async sendEmailNotification(notification: NotificationData) {
    try {
      const user = await this.getUserById(notification.userId);
      if (!user?.email) return;

      const emailTemplate = this.getEmailTemplate(notification);

      await this.emailTransporter.sendMail({
        from: `"InvestNaija" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: notification.title,
        html: emailTemplate,
      });
    } catch (error) {
      console.error("Email notification failed:", error);
    }
  }

  private async sendSMSNotification(notification: NotificationData) {
    try {
      const user = await this.getUserById(notification.userId);
      if (!user?.phone) return;

      // TODO: Export sendSMS from otp module and uncomment
      // await sendSMS(
      //   user.phone,
      //   `${notification.title}: ${notification.message}`,
      // );
      console.log(`Would send SMS to ${user.phone}: ${notification.title}`);
    } catch (error) {
      console.error("SMS notification failed:", error);
    }
  }

  private getEmailTemplate(notification: NotificationData): string {
    const baseTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>InvestNaija Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>InvestNaija</h1>
            </div>
            <div class="content">
              <h2>${notification.title}</h2>
              <p>${notification.message}</p>
              <a href="${process.env.FRONTEND_URL}/dashboard" class="button">View Dashboard</a>
            </div>
            <div class="footer">
              <p>This is an automated message from InvestNaija. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return baseTemplate;
  }

  // Helper methods (implement with your database)
  private async getUserById(userId: string) {
    // Implement with your database
    return null;
  }

  private async getUserDeviceTokens(userId: string): Promise<string[]> {
    // Implement with your database
    return [];
  }

  // Predefined notification templates
  async sendTransactionNotification(userId: string, transaction: any) {
    const notification: NotificationData = {
      userId,
      type: "transaction",
      title: "Transaction Completed",
      message: `Your ${transaction.type} of ₦${transaction.amount.toLocaleString()} has been processed successfully.`,
      data: { transactionId: transaction.id },
      channels: ["in_app", "push", "email"],
    };

    return this.sendNotification(notification);
  }

  async sendInvestmentNotification(userId: string, investment: any) {
    const notification: NotificationData = {
      userId,
      type: "investment",
      title: "Investment Update",
      message: `Your investment in ${investment.type} has earned ₦${investment.returns.toLocaleString()} in returns.`,
      data: { investmentId: investment.id },
      channels: ["in_app", "push", "email"],
    };

    return this.sendNotification(notification);
  }

  async sendKYCNotification(userId: string, status: string) {
    const notification: NotificationData = {
      userId,
      type: "kyc",
      title: "KYC Status Update",
      message: `Your KYC verification has been ${status}. ${status === "verified" ? "You can now access all features." : "Please check and resubmit your documents."}`,
      data: { kycStatus: status },
      channels: ["in_app", "email"],
    };

    return this.sendNotification(notification);
  }

  async sendSecurityNotification(userId: string, event: string) {
    const notification: NotificationData = {
      userId,
      type: "security",
      title: "Security Alert",
      message: `We detected ${event} on your account. If this wasn't you, please contact support immediately.`,
      data: { securityEvent: event },
      channels: ["in_app", "push", "email", "sms"],
      priority: "high",
    };

    return this.sendNotification(notification);
  }
}

export default NotificationService;
