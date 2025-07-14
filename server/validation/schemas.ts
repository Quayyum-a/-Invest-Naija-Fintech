import { z } from "zod";

// Nigerian phone number validation
const nigerianPhoneSchema = z
  .string()
  .regex(
    /^(\+234|234|0)?[789][01]\d{8}$/,
    "Invalid Nigerian phone number format",
  )
  .transform((phone) => {
    // Normalize to +234 format
    const cleaned = phone.replace(/\s+/g, "");
    if (cleaned.startsWith("0")) {
      return "+234" + cleaned.substring(1);
    }
    if (cleaned.startsWith("234")) {
      return "+" + cleaned;
    }
    if (!cleaned.startsWith("+234")) {
      return "+234" + cleaned;
    }
    return cleaned;
  });

// BVN validation (11 digits)
const bvnSchema = z
  .string()
  .regex(/^\d{11}$/, "BVN must be exactly 11 digits")
  .min(11)
  .max(11);

// NIN validation (11 digits)
const ninSchema = z
  .string()
  .regex(/^\d{11}$/, "NIN must be exactly 11 digits")
  .min(11)
  .max(11);

// Authentication schemas
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number",
      ),
    phone: nigerianPhoneSchema,
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters"),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters"),
    bvn: bvnSchema.optional(),
    nin: ninSchema.optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const kycSchema = z.object({
  body: z.object({
    bvn: bvnSchema,
    nin: ninSchema.optional(),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    address: z.object({
      street: z
        .string()
        .min(10, "Street address must be at least 10 characters"),
      city: z.string().min(2, "City must be at least 2 characters"),
      state: z.string().min(2, "State must be at least 2 characters"),
      country: z.string().default("Nigeria"),
    }),
  }),
});

// Wallet and transaction schemas
export const fundWalletSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .min(100, "Minimum funding amount is ₦100")
      .max(1000000, "Maximum funding amount is ₦1,000,000"),
    provider: z.enum(["paystack", "flutterwave"]).default("paystack"),
  }),
});

export const transferSchema = z.object({
  body: z.object({
    toUserIdentifier: z.string().min(1, "Recipient identifier is required"),
    amount: z
      .number()
      .min(10, "Minimum transfer amount is ₦10")
      .max(500000, "Maximum transfer amount is ₦500,000"),
    description: z.string().optional(),
    pin: z
      .string()
      .regex(/^\d{4}$/, "PIN must be 4 digits")
      .optional(),
  }),
});

export const withdrawSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .min(1000, "Minimum withdrawal amount is ₦1,000")
      .max(500000, "Maximum withdrawal amount is ₦500,000"),
    bankDetails: z.object({
      accountNumber: z
        .string()
        .regex(/^\d{10}$/, "Account number must be 10 digits"),
      bankCode: z.string().regex(/^\d{3}$/, "Bank code must be 3 digits"),
      accountName: z
        .string()
        .min(3, "Account name must be at least 3 characters"),
    }),
  }),
});

export const transactionHistorySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default("1"),
    limit: z.string().regex(/^\d+$/).transform(Number).default("20"),
    type: z
      .enum([
        "deposit",
        "withdrawal",
        "transfer_in",
        "transfer_out",
        "investment",
        "bill_payment",
        "airtime",
        "social_payment",
      ])
      .optional(),
    status: z.enum(["pending", "completed", "failed"]).optional(),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
});

// Bill payment schemas
export const airtimeSchema = z.object({
  body: z.object({
    network: z.enum(["MTN", "AIRTEL", "GLO", "9MOBILE"], {
      errorMap: () => ({
        message: "Invalid network. Supported: MTN, Airtel, Glo, 9mobile",
      }),
    }),
    phoneNumber: nigerianPhoneSchema,
    amount: z
      .number()
      .min(50, "Minimum airtime amount is ₦50")
      .max(50000, "Maximum airtime amount is ₦50,000"),
  }),
});

export const electricityBillSchema = z.object({
  body: z.object({
    billerId: z.string().min(1, "Biller ID is required"),
    customerCode: z.string().min(1, "Customer/meter number is required"),
    amount: z
      .number()
      .min(500, "Minimum electricity bill amount is ₦500")
      .max(100000, "Maximum electricity bill amount is ₦100,000"),
    meterType: z.enum(["prepaid", "postpaid"]).default("prepaid"),
    phone: nigerianPhoneSchema,
  }),
});

