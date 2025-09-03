import { z } from "zod";

// Environment variables schema
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default("8080"),

  // Security
  JWT_SECRET: z
    .string()
    .min(32, "JWT secret must be at least 32 characters")
    .optional(),
  ENCRYPTION_KEY: z
    .string()
    .min(32, "Encryption key must be at least 32 characters")
    .optional(),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Payment Integration
  PAYSTACK_PUBLIC_KEY: z.string().startsWith("pk_").optional(),
  PAYSTACK_SECRET_KEY: z.string().startsWith("sk_").optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),

  // Flutterwave Integration
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),

  // Application URLs
  FRONTEND_URL: z.string().url().optional(),
  APP_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().optional(),

  // KYC Verification (VerifyMe)
  VERIFYME_API_KEY: z.string().optional(),
  VERIFYME_BASE_URL: z.string().url().optional(),

  // Smile Identity
  SMILE_PARTNER_ID: z.string().optional(),
  SMILE_API_KEY: z.string().optional(),
  SMILE_BASE_URL: z.string().url().optional(),

  // Email/SMS Notifications
  SENDGRID_API_KEY: z.string().optional(),
  TERMII_API_KEY: z.string().optional(),
  TERMII_SENDER_ID: z.string().optional(),

  // File Upload
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Redis (for production caching and rate limiting)
  REDIS_URL: z.string().optional(),

  // Monitoring
  SENTRY_DSN: z.string().optional(),

  // Feature Flags
  ENABLE_SIGNUP: z.string().transform(Boolean).default("true"),
  ENABLE_KYC: z.string().transform(Boolean).default("true"),
  ENABLE_INVESTMENTS: z.string().transform(Boolean).default("true"),
  ENABLE_BILL_PAYMENTS: z.string().transform(Boolean).default("true"),

  // Limits
  MAX_DAILY_TRANSACTIONS: z.string().transform(Number).default("50"),
  MAX_UNVERIFIED_WALLET_BALANCE: z.string().transform(Number).default("50000"),
  MAX_INVESTMENT_AMOUNT: z.string().transform(Number).default("10000000"),
});

// Environment variables type
export type Env = z.infer<typeof envSchema>;

