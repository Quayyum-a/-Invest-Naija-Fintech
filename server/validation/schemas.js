"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = exports.formatZodError = exports.bulkPaymentSchema = exports.businessAccountSchema = exports.cryptoTradeSchema = exports.socialPaymentSchema = exports.moneyRequestSchema = exports.createGroupSchema = exports.investmentSchema = exports.cableTvSchema = exports.electricityBillSchema = exports.airtimeSchema = exports.transactionHistorySchema = exports.withdrawSchema = exports.transferSchema = exports.fundWalletSchema = exports.kycSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Nigerian phone number validation
const nigerianPhoneSchema = zod_1.z
    .string()
    .regex(/^(\+234|234|0)?[789][01]\d{8}$/, "Invalid Nigerian phone number format")
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
const bvnSchema = zod_1.z
    .string()
    .regex(/^\d{11}$/, "BVN must be exactly 11 digits")
    .min(11)
    .max(11);
// NIN validation (11 digits)
const ninSchema = zod_1.z
    .string()
    .regex(/^\d{11}$/, "NIN must be exactly 11 digits")
    .min(11)
    .max(11);
// Authentication schemas
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email format"),
        password: zod_1.z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number"),
        phone: nigerianPhoneSchema,
        firstName: zod_1.z
            .string()
            .min(2, "First name must be at least 2 characters")
            .max(50, "First name must be less than 50 characters")
            .regex(/^[a-zA-Z\s]+$/, "First name can only contain letters"),
        lastName: zod_1.z
            .string()
            .min(2, "Last name must be at least 2 characters")
            .max(50, "Last name must be less than 50 characters")
            .regex(/^[a-zA-Z\s]+$/, "Last name can only contain letters"),
        bvn: bvnSchema.optional(),
        nin: ninSchema.optional(),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email("Invalid email format"),
        password: zod_1.z.string().min(1, "Password is required"),
    }),
});
exports.kycSchema = zod_1.z.object({
    body: zod_1.z.object({
        bvn: bvnSchema,
        nin: ninSchema.optional(),
        dateOfBirth: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
        address: zod_1.z.object({
            street: zod_1.z
                .string()
                .min(10, "Street address must be at least 10 characters"),
            city: zod_1.z.string().min(2, "City must be at least 2 characters"),
            state: zod_1.z.string().min(2, "State must be at least 2 characters"),
            country: zod_1.z.string().default("Nigeria"),
        }),
    }),
});
// Wallet and transaction schemas
exports.fundWalletSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z
            .number()
            .min(100, "Minimum funding amount is ₦100")
            .max(1000000, "Maximum funding amount is ₦1,000,000"),
        provider: zod_1.z.enum(["paystack", "flutterwave"]).default("paystack"),
    }),
});
exports.transferSchema = zod_1.z.object({
    body: zod_1.z.object({
        toUserIdentifier: zod_1.z.string().min(1, "Recipient identifier is required"),
        amount: zod_1.z
            .number()
            .min(10, "Minimum transfer amount is ₦10")
            .max(500000, "Maximum transfer amount is ₦500,000"),
        description: zod_1.z.string().optional(),
        pin: zod_1.z
            .string()
            .regex(/^\d{4}$/, "PIN must be 4 digits")
            .optional(),
    }),
});
exports.withdrawSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z
            .number()
            .min(1000, "Minimum withdrawal amount is ₦1,000")
            .max(500000, "Maximum withdrawal amount is ₦500,000"),
        bankDetails: zod_1.z.object({
            accountNumber: zod_1.z
                .string()
                .regex(/^\d{10}$/, "Account number must be 10 digits"),
            bankCode: zod_1.z.string().regex(/^\d{3}$/, "Bank code must be 3 digits"),
            accountName: zod_1.z
                .string()
                .min(3, "Account name must be at least 3 characters"),
        }),
    }),
});
exports.transactionHistorySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).default("1"),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).default("20"),
        type: zod_1.z
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
        status: zod_1.z.enum(["pending", "completed", "failed"]).optional(),
        startDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        endDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
    }),
});
// Bill payment schemas
exports.airtimeSchema = zod_1.z.object({
    body: zod_1.z.object({
        network: zod_1.z.enum(["MTN", "AIRTEL", "GLO", "9MOBILE"], {
            errorMap: () => ({
                message: "Invalid network. Supported: MTN, Airtel, Glo, 9mobile",
            }),
        }),
        phoneNumber: nigerianPhoneSchema,
        amount: zod_1.z
            .number()
            .min(50, "Minimum airtime amount is ₦50")
            .max(50000, "Maximum airtime amount is ₦50,000"),
    }),
});
exports.electricityBillSchema = zod_1.z.object({
    body: zod_1.z.object({
        billerId: zod_1.z.string().min(1, "Biller ID is required"),
        customerCode: zod_1.z.string().min(1, "Customer/meter number is required"),
        amount: zod_1.z
            .number()
            .min(500, "Minimum electricity bill amount is ₦500")
            .max(100000, "Maximum electricity bill amount is ₦100,000"),
        meterType: zod_1.z.enum(["prepaid", "postpaid"]).default("prepaid"),
        phone: nigerianPhoneSchema,
    }),
});
exports.cableTvSchema = zod_1.z.object({
    body: zod_1.z.object({
        provider: zod_1.z.enum(["DSTV", "GOTV", "STARTIMES"], {
            errorMap: () => ({
                message: "Invalid provider. Supported: DStv, GOtv, StarTimes",
            }),
        }),
        smartCardNumber: zod_1.z.string().min(1, "Smart card number is required"),
        planId: zod_1.z.string().min(1, "Plan ID is required"),
        amount: zod_1.z
            .number()
            .min(100, "Minimum cable TV amount is ₦100")
            .max(50000, "Maximum cable TV amount is ₦50,000"),
    }),
});
// Investment schemas
exports.investmentSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z
            .number()
            .min(100, "Minimum investment amount is ₦100")
            .max(10000000, "Maximum investment amount is ₦10,000,000"),
        investmentType: zod_1.z.enum([
            "money_market",
            "treasury_bills",
            "fixed_deposit",
            "mutual_fund",
        ]),
        duration: zod_1.z.number().min(30).max(365).optional(), // days
        autoReinvest: zod_1.z.boolean().default(false),
    }),
});
// Social banking schemas
exports.createGroupSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z
            .string()
            .min(3, "Group name must be at least 3 characters")
            .max(50, "Group name must be less than 50 characters"),
        description: zod_1.z
            .string()
            .max(200, "Description must be less than 200 characters")
            .optional(),
        targetAmount: zod_1.z
            .number()
            .min(1000, "Minimum target amount is ₦1,000")
            .max(10000000, "Maximum target amount is ₦10,000,000"),
        endDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
            .optional(),
        category: zod_1.z
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
exports.moneyRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        toUserIdentifier: zod_1.z.string().min(1, "Recipient identifier is required"),
        amount: zod_1.z
            .number()
            .min(100, "Minimum request amount is ₦100")
            .max(500000, "Maximum request amount is ₦500,000"),
        reason: zod_1.z
            .string()
            .min(10, "Reason must be at least 10 characters")
            .max(200, "Reason must be less than 200 characters"),
        dueDate: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
            .optional(),
    }),
});
exports.socialPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        toUserIdentifier: zod_1.z.string().min(1, "Recipient identifier is required"),
        amount: zod_1.z
            .number()
            .min(10, "Minimum payment amount is ₦10")
            .max(100000, "Maximum payment amount is ₦100,000"),
        message: zod_1.z
            .string()
            .max(200, "Message must be less than 200 characters")
            .optional(),
        type: zod_1.z.enum(["gift", "payment", "split"]).default("payment"),
        isPublic: zod_1.z.boolean().default(false),
    }),
});
// Crypto schemas
exports.cryptoTradeSchema = zod_1.z.object({
    body: zod_1.z.object({
        symbol: zod_1.z.string().min(1, "Crypto symbol is required").toUpperCase(),
        amount: zod_1.z.number().min(1000, "Minimum trade amount is ₦1,000"),
        type: zod_1.z.enum(["buy", "sell"]),
    }),
});
// Business banking schemas
exports.businessAccountSchema = zod_1.z.object({
    body: zod_1.z.object({
        businessName: zod_1.z
            .string()
            .min(3, "Business name must be at least 3 characters")
            .max(100, "Business name must be less than 100 characters"),
        businessType: zod_1.z.enum([
            "sole_proprietorship",
            "partnership",
            "limited_liability",
            "corporation",
        ]),
        rcNumber: zod_1.z.string().optional(),
        tin: zod_1.z.string().optional(),
        industry: zod_1.z.string().min(2, "Industry must be at least 2 characters"),
        businessAddress: zod_1.z.object({
            street: zod_1.z
                .string()
                .min(10, "Street address must be at least 10 characters"),
            city: zod_1.z.string().min(2, "City must be at least 2 characters"),
            state: zod_1.z.string().min(2, "State must be at least 2 characters"),
        }),
    }),
});
exports.bulkPaymentSchema = zod_1.z.object({
    body: zod_1.z.object({
        payments: zod_1.z
            .array(zod_1.z.object({
            accountNumber: zod_1.z
                .string()
                .regex(/^\d{10}$/, "Account number must be 10 digits"),
            bankCode: zod_1.z.string().regex(/^\d{3}$/, "Bank code must be 3 digits"),
            accountName: zod_1.z
                .string()
                .min(3, "Account name must be at least 3 characters"),
            amount: zod_1.z.number().min(100, "Minimum payment amount is ₦100"),
            narration: zod_1.z
                .string()
                .max(100, "Narration must be less than 100 characters")
                .optional(),
        }))
            .min(1, "At least one payment is required")
            .max(100, "Maximum 100 payments per batch"),
        totalAmount: zod_1.z.number().min(100, "Total amount must be at least ₦100"),
        description: zod_1.z
            .string()
            .max(200, "Description must be less than 200 characters")
            .optional(),
    }),
});
// Validation error formatter
const formatZodError = (error) => {
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
exports.formatZodError = formatZodError;
// Validation middleware factory
const validateSchema = (schema) => {
    return (req, res, next) => {
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
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json((0, exports.formatZodError)(error));
            }
            next(error);
        }
    };
};
exports.validateSchema = validateSchema;
