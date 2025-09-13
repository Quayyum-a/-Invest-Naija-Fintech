import express from "express";
import cors from "cors";
// Demo route removed for production
import { authenticateToken } from "./middleware/auth";
import { env, logConfigStatus } from "./config/env";
import {
  generalRateLimit,
  authRateLimit,
  otpRateLimit,
  transactionRateLimit,
  strictRateLimit,
  securityHeaders,
  requestLogger,
  validateInput,
  validateTransactionAmount,
  validateNigerianPhone,
  validateEmail,
  validatePassword,
  errorHandler,
  notFoundHandler,
  fraudDetection,
  geoValidation,
  deviceFingerprinting,
  securityLogger,
} from "./middleware/security";
import {
  requestMetrics,
  healthCheck,
  getMetrics,
  resetMetrics,
  readinessCheck,
  livenessCheck,
  startMonitoring,
} from "./middleware/monitoring";
import {
  registerSchema,
  loginSchema,
  fundWalletSchema,
  transferSchema,
  withdrawSchema,
  transactionHistorySchema,
  investmentSchema,
  airtimeSchema,
  electricityBillSchema,
  cableTvSchema,
  kycSchema,
  createGroupSchema,
  moneyRequestSchema,
  socialPaymentSchema,
  cryptoTradeSchema,
  businessAccountSchema,
  bulkPaymentSchema,
  validateSchema,
} from "./validation/schemas";

// Auth routes
import { register, login, logout, getCurrentUser } from "./routes/auth";

// Wallet routes
import {
  getWallet,
  processDeposit,
  withdrawMoney,
  investMoney,
  getTransactions,
  getDashboardData,
  getPortfolioData,
  initiateWalletFunding,
  verifyWalletFunding,
  transferToUser,
  withdrawToBank,
  getTransactionHistory,
} from "./routes/wallet";

// Services routes
import {
  getServices,
  buyAirtime as buyAirtimeService,
  buyData,
  payBill,
  bankTransfer,
  verifyAccount,
} from "./routes/services";

// Admin routes
import {
  getAdminStats,
  getAllUsersAdmin,
  updateUserKYC,
  updateUserStatus,
  getUserDetails,
} from "./routes/admin";

// Investment routes
import {
  getInvestmentProducts,
  createRoundUpInvestment,
  withdrawInvestment,
  getInvestmentPerformance,
} from "./routes/investments";

// KYC routes
import {
  submitKYCDocuments,
  getKYCStatus,
  uploadKYCDocument,
} from "./routes/kyc";

// Payment routes
import {
  getBanks,
  initiatePaystackPayment,
  handlePaystackCallback,
  linkBankAccount,
  initiateBankTransfer,
  generateVirtualAccount,
  verifyBVN,
  verifyNIN,
} from "./routes/payments";

// Analytics routes
import { getUserAnalytics, getAppAnalytics } from "./routes/analytics";

// Notification routes
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "./routes/notifications";

// OTP routes
import { sendOTP, verifyOTP, checkOTPStatus } from "./routes/otp";

// Round-up routes
import {
  getRoundupSettings,
  updateRoundupSettings,
  processRoundup,
  getRoundupStats,
  investRoundups,
} from "./routes/roundup";

// Gamification routes
import {
  getUserAchievements,
  getLeaderboard,
  getUserLevel,
  claimReward,
} from "./routes/gamification";

// Crypto routes
import {
  getCryptoMarketData,
  getUserCryptoHoldings,
  buyCrypto,
  sellCrypto,
} from "./routes/crypto";

// Bill payment and transfer routes
import {
  getBillers,
  getElectricityCompanies,
  validateCustomer,
  payElectricityBill,
  buyAirtime,
  buyDataBundle,
  payCableTVBill,
  initiateTransfer,
  getBanksForTransfer,
  verifyTransferAccount,
} from "./routes/billPayments";

// Social routes
import {
  getSocialGroups,
  createGroup,
  getMoneyRequests,
  requestMoney,
  getSocialPayments,
  sendMoney,
  getChallenges,
} from "./routes/social";

// Database viewer routes removed for MVP to simplify dependencies


