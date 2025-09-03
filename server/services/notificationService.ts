import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import nodemailer from "nodemailer";
// import { sendSMS } from '../routes/otp'; // TODO: Export sendSMS from otp module

export interface NotificationData {
  userId: string;
  type:
    | "transaction"
    | "investment"
    | "kyc"
    | "security"
    | "promo"
    | "social"
    | "money_request"
    | "payment";
  title: string;
  message: string;
  data?: any;
  channels?: ("in_app" | "push" | "email" | "sms")[];
  priority?: "low" | "normal" | "high" | "urgent";
}

export class NotificationService {
  private io: SocketIOServer;
  private emailTransporter: nodemailer.Transporter;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || process.env.APP_URL || "*",
        methods: ["GET", "POST"],
      },
    });

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      // Join user to their personal room
      socket.on("join-user", (userId: string) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined their notification room`);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
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
    } catch (error) {
      console.error("Failed to send notification:", error);
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
    console.log(
      `Would send push notification to user ${notification.userId}: ${notification.title}`,
    );

    // TODO: Implement actual push notification service (FCM, APNS, etc.)
    // const deviceTokens = await this.getUserDeviceTokens(notification.userId);
    // await this.sendToDevices(deviceTokens, notification);
  }

  private async sendEmailNotification(notification: NotificationData) {
    try {
      const user = await this.getUserById(notification.userId);
      if (!user?.email) return;

      await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || "noreply@investnaija.com",
        to: user.email,
        subject: notification.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2E7D32;">${notification.title}</h2>
            <p>${notification.message}</p>
            <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This email was sent from InvestNaija. Please do not reply to this email.
            </p>
          </div>
        `,
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

  private async getUserById(userId: string) {
    // TODO: Import getUserById from storage
    return null;
  }

  // Convenience methods for common notifications
  async notifyTransaction(
    userId: string,
    amount: number,
    type: string,
    status: string,
  ) {
    await this.sendNotification({
      userId,
      type: "transaction",
      title: "Transaction Update",
      message: `Your ${type} of ₦${amount.toLocaleString()} is ${status}`,
      data: { amount, type, status },
      channels: ["in_app", "push"],
    });
  }

  async notifyInvestment(
    userId: string,
    amount: number,
    investmentType: string,
  ) {
    await this.sendNotification({
      userId,
      type: "investment",
      title: "Investment Successful",
      message: `Your investment of ₦${amount.toLocaleString()} in ${investmentType} has been processed`,
      data: { amount, investmentType },
      channels: ["in_app", "push", "email"],
    });
  }

  async notifyKYCUpdate(userId: string, status: string) {
    await this.sendNotification({
      userId,
      type: "kyc",
      title: "KYC Status Update",
      message: `Your KYC verification status has been updated to: ${status}`,
      data: { status },
      channels: ["in_app", "push", "email"],
    });
  }

  async notifySecurityAlert(
    userId: string,
    alertType: string,
    details: string,
  ) {
    await this.sendNotification({
      userId,
      type: "security",
      title: "Security Alert",
      message: `${alertType}: ${details}`,
      data: { alertType, details },
      channels: ["in_app", "push", "email", "sms"],
      priority: "high",
    });
  }

  async notifyMoneyRequest(userId: string, fromUser: string, amount: number) {
    await this.sendNotification({
      userId,
      type: "money_request",
      title: "Money Request",
      message: `${fromUser} has requested ₦${amount.toLocaleString()} from you`,
      data: { fromUser, amount },
      channels: ["in_app", "push"],
    });
  }

  async notifyPaymentReceived(
    userId: string,
    fromUser: string,
    amount: number,
    message?: string,
  ) {
    await this.sendNotification({
      userId,
      type: "payment",
      title: "Payment Received",
      message: `You received ₦${amount.toLocaleString()} from ${fromUser}${message ? `: ${message}` : ""}`,
      data: { fromUser, amount, message },
      channels: ["in_app", "push"],
    });
  }
}

export default NotificationService;