export const cableTvSchema = z.object({
  body: z.object({
    provider: z.enum(["DSTV", "GOTV", "STARTIMES"], {
      errorMap: () => ({
        message: "Invalid provider. Supported: DStv, GOtv, StarTimes",
      }),
    }),
    smartCardNumber: z.string().min(1, "Smart card number is required"),
    planId: z.string().min(1, "Plan ID is required"),
    amount: z
      .number()
      .min(100, "Minimum cable TV amount is ₦100")
      .max(50000, "Maximum cable TV amount is ₦50,000"),
  }),
});

// Investment schemas
export const investmentSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .min(100, "Minimum investment amount is ₦100")
      .max(10000000, "Maximum investment amount is ₦10,000,000"),
    investmentType: z.enum([
      "money_market",
      "treasury_bills",
      "fixed_deposit",
      "mutual_fund",
    ]),
    duration: z.number().min(30).max(365).optional(), // days
    autoReinvest: z.boolean().default(false),
  }),
});

// Social banking schemas
export const createGroupSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, "Group name must be at least 3 characters")
      .max(50, "Group name must be less than 50 characters"),
    description: z
      .string()
      .max(200, "Description must be less than 200 characters")
      .optional(),
    targetAmount: z
      .number()
      .min(1000, "Minimum target amount is ₦1,000")
      .max(10000000, "Maximum target amount is ₦10,000,000"),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
    category: z
      .enum([
        "vacation",
        "emergency",
        "wedding",
        "business",
        "education",
        "other",
      ])
      .default("other"),
  }),
});

export const moneyRequestSchema = z.object({
  body: z.object({
    toUserIdentifier: z.string().min(1, "Recipient identifier is required"),
    amount: z
      .number()
      .min(100, "Minimum request amount is ₦100")
      .max(500000, "Maximum request amount is ₦500,000"),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(200, "Reason must be less than 200 characters"),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
  }),
});

export const socialPaymentSchema = z.object({
  body: z.object({
    toUserIdentifier: z.string().min(1, "Recipient identifier is required"),
    amount: z
      .number()
      .min(10, "Minimum payment amount is ₦10")
      .max(100000, "Maximum payment amount is ₦100,000"),
    message: z
      .string()
      .max(200, "Message must be less than 200 characters")
      .optional(),
    type: z.enum(["gift", "payment", "split"]).default("payment"),
    isPublic: z.boolean().default(false),
  }),
});

// Crypto schemas
export const cryptoTradeSchema = z.object({
  body: z.object({
    symbol: z.string().min(1, "Crypto symbol is required").toUpperCase(),
    amount: z.number().min(1000, "Minimum trade amount is ₦1,000"),
    type: z.enum(["buy", "sell"]),
  }),
});

// Business banking schemas
export const businessAccountSchema = z.object({
  body: z.object({
    businessName: z
      .string()
      .min(3, "Business name must be at least 3 characters")
      .max(100, "Business name must be less than 100 characters"),
    businessType: z.enum([
      "sole_proprietorship",
      "partnership",
      "limited_liability",
      "corporation",
    ]),
    rcNumber: z.string().optional(),
    tin: z.string().optional(),
    industry: z.string().min(2, "Industry must be at least 2 characters"),
    businessAddress: z.object({
      street: z
        .string()
        .min(10, "Street address must be at least 10 characters"),
      city: z.string().min(2, "City must be at least 2 characters"),
      state: z.string().min(2, "State must be at least 2 characters"),
    }),
  }),
});

export const bulkPaymentSchema = z.object({
  body: z.object({
    payments: z
      .array(
        z.object({
          accountNumber: z
            .string()
            .regex(/^\d{10}$/, "Account number must be 10 digits"),
          bankCode: z.string().regex(/^\d{3}$/, "Bank code must be 3 digits"),
          accountName: z
            .string()
            .min(3, "Account name must be at least 3 characters"),
          amount: z.number().min(100, "Minimum payment amount is ₦100"),
          narration: z
            .string()
            .max(100, "Narration must be less than 100 characters")
            .optional(),
        }),
      )
      .min(1, "At least one payment is required")
      .max(100, "Maximum 100 payments per batch"),
    totalAmount: z.number().min(100, "Total amount must be at least ₦100"),
    description: z
      .string()
      .max(200, "Description must be less than 200 characters")
      .optional(),
  }),
});

// Validation error formatter
export const formatZodError = (error: z.ZodError) => {
  const errors = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));

  return {
    success: false,
    error: "Validation error",
    details: errors,
  };
};

// Validation middleware factory
export const validateSchema = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Update request with validated data
      req.body = result.body || req.body;
      req.query = result.query || req.query;
      req.params = result.params || req.params;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json(formatZodError(error));
      }
      next(error);
    }
  };
};