export function createServer() {
  // Log configuration on startup
  logConfigStatus();

  const app = express();

  // Security middleware (apply early)
  app.use(securityHeaders);
  app.use(deviceFingerprinting);
  app.use(geoValidation);
  app.use(fraudDetection);
  app.use(securityLogger);
  app.use(requestMetrics); // Add performance monitoring
  app.use(generalRateLimit);

  // Basic middleware
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins
        if (env.NODE_ENV !== "production") {
          return callback(null, true);
        }
        
        // In production, check allowed origins
        const allowedOrigins = [
          "https://investnaij.netlify.app",
          "https://www.investnaij.netlify.app",
          env.CORS_ORIGIN
        ].filter(Boolean);

        // Allow any vercel.app or netlify.app subdomain, or if origin is in allowed list
        if (origin.includes('.vercel.app') || origin.includes('.netlify.app') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(validateInput);

  // Health and monitoring endpoints
  app.get("/ping", (_req, res) => {
    res.json({ message: "InvestNaija API v1.0" });
  });
  app.get("/health", healthCheck);
  app.get("/ready", readinessCheck);
  app.get("/live", livenessCheck);
  app.get("/metrics", getMetrics);
  app.post("/metrics/reset", resetMetrics);

  // Production API only - demo route removed

  // Authentication routes (public)
  app.post(
    "/auth/register",
    authRateLimit,
    validateSchema(registerSchema),
    register,
  );
  app.post("/auth/login", authRateLimit, validateSchema(loginSchema), login);
  app.post("/auth/logout", logout);
  app.get("/auth/me", authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
  });

  // OTP routes (public with rate limiting)
  app.post("/otp/send", otpRateLimit, validateNigerianPhone, sendOTP);
  app.post("/otp/verify", verifyOTP);
  app.get("/otp/status", checkOTPStatus);

  // Protected wallet routes
  app.get("/wallet", authenticateToken, getWallet);
  app.post(
    "/wallet/deposit",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    processDeposit,
  );
  app.post(
    "/wallet/add",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    processDeposit,
  );
  app.post(
    "/wallet/withdraw",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    withdrawMoney,
  );
  app.post(
    "/wallet/invest",
    authenticateToken,
    transactionRateLimit,
    validateSchema(investmentSchema),
    investMoney,
  );
  app.get("/transactions", authenticateToken, getTransactions);
  app.get(
    "/transactions/history",
    authenticateToken,
    validateSchema(transactionHistorySchema),
    getTransactionHistory,
  );

  // Enhanced wallet routes
  app.post(
    "/wallet/fund",
    authenticateToken,
    validateSchema(fundWalletSchema),
    initiateWalletFunding,
  );
  app.get("/wallet/verify/:reference", authenticateToken, verifyWalletFunding);
  app.post(
    "/wallet/transfer",
    authenticateToken,
    validateSchema(transferSchema),
    transferToUser,
  );
  app.post(
    "/wallet/withdraw",
    authenticateToken,
    validateSchema(withdrawSchema),
    withdrawToBank,
  );

  // Financial services routes
  app.get("/services", getServices);
  app.post(
    "/services/airtime",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    validateNigerianPhone,
    buyAirtimeService,
  );
  app.post(
    "/services/data",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    validateNigerianPhone,
    buyData,
  );
  app.post(
    "/services/bills",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    payBill,
  );
  app.post(
    "/services/transfer",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    bankTransfer,
  );
  app.post("/services/verify-account", authenticateToken, verifyAccount);

  // Dashboard and portfolio data
  app.get("/dashboard", authenticateToken, getDashboardData);
  app.get("/portfolio", authenticateToken, getPortfolioData);

  // Investment routes (protected)
  app.get("/investments/products", getInvestmentProducts);
  app.post("/investments/roundup", authenticateToken, createRoundUpInvestment);
  app.post("/investments/withdraw", authenticateToken, withdrawInvestment);
  app.get(
    "/investments/performance",
    authenticateToken,
    getInvestmentPerformance,
  );

  // KYC routes (protected with strict rate limiting)
  app.post(
    "/kyc/submit",
    authenticateToken,
    strictRateLimit,
    validateSchema(kycSchema),
    submitKYCDocuments,
  );
  app.get("/kyc/status", authenticateToken, getKYCStatus);
  app.post(
    "/kyc/upload",
    authenticateToken,
    strictRateLimit,
    uploadKYCDocument,
  );

  // Payment routes
  app.get("/payments/banks", getBanks);
  app.post(
    "/payments/paystack/initiate",
    authenticateToken,
    initiatePaystackPayment,
  );
  app.get(
    "/payments/paystack/verify/:reference",
    authenticateToken,
    handlePaystackCallback,
  );
  app.post("/payments/paystack/callback", handlePaystackCallback);
  app.post("/payments/verify-account", authenticateToken, linkBankAccount);
  app.post("/payments/verify-bvn", authenticateToken, verifyBVN);
  app.post("/payments/verify-nin", authenticateToken, verifyNIN);
  app.post("/payments/link-bank", authenticateToken, linkBankAccount);
  app.post("/payments/bank-transfer", authenticateToken, initiateBankTransfer);
  app.post(
    "/payments/virtual-account",
    authenticateToken,
    generateVirtualAccount,
  );

  // Analytics routes (protected)
  app.get("/analytics/user", authenticateToken, getUserAnalytics);
  app.get("/analytics/app", authenticateToken, getAppAnalytics);

  // Notification routes (protected)
  app.get("/notifications", authenticateToken, getUserNotifications);
  app.put(
    "/notifications/:notificationId/read",
    authenticateToken,
    markNotificationRead,
  );
  app.put(
    "/notifications/mark-all-read",
    authenticateToken,
    markAllNotificationsRead,
  );
  app.delete(
    "/notifications/:notificationId",
    authenticateToken,
    deleteNotification,
  );

  // Round-up investment routes (protected)
  app.get("/roundup/settings", authenticateToken, getRoundupSettings);
  app.put("/roundup/settings", authenticateToken, updateRoundupSettings);
  app.post(
    "/roundup/process",
    authenticateToken,
    transactionRateLimit,
    processRoundup,
  );
  app.get("/roundup/stats", authenticateToken, getRoundupStats);
  app.post(
    "/roundup/invest",
    authenticateToken,
    transactionRateLimit,
    investRoundups,
  );

  // Gamification routes (protected)
  app.get("/achievements", authenticateToken, getUserAchievements);
  app.get("/leaderboard", authenticateToken, getLeaderboard);
  app.get("/level", authenticateToken, getUserLevel);
  app.post("/achievements/claim", authenticateToken, claimReward);

  // Crypto routes
  app.get("/crypto/market", getCryptoMarketData);
  app.get("/crypto/holdings", authenticateToken, getUserCryptoHoldings);
  app.post(
    "/crypto/buy",
    authenticateToken,
    transactionRateLimit,
    validateSchema(cryptoTradeSchema),
    buyCrypto,
  );
  app.post(
    "/crypto/sell",
    authenticateToken,
    transactionRateLimit,
    validateSchema(cryptoTradeSchema),
    sellCrypto,
  );

  // Bill payment routes
  app.get("/bills/billers", getBillers);
  app.get("/bills/electricity/companies", getElectricityCompanies);
  app.post("/bills/validate-customer", validateCustomer);
  app.post(
    "/bills/pay-electricity",
    authenticateToken,
    transactionRateLimit,
    validateSchema(electricityBillSchema),
    payElectricityBill,
  );
  app.post(
    "/bills/buy-airtime",
    authenticateToken,
    transactionRateLimit,
    validateSchema(airtimeSchema),
    buyAirtime,
  );
  app.post(
    "/bills/buy-data",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    buyDataBundle,
  );
  app.post(
    "/bills/pay-cable-tv",
    authenticateToken,
    transactionRateLimit,
    validateSchema(cableTvSchema),
    payCableTVBill,
  );

  // Transfer routes
  app.get("/transfer/banks", getBanksForTransfer);
  app.post("/transfer/verify-account", verifyTransferAccount);
  app.post(
    "/transfer/initiate",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    initiateTransfer,
  );

  // Admin routes (protected with strict rate limiting)
  app.get("/admin/stats", authenticateToken, strictRateLimit, getAdminStats);
  app.get("/admin/users", authenticateToken, strictRateLimit, getAllUsersAdmin);
  app.get(
    "/admin/users/:userId",
    authenticateToken,
    strictRateLimit,
    getUserDetails,
  );
  app.put(
    "/admin/users/:userId/kyc",
    authenticateToken,
    strictRateLimit,
    updateUserKYC,
  );
  app.put(
    "/admin/users/:userId/status",
    authenticateToken,
    strictRateLimit,
    updateUserStatus,
  );

  // Social banking routes (protected)
  app.get("/social/groups", authenticateToken, getSocialGroups);
  app.post(
    "/social/groups",
    authenticateToken,
    validateSchema(createGroupSchema),
    createGroup,
  );
  app.get("/social/requests", authenticateToken, getMoneyRequests);
  app.post(
    "/social/requests",
    authenticateToken,
    validateSchema(moneyRequestSchema),
    requestMoney,
  );
  app.get("/social/payments", authenticateToken, getSocialPayments);
  app.post(
    "/social/payments",
    authenticateToken,
    validateSchema(socialPaymentSchema),
    sendMoney,
  );
  app.get("/social/challenges", authenticateToken, getChallenges);

  // Database viewer routes removed in MVP

  // Initialize app on first startup (disabled in MVP to avoid external DB dependency)
  // try {
  //   await initializeApp();
  // } catch (error) {
  //   console.log("App already initialized or initialization skipped");
  // }

  // Start monitoring services
  startMonitoring();

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

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
