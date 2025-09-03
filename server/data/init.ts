import bcrypt from "bcryptjs";
import { createUserAsync as createUser } from "./storage";

/**
 * Initialize the application with default admin user
 * This should only be run once during initial setup
 */
export const initializeApp = async () => {
  console.log("Initializing InvestNaija application...");

  // Create super admin user for app management
  try {
    const adminPassword = await bcrypt.hash("SuperAdmin123!", 12);
    const adminUser = createUser({
      email: "quayyumariyo@gmail.com",
      password: adminPassword,
      phone: "+2348000000001",
      firstName: "Ariyo",
      lastName: "Quayyum",
      role: "super_admin",
    });

    console.log("✅ Super admin user created:", adminUser.email);
    console.log(
      "🔑 Super Admin login: quayyumariyo@gmail.com / SuperAdmin123!",
    );
    console.log(
      "⚠️  Please change the default admin password after first login",
    );
  } catch (error) {
    console.log(
      "Super admin user may already exist or initialization failed",
      error,
    );
  }

  // Initialize sample financial challenges
  try {
    const { createSampleChallengesAsync } = await import("./storage");
    await createSampleChallengesAsync?.();
  } catch (error) {
    console.log("Sample challenges may already exist");
  }

  console.log("🚀 InvestNaija application initialized successfully!");
  console.log("");
  console.log("Next steps:");
  console.log("1. Start the application: npm run dev");
  console.log("2. Visit the homepage and create your first user account");
  console.log("3. For admin access, login with admin@investnaija.com");
  console.log("4. Configure your payment providers (Paystack/Flutterwave)");
  console.log("5. Set up your investment partners and products");
  console.log("");
};

/**
 * Create sample investment products
 * These represent real investment options that users can choose from
 */
export const createInvestmentProducts = () => {
  return [
    {
      id: "money_market_fund",
      name: "Money Market Fund",
      description: "Low-risk investment in short-term government securities",
      minAmount: 100,
      expectedReturn: 12.5,
      riskLevel: "Low",
      duration: "Flexible",
      provider: "Stanbic IBTC Asset Management",
    },
    {
      id: "treasury_bills_91",
      name: "91-Day Treasury Bills",
      description: "Government-backed short-term investment",
      minAmount: 1000,
      expectedReturn: 15.2,
      riskLevel: "Very Low",
      duration: "91 Days",
      provider: "Federal Government of Nigeria",
    },
    {
      id: "fixed_deposit",
      name: "Fixed Deposit",
      description: "Guaranteed returns with fixed term deposits",
      minAmount: 5000,
      expectedReturn: 10.0,
      riskLevel: "Very Low",
      duration: "3-12 Months",
      provider: "Partner Banks",
    },
  ];
};

/**
 * Real Nigerian banks for bank account linking
 */
export const getNigerianBanks = () => {
  return [
    { code: "044", name: "Access Bank" },
    { code: "014", name: "Afribank Nigeria Plc" },
    { code: "023", name: "Citibank Nigeria Limited" },
    { code: "050", name: "Ecobank Nigeria Plc" },
    { code: "011", name: "First Bank of Nigeria Limited" },
    { code: "214", name: "First City Monument Bank Limited" },
    { code: "070", name: "Fidelity Bank Plc" },
    { code: "058", name: "Guaranty Trust Bank Plc" },
    { code: "030", name: "Heritage Banking Company Ltd" },
    { code: "082", name: "Keystone Bank Limited" },
    { code: "076", name: "Polaris Bank Limited" },
    { code: "039", name: "Stanbic IBTC Bank Plc" },
    { code: "232", name: "Sterling Bank Plc" },
    { code: "032", name: "Union Bank of Nigeria Plc" },
    { code: "033", name: "United Bank for Africa Plc" },
    { code: "215", name: "Unity Bank Plc" },
    { code: "035", name: "Wema Bank Plc" },
    { code: "057", name: "Zenith Bank Plc" },
    { code: "068", name: "Standard Chartered Bank Nigeria Limited" },
    { code: "221", name: "Stanbic Mobile Money" },
  ];
};
