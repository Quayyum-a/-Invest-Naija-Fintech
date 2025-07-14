import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ErrorResponse } from "@shared/api";

// Rate limiting storage (use Redis in production)
const rateLimitStore = new Map<
  string,
  { count: number; resetTime: number; blocked: boolean }
>();

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDuration?: number; // Block duration in milliseconds after limit exceeded
  message?: string;
  skipSuccessfulRequests?: boolean;
}

// Create rate limiter middleware
export const createRateLimit = (config: RateLimitConfig) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    // Clean up expired entries
    for (const [key, data] of rateLimitStore.entries()) {
      if (now > data.resetTime) {
        rateLimitStore.delete(key);
      }
    }

    let limiter = rateLimitStore.get(identifier);

    // Initialize or reset if window expired
    if (!limiter || now > limiter.resetTime) {
      limiter = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false,
      };
      rateLimitStore.set(identifier, limiter);
    }

    // Check if blocked
    if (limiter.blocked) {
      return res.status(429).json({
        success: false,
        error: config.message || "Too many requests, please try again later",
        retryAfter: Math.ceil((limiter.resetTime - now) / 1000),
      } as ErrorResponse);
    }

    // Increment counter
    limiter.count++;

    // Check if limit exceeded
    if (limiter.count > config.maxRequests) {
      limiter.blocked = true;
      if (config.blockDuration) {
        limiter.resetTime = now + config.blockDuration;
      }

      return res.status(429).json({
        success: false,
        error: config.message || "Rate limit exceeded",
        retryAfter: Math.ceil((limiter.resetTime - now) / 1000),
      } as ErrorResponse);
    }

    // Add rate limit headers
    res.set({
      "X-RateLimit-Limit": config.maxRequests.toString(),
      "X-RateLimit-Remaining": Math.max(
        0,
        config.maxRequests - limiter.count,
      ).toString(),
      "X-RateLimit-Reset": new Date(limiter.resetTime).toISOString(),
    });

    next();
  };
};

// Enhanced rate limiters using express-rate-limit
const createExpressRateLimit = (options: any) => {
  return rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: options.message || "Too many requests, please try again later",
    },
  });
};

// Production-ready rate limiters
export const authRateLimit = createExpressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 50, // 5 attempts in production, 50 in dev
  message: "Too many authentication attempts, please try again in 15 minutes",
  skipSuccessfulRequests: true,
});

export const otpRateLimit = createExpressRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 OTP requests per hour
  message: "Too many OTP requests, please try again in 1 hour",
});

export const transactionRateLimit = createExpressRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === "production" ? 10 : 100, // 10 transactions/min in production
  message: "Too many transactions, please slow down",
});

export const generalRateLimit = createExpressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000, // 100 requests/15min in production
  message: "Too many requests, please try again later",
});

// Strict rate limiter for sensitive operations
export const strictRateLimit = createExpressRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message:
    "Too many attempts for this sensitive operation, please try again in 1 hour",
});

// Input validation and sanitization
export const validateInput = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Remove potentially dangerous characters
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  };

  // Recursively sanitize object
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === "string") {
      return sanitizeString(obj);
    }
    if (typeof obj === "object" && obj !== null) {
      const sanitized: any = Array.isArray(obj) ? [] : {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
};

// Enhanced security headers middleware using helmet
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https:"],
      frameAncestors: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: "deny" },
  xssFilter: true,
});

// Request logging middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();
  const userAgent = req.get("User-Agent") || "unknown";
  const ip = req.ip || req.connection.remoteAddress || "unknown";

  // Log request
  console.log(
    `${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${ip} - UA: ${userAgent}`,
  );

  // Log response when finished
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
    );

    // Log suspicious activities
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(
        `SECURITY ALERT: ${res.statusCode} response for ${req.method} ${req.path} from IP: ${ip}`,
      );
    }

    if (duration > 5000) {
      console.warn(
        `SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`,
      );
    }
  });

  next();
};

