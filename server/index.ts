import express from "express";
import cors from "cors";
// Demo route removed for production
import { authenticateToken } from "./middleware/auth";
import { initializeApp } from "./data/init";
import { env, logConfigStatus } from "./config/env";
import {
  generalRateLimit,
  authRateLimit,
  otpRateLimit,
  transactionRateLimit,
  securityHeaders,
  requestLogger,
  validateInput,
  validateTransactionAmount,
  validateNigerianPhone,
  validateEmail,
  validatePassword,
  errorHandler,
  notFoundHandler,
} from "./middleware/security";

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

export function createServer() {
  // Log configuration on startup
  logConfigStatus();

  const app = express();

  // Security middleware (apply early)
  app.use(securityHeaders);
  app.use(requestLogger);
  app.use(generalRateLimit);

  // Basic middleware
  app.use(
    cors({
      origin:
        env.NODE_ENV === "production"
          ? ["https://investnaija.com", "https://www.investnaija.com"]
          : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(validateInput);

  // Health check
  app.get("/ping", (_req, res) => {
    res.json({ message: "InvestNaija API v1.0" });
  });

  // Production API only - demo route removed

  // Authentication routes (public)
  app.post(
    "/auth/register",
    authRateLimit,
    validateEmail,
    validatePassword,
    validateNigerianPhone,
    register,
  );
  app.post("/auth/login", authRateLimit, login);
  app.post("/auth/logout", logout);
  app.get("/auth/me", getCurrentUser);

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
    validateTransactionAmount,
    investMoney,
  );
  app.get("/transactions", authenticateToken, getTransactions);

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

  // KYC routes (protected)
  app.post("/kyc/submit", authenticateToken, submitKYCDocuments);
  app.get("/kyc/status", authenticateToken, getKYCStatus);
  app.post("/kyc/upload", authenticateToken, uploadKYCDocument);

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
    validateTransactionAmount,
    buyCrypto,
  );
  app.post("/crypto/sell", authenticateToken, transactionRateLimit, sellCrypto);

  // Bill payment routes
  app.get("/bills/billers", getBillers);
  app.get("/bills/electricity/companies", getElectricityCompanies);
  app.post("/bills/validate-customer", validateCustomer);
  app.post(
    "/bills/pay-electricity",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
    payElectricityBill,
  );
  app.post(
    "/bills/buy-airtime",
    authenticateToken,
    transactionRateLimit,
    validateTransactionAmount,
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
    validateTransactionAmount,
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

  // Admin routes (protected)
  app.get("/admin/stats", authenticateToken, getAdminStats);
  app.get("/admin/users", authenticateToken, getAllUsersAdmin);
  app.get("/admin/users/:userId", authenticateToken, getUserDetails);
  app.put("/admin/users/:userId/kyc", authenticateToken, updateUserKYC);
  app.put("/admin/users/:userId/status", authenticateToken, updateUserStatus);

  // Initialize app on first startup
  try {
    initializeApp();
  } catch (error) {
    console.log("App already initialized or initialization skipped");
  }

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