// Load and validate environment variables
const loadEnv = (): Env => {
  try {
    // Use default values for development
    const defaultValues = {
      NODE_ENV: process.env.NODE_ENV || "development",
      PORT: process.env.PORT || "8080",
      JWT_SECRET:
        process.env.JWT_SECRET ||
        "development-jwt-secret-key-please-change-in-production",
      ENCRYPTION_KEY:
        process.env.ENCRYPTION_KEY ||
        "development-encryption-key-change-in-prod",
      DATABASE_URL: process.env.DATABASE_URL,
      PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
      PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
      PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET,
      FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
      FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
      FRONTEND_URL: process.env.FRONTEND_URL,
      APP_URL: process.env.APP_URL,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      VERIFYME_API_KEY: process.env.VERIFYME_API_KEY,
      VERIFYME_BASE_URL:
        process.env.VERIFYME_BASE_URL || "https://api.verifyme.ng",
      SMILE_PARTNER_ID: process.env.SMILE_PARTNER_ID,
      SMILE_API_KEY: process.env.SMILE_API_KEY,
      SMILE_BASE_URL:
        process.env.SMILE_BASE_URL ||
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
      MAX_UNVERIFIED_WALLET_BALANCE:
        process.env.MAX_UNVERIFIED_WALLET_BALANCE || "50000",
      MAX_INVESTMENT_AMOUNT: process.env.MAX_INVESTMENT_AMOUNT || "10000000",
    };

    const parsed = envSchema.parse(defaultValues);

    // Warn about missing production configurations
    if (parsed.NODE_ENV === "production") {
      const missingProdConfigs = [];

      if (!parsed.JWT_SECRET || parsed.JWT_SECRET.includes("development")) {
        missingProdConfigs.push("JWT_SECRET");
      }
      if (
        !parsed.ENCRYPTION_KEY ||
        parsed.ENCRYPTION_KEY.includes("development")
      ) {
        missingProdConfigs.push("ENCRYPTION_KEY");
      }
      if (!parsed.DATABASE_URL) {
        missingProdConfigs.push("DATABASE_URL");
      }
      if (!parsed.PAYSTACK_SECRET_KEY) {
        missingProdConfigs.push("PAYSTACK_SECRET_KEY");
      }

      if (missingProdConfigs.length > 0) {
        console.warn(
          "⚠️  Missing production environment variables:",
          missingProdConfigs.join(", "),
        );
        console.warn(
          "⚠️  The application may not work correctly in production without these.",
        );
      }
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
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
export const env = loadEnv();

// Helper functions
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

// Feature flags
export const features = {
  signup: env.ENABLE_SIGNUP,
  kyc: env.ENABLE_KYC,
  investments: env.ENABLE_INVESTMENTS,
  billPayments: env.ENABLE_BILL_PAYMENTS,
};

// Limits
export const limits = {
  maxDailyTransactions: env.MAX_DAILY_TRANSACTIONS,
  maxUnverifiedWalletBalance: env.MAX_UNVERIFIED_WALLET_BALANCE,
  maxInvestmentAmount: env.MAX_INVESTMENT_AMOUNT,
};

// Integration configurations
export const integrations = {
  paystack: {
    publicKey: env.PAYSTACK_PUBLIC_KEY,
    secretKey: env.PAYSTACK_SECRET_KEY,
    webhookSecret: env.PAYSTACK_WEBHOOK_SECRET,
    enabled: !!(env.PAYSTACK_PUBLIC_KEY && env.PAYSTACK_SECRET_KEY),
  },
  verifyMe: {
    apiKey: env.VERIFYME_API_KEY,
    baseUrl: env.VERIFYME_BASE_URL,
    enabled: !!env.VERIFYME_API_KEY,
  },
  smileIdentity: {
    partnerId: env.SMILE_PARTNER_ID,
    apiKey: env.SMILE_API_KEY,
    baseUrl: env.SMILE_BASE_URL,
    enabled: !!(env.SMILE_PARTNER_ID && env.SMILE_API_KEY),
  },
  sendGrid: {
    apiKey: env.SENDGRID_API_KEY,
    enabled: !!env.SENDGRID_API_KEY,
  },
  termii: {
    apiKey: env.TERMII_API_KEY,
    senderId: env.TERMII_SENDER_ID,
    enabled: !!env.TERMII_API_KEY,
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    enabled: !!(
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET
    ),
  },
};

// Log configuration status
export const logConfigStatus = () => {
  console.log("🔧 InvestNaija Configuration:");
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Port: ${env.PORT}`);
  console.log(`   Database: ${process.env.MONGO_URI || process.env.DATABASE_URL ? '✅ Configured' : '❌ Not configured'}`);
  console.log(
    `   Paystack: ${integrations.paystack.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(
    `   KYC (VerifyMe): ${integrations.verifyMe.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(
    `   KYC (Smile): ${integrations.smileIdentity.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(
    `   Email (SendGrid): ${integrations.sendGrid.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(
    `   SMS (Termii): ${integrations.termii.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log(
    `   File Upload: ${integrations.cloudinary.enabled ? "✅ Enabled" : "❌ Disabled"}`,
  );
  console.log("");
  console.log("🎛️  Feature Flags:");
  console.log(`   Signup: ${features.signup ? "✅" : "❌"}`);
  console.log(`   KYC: ${features.kyc ? "✅" : "❌"}`);
  console.log(`   Investments: ${features.investments ? "✅" : "❌"}`);
  console.log(`   Bill Payments: ${features.billPayments ? "✅" : "❌"}`);
  console.log("");
};
