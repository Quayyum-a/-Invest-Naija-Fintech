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
exports.webSocketService = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const storage_1 = require("../data/storage");
class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketIds
    }
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: env_1.env.NODE_ENV === "production"
                    ? ["https://investnaija.com", "https://www.investnaija.com"]
                    : "*",
                methods: ["GET", "POST"],
                credentials: true,
            },
            transports: ["websocket", "polling"],
        });
        // Authentication middleware
        this.io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
                if (!token) {
                    return next(new Error("No authentication token provided"));
                }
                const decoded = jsonwebtoken_1.default.verify(token.replace("Bearer ", ""), env_1.env.JWT_SECRET);
                const user = (0, storage_1.getUser)({ id: decoded.userId });
                if (!user) {
                    return next(new Error("User not found"));
                }
                socket.userId = user.id;
                socket.user = user;
                next();
            }
            catch (error) {
                console.error("WebSocket authentication error:", error);
                next(new Error("Authentication failed"));
            }
        }));
        this.io.on("connection", (socket) => {
            this.handleConnection(socket);
        });
        console.log("✅ WebSocket service initialized");
    }
    handleConnection(socket) {
        const userId = socket.userId;
        const socketId = socket.id;
        console.log(`📱 User ${userId} connected via WebSocket: ${socketId}`);
        // Track user connection
        if (!this.connectedUsers.has(userId)) {
            this.connectedUsers.set(userId, []);
        }
        this.connectedUsers.get(userId).push(socketId);
        // Join user to their personal room
        socket.join(`user:${userId}`);
        // Send connection confirmation
        socket.emit("connection:confirmed", {
            status: "connected",
            userId,
            timestamp: new Date().toISOString(),
        });
        // Handle wallet subscription
        socket.on("wallet:subscribe", () => {
            socket.join(`wallet:${userId}`);
            socket.emit("wallet:subscribed", {
                message: "Subscribed to wallet updates",
            });
        });
        // Handle transaction subscription
        socket.on("transactions:subscribe", () => {
            socket.join(`transactions:${userId}`);
            socket.emit("transactions:subscribed", {
                message: "Subscribed to transaction updates",
            });
        });
        // Handle crypto price subscription
        socket.on("crypto:subscribe", (data) => {
            if (data.cryptoIds && Array.isArray(data.cryptoIds)) {
                data.cryptoIds.forEach((cryptoId) => {
                    socket.join(`crypto:${cryptoId}`);
                });
                socket.emit("crypto:subscribed", {
                    cryptoIds: data.cryptoIds,
                    message: "Subscribed to crypto price updates",
                });
            }
        });
        // Handle group subscription
        socket.on("groups:subscribe", (data) => {
            if (data.groupIds && Array.isArray(data.groupIds)) {
                data.groupIds.forEach((groupId) => {
                    socket.join(`group:${groupId}`);
                });
                socket.emit("groups:subscribed", {
                    groupIds: data.groupIds,
                    message: "Subscribed to group updates",
                });
            }
        });
        // Handle typing indicators for chat
        socket.on("typing:start", (data) => {
            if (data.groupId) {
                socket.to(`group:${data.groupId}`).emit("typing:user_started", {
                    userId,
                    userName: `${socket.user.firstName} ${socket.user.lastName}`,
                    groupId: data.groupId,
                });
            }
        });
        socket.on("typing:stop", (data) => {
            if (data.groupId) {
                socket.to(`group:${data.groupId}`).emit("typing:user_stopped", {
                    userId,
                    groupId: data.groupId,
                });
            }
        });
        // Handle disconnection
        socket.on("disconnect", (reason) => {
            console.log(`📱 User ${userId} disconnected: ${reason}`);
            this.handleDisconnection(userId, socketId);
        });
        // Handle errors
        socket.on("error", (error) => {
            console.error(`WebSocket error for user ${userId}:`, error);
        });
    }
    handleDisconnection(userId, socketId) {
        const userSockets = this.connectedUsers.get(userId);
        if (userSockets) {
            const index = userSockets.indexOf(socketId);
            if (index > -1) {
                userSockets.splice(index, 1);
            }
            if (userSockets.length === 0) {
                this.connectedUsers.delete(userId);
                console.log(`📱 User ${userId} fully disconnected`);
            }
        }
    }
    // Public methods for sending real-time updates
    // Wallet updates
    notifyWalletUpdate(userId, walletData) {
        if (!this.io)
            return;
        this.io.to(`wallet:${userId}`).emit("wallet:updated", {
            type: "wallet_update",
            data: walletData,
            timestamp: new Date().toISOString(),
        });
    }
    // Transaction updates
    notifyTransactionUpdate(userId, transaction) {
        if (!this.io)
            return;
        this.io.to(`transactions:${userId}`).emit("transaction:new", {
            type: "transaction_update",
            data: transaction,
            timestamp: new Date().toISOString(),
        });
    }
    notifyTransactionStatusUpdate(userId, transactionId, status) {
        if (!this.io)
            return;
        this.io.to(`transactions:${userId}`).emit("transaction:status_updated", {
            type: "transaction_status_update",
            data: {
                transactionId,
                status,
            },
            timestamp: new Date().toISOString(),
        });
    }
    // Payment notifications
    notifyPaymentReceived(userId, paymentData) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit("payment:received", {
            type: "payment_received",
            data: paymentData,
            timestamp: new Date().toISOString(),
        });
    }
    // Money request notifications
    notifyMoneyRequest(userId, requestData) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit("money_request:received", {
            type: "money_request_received",
            data: requestData,
            timestamp: new Date().toISOString(),
        });
    }
    notifyMoneyRequestResponse(userId, responseData) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit("money_request:responded", {
            type: "money_request_responded",
            data: responseData,
            timestamp: new Date().toISOString(),
        });
    }
    // Group notifications
    notifyGroupUpdate(groupId, updateData) {
        if (!this.io)
            return;
        this.io.to(`group:${groupId}`).emit("group:updated", {
            type: "group_update",
            data: updateData,
            timestamp: new Date().toISOString(),
        });
    }
    notifyGroupContribution(groupId, contributionData) {
        if (!this.io)
            return;
        this.io.to(`group:${groupId}`).emit("group:contribution_made", {
            type: "group_contribution",
            data: contributionData,
            timestamp: new Date().toISOString(),
        });
    }
    notifyGroupMemberJoined(groupId, memberData) {
        if (!this.io)
            return;
        this.io.to(`group:${groupId}`).emit("group:member_joined", {
            type: "group_member_joined",
            data: memberData,
            timestamp: new Date().toISOString(),
        });
    }
    // Crypto price updates
    notifyCryptoPriceUpdate(cryptoId, priceData) {
        if (!this.io)
            return;
        this.io.to(`crypto:${cryptoId}`).emit("crypto:price_updated", {
            type: "crypto_price_update",
            data: Object.assign({ cryptoId }, priceData),
            timestamp: new Date().toISOString(),
        });
    }
    // Price alerts
    notifyPriceAlert(userId, alertData) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit("price_alert:triggered", {
            type: "price_alert",
            data: alertData,
            timestamp: new Date().toISOString(),
        });
    }
    // Bill payment notifications
    notifyBillPaymentSuccess(userId, billData) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit("bill_payment:success", {
            type: "bill_payment_success",
            data: billData,
            timestamp: new Date().toISOString(),
        });
    }
    // KYC status updates
    notifyKYCStatusUpdate(userId, kycData) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit("kyc:status_updated", {
            type: "kyc_status_update",
            data: kycData,
            timestamp: new Date().toISOString(),
        });
    }
    // Investment updates
    notifyInvestmentUpdate(userId, investmentData) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit("investment:updated", {
            type: "investment_update",
            data: investmentData,
            timestamp: new Date().toISOString(),
        });
    }
    // System notifications
    broadcastSystemNotification(notification) {
        if (!this.io)
            return;
        this.io.emit("system:notification", {
            type: "system_notification",
            data: notification,
            timestamp: new Date().toISOString(),
        });
    }
    // Maintenance notifications
    broadcastMaintenanceNotification(maintenanceData) {
        if (!this.io)
            return;
        this.io.emit("system:maintenance", {
            type: "maintenance_notification",
            data: maintenanceData,
            timestamp: new Date().toISOString(),
        });
    }
    // Get connected users count
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    // Get user connection status
    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }
    // Send direct message to user
    sendDirectMessage(userId, message) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit("direct:message", {
            type: "direct_message",
            data: message,
            timestamp: new Date().toISOString(),
        });
    }
    // Emergency notifications (security alerts, etc.)
    sendEmergencyNotification(userId, alertData) {
        if (!this.io)
            return;
        this.io.to(`user:${userId}`).emit("emergency:alert", {
            type: "emergency_alert",
            data: alertData,
            timestamp: new Date().toISOString(),
            priority: "high",
        });
    }
    // Get service status
    getStatus() {
        var _a;
        return {
            initialized: !!this.io,
            connectedUsers: this.getConnectedUsersCount(),
            totalSockets: ((_a = this.io) === null || _a === void 0 ? void 0 : _a.engine.clientsCount) || 0,
        };
    }
}
exports.webSocketService = new WebSocketService();
exports.default = WebSocketService;
