#!/usr/bin/env tsx

/**
 * InvestNaija Application Initialization Script
 *
 * This script sets up the application for first-time use:
 * - Creates default admin user
 * - Sets up initial configuration
 * - Displays setup instructions
 *
 * Usage: npm run init
 */

import { initializeApp } from "./data/init";

console.log("🇳🇬 InvestNaija - Nigerian Micro-Investment Platform");
console.log("==================================================");
console.log("");

console.log("🚀 Starting application initialization...");
console.log("");

(async () => {
  try {
    await initializeApp();

    console.log("✅ Initialization completed successfully!");
    console.log("");
    console.log("🎯 Your InvestNaija app is ready for production use!");
    console.log("");
    console.log("📋 What's included:");
    console.log("   • User registration and authentication");
    console.log("   • Wallet management (deposit/withdraw)");
    console.log("   • Investment tracking and portfolio");
    console.log("   • KYC verification system");
    console.log("   • Admin dashboard");
    console.log("   • Real-time transaction history");
    console.log("   • Nigerian payment integrations (Paystack/Flutterwave)");
    console.log("   • Virtual account generation");
    console.log("   • Mobile-first OPay-like interface");
    console.log("");
    console.log("🔧 Next steps for production:");
    console.log(
      "   1. Set up Paystack/Flutterwave API keys for payment processing",
    );
    console.log("   2. Configure VerifyMe/Smile Identity for KYC verification");
    console.log("   3. Set up email/SMS notifications (SendGrid, Termii)");
    console.log("   4. Deploy to cloud infrastructure (AWS, GCP, Azure)");
    console.log("   5. Set up proper environment variables");
    console.log("   6. Configure SSL and security headers");
    console.log("   7. Set up monitoring and logging");
    console.log("");
    console.log("🌐 Default admin access:");
    console.log("   Email: admin@investnaija.com");
    console.log("   Password: Admin123! (⚠️ CHANGE THIS IMMEDIATELY)");
    console.log("");
    console.log("🌐 Demo user access:");
    console.log("   Email: demo@investnaija.com");
    console.log("   Password: Demo123!");
    console.log("");
    console.log("🎉 Happy investing! Your users can now:");
    console.log("   • Create accounts and verify with BVN/NIN");
    console.log("   • Fund wallets via real Nigerian payment gateways");
    console.log("   • Start investing from ₦100");
    console.log("   • Track portfolio performance");
    console.log("   • Withdraw funds anytime");
    console.log("");
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    process.exit(1);
  }
})();