// Transaction amount validation
export const validateTransactionAmount = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { amount } = req.body;

  if (amount !== undefined) {
    // Check if amount is a valid number
    if (typeof amount !== "number" || isNaN(amount) || !isFinite(amount)) {
      return res.status(400).json({
        success: false,
        error: "Invalid amount format",
      } as ErrorResponse);
    }

    // Check for negative amounts
    if (amount < 0) {
      return res.status(400).json({
        success: false,
        error: "Amount cannot be negative",
      } as ErrorResponse);
    }

    // Check for unreasonably large amounts (₦100 million max)
    if (amount > 100000000) {
      return res.status(400).json({
        success: false,
        error: "Amount exceeds maximum limit",
      } as ErrorResponse);
    }

    // Check for micro amounts (less than 1 kobo)
    if (amount > 0 && amount < 0.01) {
      return res.status(400).json({
        success: false,
        error: "Amount too small",
      } as ErrorResponse);
    }
  }

  next();
};

// Nigerian phone number validation
export const validateNigerianPhone = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { phoneNumber, phone } = req.body;
  const phoneToValidate = phoneNumber || phone;

  if (phoneToValidate) {
    const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
    if (!phoneRegex.test(phoneToValidate)) {
      return res.status(400).json({
        success: false,
        error:
          "Invalid Nigerian phone number format. Expected format: +234XXXXXXXXXX or 0XXXXXXXXXX",
      } as ErrorResponse);
    }
  }

  next();
};

// Email validation
export const validateEmail = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      } as ErrorResponse);
    }

    // Check for disposable email domains (basic list)
    const disposableDomains = [
      "10minutemail.com",
      "tempmail.org",
      "guerrillamail.com",
      "mailinator.com",
      "temp-mail.org",
    ];

    const domain = email.split("@")[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) {
      return res.status(400).json({
        success: false,
        error: "Disposable email addresses are not allowed",
      } as ErrorResponse);
    }
  }

  next();
};

// Password strength validation
export const validatePassword = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { password } = req.body;

  if (password) {
    // Minimum 8 characters
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      } as ErrorResponse);
    }

    // Check for common weak passwords
    const weakPasswords = [
      "password",
      "123456",
      "12345678",
      "qwerty",
      "abc123",
      "password123",
      "admin",
      "letmein",
    ];

    if (weakPasswords.includes(password.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: "Password is too common. Please choose a stronger password",
      } as ErrorResponse);
    }

    // Require at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLetter || !hasNumber) {
      return res.status(400).json({
        success: false,
        error: "Password must contain at least one letter and one number",
      } as ErrorResponse);
    }
  }

  next();
};

// Error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  console.error("Unhandled error:", error);

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === "development";

  res.status(500).json({
    success: false,
    error: "Internal server error",
    ...(isDevelopment && { details: error.message, stack: error.stack }),
  } as ErrorResponse);
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  } as ErrorResponse);
};

// Fraud detection middleware
const suspiciousActivityStore = new Map<
  string,
  {
    loginAttempts: number;
    transactionCount: number;
    lastActivity: number;
    flagged: boolean;
  }
>();

export const fraudDetection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const userId = req.user?.id;
  const identifier = userId || ip;
  const now = Date.now();

  let activity = suspiciousActivityStore.get(identifier);
  if (!activity) {
    activity = {
      loginAttempts: 0,
      transactionCount: 0,
      lastActivity: now,
      flagged: false,
    };
  }

  // Reset counters if more than 1 hour has passed
  if (now - activity.lastActivity > 60 * 60 * 1000) {
    activity.loginAttempts = 0;
    activity.transactionCount = 0;
    activity.flagged = false;
  }

  // Track login attempts
  if (req.path.includes("/auth/login")) {
    activity.loginAttempts++;
    if (activity.loginAttempts > 10) {
      activity.flagged = true;
      console.warn(`FRAUD ALERT: Excessive login attempts from ${identifier}`);
    }
  }

  // Track transaction volume
  if (
    req.path.includes("/wallet/") ||
    req.path.includes("/transfer/") ||
    req.path.includes("/bills/")
  ) {
    activity.transactionCount++;
    if (activity.transactionCount > 50) {
      activity.flagged = true;
      console.warn(
        `FRAUD ALERT: Excessive transaction attempts from ${identifier}`,
      );
    }
  }

  // Block flagged users
  if (activity.flagged) {
    return res.status(429).json({
      success: false,
      error:
        "Account temporarily restricted due to suspicious activity. Please contact support.",
    });
  }

  activity.lastActivity = now;
  suspiciousActivityStore.set(identifier, activity);
  next();
};

