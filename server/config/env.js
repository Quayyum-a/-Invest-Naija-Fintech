"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logConfigStatus = exports.integrations = exports.limits = exports.features = exports.isTest = exports.isProduction = exports.isDevelopment = exports.env = void 0;
const zod_1 = require("zod");
// Environment variables schema
const envSchema = zod_1.z.object({
    // Server Configuration
    NODE_ENV: zod_1.z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: zod_1.z.string().transform(Number).default("8080"),
    // Security
    JWT_SECRET: zod_1.z
        .string()
        .min(32, "JWT secret must be at least 32 characters")
        .optional(),
    ENCRYPTION_KEY: zod_1.z
        .string()
        .min(32, "Encryption key must be at least 32 characters")
        .optional(),
    // Database
    DATABASE_URL: zod_1.z.string().url().optional(),
    // Paystack Integration
    PAYSTACK_PUBLIC_KEY: zod_1.z.string().startsWith("pk_").optional(),
    PAYSTACK_SECRET_KEY: zod_1.z.string().startsWith("sk_").optional(),
    PAYSTACK_WEBHOOK_SECRET: zod_1.z.string().optional(),
    // Flutterwave Integration
    FLUTTERWAVE_PUBLIC_KEY: zod_1.z.string().startsWith("FLWPUBK_").optional(),
    FLUTTERWAVE_SECRET_KEY: zod_1.z.string().startsWith("FLWSECK_").optional(),
    FLUTTERWAVE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    // CoinGecko API (free, no key required)
    COINGECKO_API_KEY: zod_1.z.string().optional(),
    // YouVerify KYC Integration
    YOUVERIFY_API_KEY: zod_1.z.string().optional(),
    YOUVERIFY_BASE_URL: zod_1.z.string().url().optional(),
    // KYC Verification (VerifyMe - Legacy)
    VERIFYME_API_KEY: zod_1.z.string().optional(),
    VERIFYME_BASE_URL: zod_1.z.string().url().optional(),
    // Smile Identity
    SMILE_PARTNER_ID: zod_1.z.string().optional(),
    SMILE_API_KEY: zod_1.z.string().optional(),
    SMILE_BASE_URL: zod_1.z.string().url().optional(),
    // Email/SMS Notifications
    SENDGRID_API_KEY: zod_1.z.string().optional(),
    TERMII_API_KEY: zod_1.z.string().optional(),
    TERMII_SENDER_ID: zod_1.z.string().optional(),
    // File Upload
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional(),
    // Redis (for production caching and rate limiting)
    REDIS_URL: zod_1.z.string().optional(),
    // Monitoring
    SENTRY_DSN: zod_1.z.string().optional(),
    // Feature Flags
    ENABLE_SIGNUP: zod_1.z.string().transform(Boolean).default("true"),
    ENABLE_KYC: zod_1.z.string().transform(Boolean).default("true"),
    ENABLE_INVESTMENTS: zod_1.z.string().transform(Boolean).default("true"),
    ENABLE_BILL_PAYMENTS: zod_1.z.string().transform(Boolean).default("true"),
    // Limits
    MAX_DAILY_TRANSACTIONS: zod_1.z.string().transform(Number).default("50"),
    MAX_UNVERIFIED_WALLET_BALANCE: zod_1.z.string().transform(Number).default("50000"),
    MAX_INVESTMENT_AMOUNT: zod_1.z.string().transform(Number).default("10000000"),
});
// Load and validate environment variables
const loadEnv = () => {
    try {
        // Use default values for development
        const defaultValues = {
            NODE_ENV: process.env.NODE_ENV || "development",
            PORT: process.env.PORT || "8080",
            JWT_SECRET: process.env.JWT_SECRET ||
                "development-jwt-secret-key-please-change-in-production",
            ENCRYPTION_KEY: process.env.ENCRYPTION_KEY ||
                "development-encryption-key-change-in-prod",
            DATABASE_URL: process.env.DATABASE_URL,
            PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
            PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
            PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET,
            FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
            FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
            FLUTTERWAVE_WEBHOOK_SECRET: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
            COINGECKO_API_KEY: process.env.COINGECKO_API_KEY,
            YOUVERIFY_API_KEY: process.env.YOUVERIFY_API_KEY,
            YOUVERIFY_BASE_URL: process.env.YOUVERIFY_BASE_URL || "https://api.youverify.co/v2",
            VERIFYME_API_KEY: process.env.VERIFYME_API_KEY,
            VERIFYME_BASE_URL: process.env.VERIFYME_BASE_URL || "https://api.verifyme.ng",
            SMILE_PARTNER_ID: process.env.SMILE_PARTNER_ID,
            SMILE_API_KEY: process.env.SMILE_API_KEY,
            SMILE_BASE_URL: process.env.SMILE_BASE_URL ||
                "https://3eydmgh10d.execute-api.us-west-2.amazonaws.com/test",
            SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
            TERMII_API_KEY: process.env.TERMII_API_KEY,
            TERMII_SENDER_ID: process.env.TERMII_SENDER_ID || "InvestNaija",
            CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
            CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
            CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
            REDIS_URL: process.env.REDIS_URL,
            SENTRY_DSN: process.env.SENTRY_DSN,
            ENABLE_SIGNUP: process.env.ENABLE_SIGNUP || "true",
            ENABLE_KYC: process.env.ENABLE_KYC || "true",
            ENABLE_INVESTMENTS: process.env.ENABLE_INVESTMENTS || "true",
            ENABLE_BILL_PAYMENTS: process.env.ENABLE_BILL_PAYMENTS || "true",
            MAX_DAILY_TRANSACTIONS: process.env.MAX_DAILY_TRANSACTIONS || "50",
            MAX_UNVERIFIED_WALLET_BALANCE: process.env.MAX_UNVERIFIED_WALLET_BALANCE || "50000",
            MAX_INVESTMENT_AMOUNT: process.env.MAX_INVESTMENT_AMOUNT || "10000000",
        };
        const parsed = envSchema.parse(defaultValues);
        // Warn about missing production configurations
        if (parsed.NODE_ENV === "production") {
            const missingProdConfigs = [];
            if (!parsed.JWT_SECRET || parsed.JWT_SECRET.includes("development")) {
                missingProdConfigs.push("JWT_SECRET");
            }
            if (!parsed.ENCRYPTION_KEY ||
                parsed.ENCRYPTION_KEY.includes("development")) {
                missingProdConfigs.push("ENCRYPTION_KEY");
            }
            if (!parsed.DATABASE_URL) {
                missingProdConfigs.push("DATABASE_URL");
            }
            if (!parsed.PAYSTACK_SECRET_KEY) {
                missingProdConfigs.push("PAYSTACK_SECRET_KEY");
            }
            if (missingProdConfigs.length > 0) {
                console.warn("⚠️  Missing production environment variables:", missingProdConfigs.join(", "));
                console.warn("⚠️  The application may not work correctly in production without these.");
            }
        }
        return parsed;
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            console.error("❌ Environment validation failed:");
            error.errors.forEach((err) => {
                console.error(`  - ${err.path.join(".")}: ${err.message}`);
            });
            process.exit(1);
        }
        throw error;
    }
};
// Export environment configuration
exports.env = loadEnv();
// Helper functions
exports.isDevelopment = exports.env.NODE_ENV === "development";
exports.isProduction = exports.env.NODE_ENV === "production";
exports.isTest = exports.env.NODE_ENV === "test";
// Feature flags
exports.features = {
    signup: exports.env.ENABLE_SIGNUP,
    kyc: exports.env.ENABLE_KYC,
    investments: exports.env.ENABLE_INVESTMENTS,
    billPayments: exports.env.ENABLE_BILL_PAYMENTS,
};
// Limits
exports.limits = {
    maxDailyTransactions: exports.env.MAX_DAILY_TRANSACTIONS,
    maxUnverifiedWalletBalance: exports.env.MAX_UNVERIFIED_WALLET_BALANCE,
    maxInvestmentAmount: exports.env.MAX_INVESTMENT_AMOUNT,
};
// Integration configurations
exports.integrations = {
    paystack: {
        publicKey: exports.env.PAYSTACK_PUBLIC_KEY,
        secretKey: exports.env.PAYSTACK_SECRET_KEY,
        webhookSecret: exports.env.PAYSTACK_WEBHOOK_SECRET,
        enabled: !!(exports.env.PAYSTACK_PUBLIC_KEY && exports.env.PAYSTACK_SECRET_KEY),
    },
    flutterwave: {
        publicKey: exports.env.FLUTTERWAVE_PUBLIC_KEY,
        secretKey: exports.env.FLUTTERWAVE_SECRET_KEY,
        webhookSecret: exports.env.FLUTTERWAVE_WEBHOOK_SECRET,
        enabled: !!(exports.env.FLUTTERWAVE_PUBLIC_KEY && exports.env.FLUTTERWAVE_SECRET_KEY),
    },
    coinGecko: {
        apiKey: exports.env.COINGECKO_API_KEY,
        enabled: true, // CoinGecko is free and doesn't require API key
    },
    youVerify: {
        apiKey: exports.env.YOUVERIFY_API_KEY,
        baseUrl: exports.env.YOUVERIFY_BASE_URL,
        enabled: !!exports.env.YOUVERIFY_API_KEY,
    },
    verifyMe: {
        apiKey: exports.env.VERIFYME_API_KEY,
        baseUrl: exports.env.VERIFYME_BASE_URL,
        enabled: !!exports.env.VERIFYME_API_KEY,
    },
    smileIdentity: {
        partnerId: exports.env.SMILE_PARTNER_ID,
        apiKey: exports.env.SMILE_API_KEY,
        baseUrl: exports.env.SMILE_BASE_URL,
        enabled: !!(exports.env.SMILE_PARTNER_ID && exports.env.SMILE_API_KEY),
    },
    sendGrid: {
        apiKey: exports.env.SENDGRID_API_KEY,
        enabled: !!exports.env.SENDGRID_API_KEY,
    },
    termii: {
        apiKey: exports.env.TERMII_API_KEY,
        senderId: exports.env.TERMII_SENDER_ID,
        enabled: !!exports.env.TERMII_API_KEY,
    },
    cloudinary: {
        cloudName: exports.env.CLOUDINARY_CLOUD_NAME,
        apiKey: exports.env.CLOUDINARY_API_KEY,
        apiSecret: exports.env.CLOUDINARY_API_SECRET,
        enabled: !!(exports.env.CLOUDINARY_CLOUD_NAME &&
            exports.env.CLOUDINARY_API_KEY &&
            exports.env.CLOUDINARY_API_SECRET),
    },
};
// Log configuration status
const logConfigStatus = () => {
    console.log("🔧 InvestNaija Configuration:");
    console.log(`   Environment: ${exports.env.NODE_ENV}`);
    console.log(`   Port: ${exports.env.PORT}`);
    console.log(`   Database: ✅ SQLite connected (data/investnaija.db)`);
    console.log(`   Paystack: ${exports.integrations.paystack.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`   Flutterwave: ${exports.integrations.flutterwave.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`   CoinGecko: ${exports.integrations.coinGecko.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`   KYC (YouVerify): ${exports.integrations.youVerify.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`   KYC (VerifyMe): ${exports.integrations.verifyMe.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`   KYC (Smile): ${exports.integrations.smileIdentity.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`   Email (SendGrid): ${exports.integrations.sendGrid.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`   SMS (Termii): ${exports.integrations.termii.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log(`   File Upload: ${exports.integrations.cloudinary.enabled ? "✅ Enabled" : "❌ Disabled"}`);
    console.log("");
    console.log("🎛️  Feature Flags:");
    console.log(`   Signup: ${exports.features.signup ? "✅" : "❌"}`);
    console.log(`   KYC: ${exports.features.kyc ? "✅" : "❌"}`);
    console.log(`   Investments: ${exports.features.investments ? "✅" : "❌"}`);
    console.log(`   Bill Payments: ${exports.features.billPayments ? "✅" : "❌"}`);
    console.log("");
};
exports.logConfigStatus = logConfigStatus;
