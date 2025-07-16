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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const socket_io_1 = require("socket.io");
const nodemailer_1 = __importDefault(require("nodemailer"));
class NotificationService {
    constructor(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:8080",
                methods: ["GET", "POST"],
            },
        });
        // Initialize email transporter
        this.emailTransporter = nodemailer_1.default.createTransporter({
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
    setupSocketHandlers() {
        this.io.on("connection", (socket) => {
            console.log("Client connected:", socket.id);
            // Join user to their personal room
            socket.on("join-user", (userId) => {
                socket.join(`user-${userId}`);
                console.log(`User ${userId} joined their notification room`);
            });
            socket.on("disconnect", () => {
                console.log("Client disconnected:", socket.id);
            });
        });
    }
    sendNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const channels = notification.channels || ["in_app", "push"];
                // Send in-app notification (WebSocket)
                if (channels.includes("in_app")) {
                    yield this.sendInAppNotification(notification);
                }
                // Send push notification
                if (channels.includes("push")) {
                    yield this.sendPushNotification(notification);
                }
                // Send email notification
                if (channels.includes("email")) {
                    yield this.sendEmailNotification(notification);
                }
                // Send SMS notification
                if (channels.includes("sms")) {
                    yield this.sendSMSNotification(notification);
                }
            }
            catch (error) {
                console.error("Failed to send notification:", error);
            }
        });
    }
    sendInAppNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            this.io.to(`user-${notification.userId}`).emit("notification", {
                id: Date.now().toString(),
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
                timestamp: new Date().toISOString(),
                read: false,
            });
        });
    }
    sendPushNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            // Get user's device tokens from database
            // For now, we'll implement a basic version
            console.log(`Would send push notification to user ${notification.userId}: ${notification.title}`);
            // TODO: Implement actual push notification service (FCM, APNS, etc.)
            // const deviceTokens = await this.getUserDeviceTokens(notification.userId);
            // await this.sendToDevices(deviceTokens, notification);
        });
    }
    sendEmailNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.getUserById(notification.userId);
                if (!(user === null || user === void 0 ? void 0 : user.email))
                    return;
                yield this.emailTransporter.sendMail({
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
            }
            catch (error) {
                console.error("Email notification failed:", error);
            }
        });
    }
    sendSMSNotification(notification) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.getUserById(notification.userId);
                if (!(user === null || user === void 0 ? void 0 : user.phone))
                    return;
                // TODO: Export sendSMS from otp module and uncomment
                // await sendSMS(
                //   user.phone,
                //   `${notification.title}: ${notification.message}`,
                // );
                console.log(`Would send SMS to ${user.phone}: ${notification.title}`);
            }
            catch (error) {
                console.error("SMS notification failed:", error);
            }
        });
    }
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Import getUserById from storage
            return null;
        });
    }
    // Convenience methods for common notifications
    notifyTransaction(userId, amount, type, status) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendNotification({
                userId,
                type: "transaction",
                title: "Transaction Update",
                message: `Your ${type} of ₦${amount.toLocaleString()} is ${status}`,
                data: { amount, type, status },
                channels: ["in_app", "push"],
            });
        });
    }
    notifyInvestment(userId, amount, investmentType) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendNotification({
                userId,
                type: "investment",
                title: "Investment Successful",
                message: `Your investment of ₦${amount.toLocaleString()} in ${investmentType} has been processed`,
                data: { amount, investmentType },
                channels: ["in_app", "push", "email"],
            });
        });
    }
    notifyKYCUpdate(userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendNotification({
                userId,
                type: "kyc",
                title: "KYC Status Update",
                message: `Your KYC verification status has been updated to: ${status}`,
                data: { status },
                channels: ["in_app", "push", "email"],
            });
        });
    }
    notifySecurityAlert(userId, alertType, details) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendNotification({
                userId,
                type: "security",
                title: "Security Alert",
                message: `${alertType}: ${details}`,
                data: { alertType, details },
                channels: ["in_app", "push", "email", "sms"],
                priority: "high",
            });
        });
    }
    notifyMoneyRequest(userId, fromUser, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendNotification({
                userId,
                type: "money_request",
                title: "Money Request",
                message: `${fromUser} has requested ₦${amount.toLocaleString()} from you`,
                data: { fromUser, amount },
                channels: ["in_app", "push"],
            });
        });
    }
    notifyPaymentReceived(userId, fromUser, amount, message) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendNotification({
                userId,
                type: "payment",
                title: "Payment Received",
                message: `You received ₦${amount.toLocaleString()} from ${fromUser}${message ? `: ${message}` : ""}`,
                data: { fromUser, amount, message },
                channels: ["in_app", "push"],
            });
        });
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