// Geolocation validation middleware
export const geoValidation = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // This would integrate with a geolocation service in production
  // For now, we'll just check for common VPN/proxy headers
  const suspiciousHeaders = [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
    "x-cluster-client-ip",
  ];

  const hasSuspiciousHeaders = suspiciousHeaders.some(
    (header) =>
      req.headers[header] && String(req.headers[header]).includes(","),
  );

  if (hasSuspiciousHeaders && req.path.includes("/auth/")) {
    console.warn(`GEO ALERT: Potential proxy/VPN access from ${req.ip}`);
    // Log but don't block in development
  }

  next();
};

// Device fingerprinting middleware
export const deviceFingerprinting = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userAgent = req.get("User-Agent") || "";
  const acceptLanguage = req.get("Accept-Language") || "";
  const acceptEncoding = req.get("Accept-Encoding") || "";

  // Detect suspicious user agents
  const suspiciousPatterns = [
    /curl/i,
    /wget/i,
    /python/i,
    /postman/i,
    /insomnia/i,
  ];

  if (suspiciousPatterns.some((pattern) => pattern.test(userAgent))) {
    console.warn(
      `DEVICE ALERT: Automated tool detected: ${userAgent} from ${req.ip}`,
    );
    // Log but don't block for now
  }

  // Store device fingerprint for future reference
  req.deviceFingerprint = {
    userAgent,
    acceptLanguage,
    acceptEncoding,
    ip: req.ip || "unknown",
  };

  next();
};

// Advanced logging middleware for security events
export const securityLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();
  const ip = req.ip || req.connection.remoteAddress || "unknown";
  const userAgent = req.get("User-Agent") || "unknown";
  const userId = req.user?.id || "anonymous";

  // Log security-sensitive operations
  const sensitiveOperations = [
    "/auth/",
    "/wallet/",
    "/transfer/",
    "/bills/",
    "/kyc/",
    "/admin/",
  ];

  const isSensitive = sensitiveOperations.some((op) => req.path.includes(op));

  if (isSensitive) {
    console.log(
      `SECURITY: ${new Date().toISOString()} - ${req.method} ${req.path} - User: ${userId} - IP: ${ip} - UA: ${userAgent}`,
    );
  }

  res.on("finish", () => {
    const duration = Date.now() - start;

    // Log failed authentication attempts
    if (
      req.path.includes("/auth/") &&
      (res.statusCode === 401 || res.statusCode === 403)
    ) {
      console.warn(
        `AUTH FAILURE: ${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - IP: ${ip} - UA: ${userAgent}`,
      );
    }

    // Log successful high-value transactions
    if (
      req.path.includes("/wallet/") &&
      res.statusCode === 200 &&
      req.body?.amount > 100000
    ) {
      console.log(
        `HIGH VALUE: ${new Date().toISOString()} - ${req.method} ${req.path} - Amount: ₦${req.body.amount} - User: ${userId} - IP: ${ip}`,
      );
    }

    // Log suspicious response times
    if (duration > 10000) {
      console.warn(
        `SLOW RESPONSE: ${req.method} ${req.path} took ${duration}ms - Potential DoS or heavy load`,
      );
    }
  });

  next();
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      deviceFingerprint?: {
        userAgent: string;
        acceptLanguage: string;
        acceptEncoding: string;
        ip: string;
      };
    }
  }
}
