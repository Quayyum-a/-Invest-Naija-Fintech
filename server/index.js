"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Demo route removed for production
const auth_1 = require("./middleware/auth");
const init_1 = require("./data/init");
const env_1 = require("./config/env");
const security_1 = require("./middleware/security");
const monitoring_1 = require("./middleware/monitoring");
const jsonResponse_1 = require("./middleware/jsonResponse");
const schemas_1 = require("./validation/schemas");
// Auth routes
const auth_2 = require("./routes/auth");
// Wallet routes
const wallet_1 = require("./routes/wallet");
// Services routes
const services_1 = require("./routes/services");
// Admin routes
const admin_1 = require("./routes/admin");
// Investment routes
const investments_1 = require("./routes/investments");
// KYC routes
const kyc_1 = require("./routes/kyc");
// Payment routes
const payments_1 = require("./routes/payments");
// Analytics routes
const analytics_1 = require("./routes/analytics");
// Notification routes
const notifications_1 = require("./routes/notifications");
// OTP routes
const otp_1 = require("./routes/otp");
// Round-up routes
const roundup_1 = require("./routes/roundup");
// Gamification routes
const gamification_1 = require("./routes/gamification");
// Crypto routes
const crypto_1 = require("./routes/crypto");
// Bill payment and transfer routes
const billPayments_1 = require("./routes/billPayments");
// Social routes
const social_1 = require("./routes/social");
// Database viewer routes (development only)
const database_1 = require("./routes/database");
// Debug routes (development only)
const debug_1 = require("./routes/debug");
function createServer() {
    // Log configuration on startup
    (0, env_1.logConfigStatus)();
    const app = (0, express_1.default)();
    // Security middleware (apply early)
    app.use(security_1.securityHeaders);
    app.use(security_1.deviceFingerprinting);
    app.use(security_1.geoValidation);
    app.use(security_1.fraudDetection);
    app.use(security_1.securityLogger);
    app.use(monitoring_1.requestMetrics); // Add performance monitoring
    app.use(security_1.generalRateLimit);
    // JSON response middleware for API routes
    app.use(jsonResponse_1.ensureJsonResponse);
    // Basic middleware
    app.use((0, cors_1.default)({
        origin: env_1.env.NODE_ENV === "production"
            ? ["https://investnaija.com", "https://www.investnaija.com"]
            : true,
        credentials: true,
    }));
    app.use(express_1.default.json({ limit: "10mb" }));
    app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
    app.use(security_1.validateInput);
    // Health and monitoring endpoints
    app.get("/ping", (_req, res) => {
        res.json({ message: "InvestNaija API v1.0" });
    });
    app.get("/health", monitoring_1.healthCheck);
    app.get("/ready", monitoring_1.readinessCheck);
    app.get("/live", monitoring_1.livenessCheck);
    app.get("/metrics", monitoring_1.getMetrics);
    app.post("/metrics/reset", monitoring_1.resetMetrics);
    // Production API only - demo route removed
    // Authentication routes (public)
    app.post("/auth/register", security_1.authRateLimit, (0, schemas_1.validateSchema)(schemas_1.registerSchema), auth_2.register);
    app.post("/auth/login", security_1.authRateLimit, (0, schemas_1.validateSchema)(schemas_1.loginSchema), auth_2.login);
    app.post("/auth/logout", auth_2.logout);
    app.get("/auth/me", auth_2.getCurrentUser);
    // OTP routes (public with rate limiting)
    app.post("/otp/send", security_1.otpRateLimit, security_1.validateNigerianPhone, otp_1.sendOTP);
    app.post("/otp/verify", otp_1.verifyOTP);
    app.get("/otp/status", otp_1.checkOTPStatus);
    // Protected wallet routes
    app.get("/wallet", auth_1.authenticateToken, wallet_1.getWallet);
    app.post("/wallet/deposit", auth_1.authenticateToken, security_1.transactionRateLimit, security_1.validateTransactionAmount, wallet_1.processDeposit);
    app.post("/wallet/add", auth_1.authenticateToken, security_1.transactionRateLimit, security_1.validateTransactionAmount, wallet_1.processDeposit);
    app.post("/wallet/withdraw", auth_1.authenticateToken, security_1.transactionRateLimit, security_1.validateTransactionAmount, wallet_1.withdrawMoney);
    app.post("/wallet/invest", auth_1.authenticateToken, security_1.transactionRateLimit, (0, schemas_1.validateSchema)(schemas_1.investmentSchema), wallet_1.investMoney);
    app.get("/transactions", auth_1.authenticateToken, wallet_1.getTransactions);
    app.get("/transactions/history", auth_1.authenticateToken, (0, schemas_1.validateSchema)(schemas_1.transactionHistorySchema), wallet_1.getTransactionHistory);
    // Enhanced wallet routes
    app.post("/wallet/fund", auth_1.authenticateToken, (0, schemas_1.validateSchema)(schemas_1.fundWalletSchema), wallet_1.initiateWalletFunding);
    app.get("/wallet/verify/:reference", auth_1.authenticateToken, wallet_1.verifyWalletFunding);
    app.post("/wallet/transfer", auth_1.authenticateToken, (0, schemas_1.validateSchema)(schemas_1.transferSchema), wallet_1.transferToUser);
    app.post("/wallet/withdraw", auth_1.authenticateToken, (0, schemas_1.validateSchema)(schemas_1.withdrawSchema), wallet_1.withdrawToBank);
    // Financial services routes
    app.get("/services", services_1.getServices);
    app.post("/services/airtime", auth_1.authenticateToken, security_1.transactionRateLimit, security_1.validateTransactionAmount, security_1.validateNigerianPhone, services_1.buyAirtime);
    app.post("/services/data", auth_1.authenticateToken, security_1.transactionRateLimit, security_1.validateTransactionAmount, security_1.validateNigerianPhone, services_1.buyData);
    app.post("/services/bills", auth_1.authenticateToken, security_1.transactionRateLimit, security_1.validateTransactionAmount, services_1.payBill);
    app.post("/services/transfer", auth_1.authenticateToken, security_1.transactionRateLimit, security_1.validateTransactionAmount, services_1.bankTransfer);
    app.post("/services/verify-account", auth_1.authenticateToken, services_1.verifyAccount);
    // Dashboard and portfolio data
    app.get("/dashboard", auth_1.authenticateToken, wallet_1.getDashboardData);
    app.get("/portfolio", auth_1.authenticateToken, wallet_1.getPortfolioData);
    // Investment routes (protected)
    app.get("/investments/products", investments_1.getInvestmentProducts);
    app.post("/investments/roundup", auth_1.authenticateToken, investments_1.createRoundUpInvestment);
    app.post("/investments/withdraw", auth_1.authenticateToken, investments_1.withdrawInvestment);
    app.get("/investments/performance", auth_1.authenticateToken, investments_1.getInvestmentPerformance);
    // KYC routes (protected with strict rate limiting)
    app.post("/kyc/submit", auth_1.authenticateToken, security_1.strictRateLimit, (0, schemas_1.validateSchema)(schemas_1.kycSchema), kyc_1.submitKYCDocuments);
    app.get("/kyc/status", auth_1.authenticateToken, kyc_1.getKYCStatus);
    app.post("/kyc/upload", auth_1.authenticateToken, security_1.strictRateLimit, kyc_1.uploadKYCDocument);
    // Payment routes
    app.get("/payments/banks", payments_1.getBanks);
    app.post("/payments/paystack/initiate", auth_1.authenticateToken, payments_1.initiatePaystackPayment);
    app.get("/payments/paystack/verify/:reference", auth_1.authenticateToken, payments_1.handlePaystackCallback);
    app.post("/payments/paystack/callback", payments_1.handlePaystackCallback);
    app.post("/payments/verify-account", auth_1.authenticateToken, payments_1.linkBankAccount);
    app.post("/payments/verify-bvn", auth_1.authenticateToken, payments_1.verifyBVN);
    app.post("/payments/verify-nin", auth_1.authenticateToken, payments_1.verifyNIN);
    app.post("/payments/link-bank", auth_1.authenticateToken, payments_1.linkBankAccount);
    app.post("/payments/bank-transfer", auth_1.authenticateToken, payments_1.initiateBankTransfer);
    app.post("/payments/virtual-account", auth_1.authenticateToken, payments_1.generateVirtualAccount);
    // Analytics routes (protected)
    app.get("/analytics/user", auth_1.authenticateToken, analytics_1.getUserAnalytics);
    app.get("/analytics/app", auth_1.authenticateToken, analytics_1.getAppAnalytics);
    // Notification routes (protected)
    app.get("/notifications", auth_1.authenticateToken, notifications_1.getUserNotifications);
    app.put("/notifications/:notificationId/read", auth_1.authenticateToken, notifications_1.markNotificationRead);
    app.put("/notifications/mark-all-read", auth_1.authenticateToken, notifications_1.markAllNotificationsRead);
    app.delete("/notifications/:notificationId", auth_1.authenticateToken, notifications_1.deleteNotification);
    // Round-up investment routes (protected)
    app.get("/roundup/settings", auth_1.authenticateToken, roundup_1.getRoundupSettings);
    app.put("/roundup/settings", auth_1.authenticateToken, roundup_1.updateRoundupSettings);
    app.post("/roundup/process", auth_1.authenticateToken, security_1.transactionRateLimit, roundup_1.processRoundup);
    app.get("/roundup/stats", auth_1.authenticateToken, roundup_1.getRoundupStats);
    app.post("/roundup/invest", auth_1.authenticateToken, security_1.transactionRateLimit, roundup_1.investRoundups);
    // Gamification routes (protected)
    app.get("/achievements", auth_1.authenticateToken, gamification_1.getUserAchievements);
    app.get("/leaderboard", auth_1.authenticateToken, gamification_1.getLeaderboard);
    app.get("/level", auth_1.authenticateToken, gamification_1.getUserLevel);
    app.post("/achievements/claim", auth_1.authenticateToken, gamification_1.claimReward);
    // Crypto routes
    app.get("/crypto/market", crypto_1.getCryptoMarketData);
    app.get("/crypto/holdings", auth_1.authenticateToken, crypto_1.getUserCryptoHoldings);
    app.post("/crypto/buy", auth_1.authenticateToken, security_1.transactionRateLimit, (0, schemas_1.validateSchema)(schemas_1.cryptoTradeSchema), crypto_1.buyCrypto);
    app.post("/crypto/sell", auth_1.authenticateToken, security_1.transactionRateLimit, (0, schemas_1.validateSchema)(schemas_1.cryptoTradeSchema), crypto_1.sellCrypto);
    // Bill payment routes
    app.get("/bills/billers", billPayments_1.getBillers);
    app.get("/bills/electricity/companies", billPayments_1.getElectricityCompanies);
    app.post("/bills/validate-customer", billPayments_1.validateCustomer);
    app.post("/bills/pay-electricity", auth_1.authenticateToken, security_1.transactionRateLimit, (0, schemas_1.validateSchema)(schemas_1.electricityBillSchema), billPayments_1.payElectricityBill);
    app.post("/bills/buy-airtime", auth_1.authenticateToken, security_1.transactionRateLimit, (0, schemas_1.validateSchema)(schemas_1.airtimeSchema), billPayments_1.buyAirtime);
    app.post("/bills/buy-data", auth_1.authenticateToken, security_1.transactionRateLimit, security_1.validateTransactionAmount, billPayments_1.buyDataBundle);
    app.post("/bills/pay-cable-tv", auth_1.authenticateToken, security_1.transactionRateLimit, (0, schemas_1.validateSchema)(schemas_1.cableTvSchema), billPayments_1.payCableTVBill);
    // Transfer routes
    app.get("/transfer/banks", billPayments_1.getBanksForTransfer);
    app.post("/transfer/verify-account", billPayments_1.verifyTransferAccount);
    app.post("/transfer/initiate", auth_1.authenticateToken, security_1.transactionRateLimit, security_1.validateTransactionAmount, billPayments_1.initiateTransfer);
    // Admin routes (protected with strict rate limiting)
    app.get("/admin/stats", auth_1.authenticateToken, security_1.strictRateLimit, admin_1.getAdminStats);
    app.get("/admin/users", auth_1.authenticateToken, security_1.strictRateLimit, admin_1.getAllUsersAdmin);
    app.get("/admin/users/:userId", auth_1.authenticateToken, security_1.strictRateLimit, admin_1.getUserDetails);
    app.put("/admin/users/:userId/kyc", auth_1.authenticateToken, security_1.strictRateLimit, admin_1.updateUserKYC);
    app.put("/admin/users/:userId/status", auth_1.authenticateToken, security_1.strictRateLimit, admin_1.updateUserStatus);
    // Social banking routes (protected)
    app.get("/social/groups", auth_1.authenticateToken, social_1.getSocialGroups);
    app.post("/social/groups", auth_1.authenticateToken, (0, schemas_1.validateSchema)(schemas_1.createGroupSchema), social_1.createGroup);
    app.get("/social/requests", auth_1.authenticateToken, social_1.getMoneyRequests);
    app.post("/social/requests", auth_1.authenticateToken, (0, schemas_1.validateSchema)(schemas_1.moneyRequestSchema), social_1.requestMoney);
    app.get("/social/payments", auth_1.authenticateToken, social_1.getSocialPayments);
    app.post("/social/payments", auth_1.authenticateToken, (0, schemas_1.validateSchema)(schemas_1.socialPaymentSchema), social_1.sendMoney);
    app.get("/social/challenges", auth_1.authenticateToken, social_1.getChallenges);
    // Database viewer routes (development only)
    app.get("/dev/database", database_1.viewDatabase);
    app.get("/dev/database/:tableName", database_1.getTableData);
    app.post("/dev/database/query", database_1.executeQuery);
    // Debug routes (development only)
    app.get("/debug/ping", debug_1.debugPing);
    app.get("/debug/transactions", auth_1.authenticateToken, debug_1.debugTransactions);
    // Initialize app on first startup
    try {
        (0, init_1.initializeApp)();
    }
    catch (error) {
        console.log("App already initialized or initialization skipped");
    }
    // Start monitoring services
    (0, monitoring_1.startMonitoring)();
    // Error handling middleware (must be last)
    app.use(jsonResponse_1.apiErrorHandler); // API-specific error handler
    app.use(security_1.notFoundHandler);
    app.use(security_1.errorHandler);
    return app;
}
// Commit 7 - 1752188000
// Commit 11 - 1752188001
// Commit 30 - 1752188003
// Commit 38 - 1752188004
// Commit 54 - 1752188005
// Commit 88 - 1752188008
// Commit 91 - 1752188008
// Commit 96 - 1752188008
// Commit 97 - 1752188009
// Commit 114 - 1752188009
// Commit 115 - 1752188010
// Commit 118 - 1752188010
// Commit 120 - 1752188010
// Commit 128 - 1752188011
// Commit 133 - 1752188011
// Commit 137 - 1752188012
// Commit 168 - 1752188013
// Commit 169 - 1752188013
// Commit 172 - 1752188013
// Commit 205 - 1752188016
// Commit 221 - 1752188017
// Commit 227 - 1752188018
// Commit 230 - 1752188018
// Commit 246 - 1752188019
// Commit 259 - 1752188019
// Commit 272 - 1752188020
// Commit 277 - 1752188021
// Commit 292 - 1752188022
// Commit 294 - 1752188022
// Commit 334 - 1752188025
// Commit 336 - 1752188025
// Commit 337 - 1752188025
// Commit 349 - 1752188027
// Commit 356 - 1752188028
// Commit 359 - 1752188028
// Commit 366 - 1752188029
// Commit 370 - 1752188029
// Commit 372 - 1752188029
// Commit 376 - 1752188029
// Commit 378 - 1752188029
// Commit 381 - 1752188030
// Commit 392 - 1752188031
// Commit 398 - 1752188031
// Commit 401 - 1752188032
// December commit 7 - 1752189165
// December commit 8 - 1752189165
// December commit 10 - 1752189165
// December commit 26 - 1752189168
// December commit 42 - 1752189173
// December commit 50 - 1752189176
// December commit 55 - 1752189177
// December commit 61 - 1752189179
// December commit 77 - 1752189184
// December commit 92 - 1752189188
// December commit 101 - 1752189190
// 2023 commit 8 - 1752189199
// 2023 commit 18 - 1752189200
// 2023 commit 32 - 1752189205
// 2023 commit 51 - 1752189213
// 2023 commit 63 - 1752189216
// 2023 commit 73 - 1752189220
// 2023 commit 74 - 1752189220
// 2023 commit 82 - 1752189223
// 2023 commit 96 - 1752189225
// 2023 commit 100 - 1752189225
// 2023 commit 126 - 1752189231
// 2023 commit 142 - 1752189235
// 2023 commit 168 - 1752189243
// 2023 commit 174 - 1752189244
// 2023 commit 199 - 1752189248
// 2023 commit 216 - 1752189250
// 2023 commit 218 - 1752189250
// 2023 commit 222 - 1752189251
// 2023 commit 243 - 1752189255
// 2023 commit 244 - 1752189256
// 2023 commit 252 - 1752189258
// 2023 commit 270 - 1752189259
// 2023 commit 282 - 1752189261
// 2023 commit 284 - 1752189261
// 2023 commit 290 - 1752189263
// 2023 commit 312 - 1752189266
// 2023 commit 326 - 1752189270
// 2023 commit 345 - 1752189276
// 2023 commit 348 - 1752189276
// December commit 9 - 1752189481
// December commit 33 - 1752189485
// December commit 39 - 1752189487
// December commit 56 - 1752189490
// December commit 67 - 1752189491
// December commit 84 - 1752189494
// December commit 89 - 1752189495
// December commit 99 - 1752189496
// December commit 105 - 1752189497
// December commit 126 - 1752189500
// Past year commit 2 - 1752189503
// Past year commit 9 - 1752189504
// Past year commit 30 - 1752189507
// Past year commit 37 - 1752189508
// Past year commit 55 - 1752189511
// Past year commit 63 - 1752189512
// Past year commit 76 - 1752189513
// Past year commit 88 - 1752189514
// Past year commit 104 - 1752189516
// Past year commit 107 - 1752189517
// Past year commit 112 - 1752189517
// Past year commit 114 - 1752189517
// Past year commit 118 - 1752189517
// Past year commit 128 - 1752189519
// Past year commit 134 - 1752189520
// Past year commit 137 - 1752189521
// Past year commit 139 - 1752189521
// Past year commit 149 - 1752189522
// Past year commit 160 - 1752189523
// Past year commit 175 - 1752189526
// Past year commit 197 - 1752189529
// Past year commit 208 - 1752189531
// Past year commit 209 - 1752189531
// Past year commit 213 - 1752189531
// Past year commit 240 - 1752189535
// Past year commit 244 - 1752189535
// Past year commit 274 - 1752189538
// Past year commit 277 - 1752189538
// Past year commit 294 - 1752189541
// Past year commit 316 - 1752189543
// Past year commit 348 - 1752189546
