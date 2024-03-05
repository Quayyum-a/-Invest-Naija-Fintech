import { RequestHandler } from "express";
import { ErrorResponse } from "@shared/api";

// In-memory OTP storage (use Redis in production)
const otpStorage = new Map<
  string,
  { code: string; expiresAt: number; verified: boolean; attempts: number }
>();

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via SMS with Termii integration (fallback to console)
const sendSMS = async (
  phoneNumber: string,
  message: string,
): Promise<boolean> => {
  try {
    const termiiApiKey = process.env.TERMII_API_KEY;
    const senderId = process.env.TERMII_SENDER_ID || "InvestNaija";

    // If Termii API key is available, use real SMS
    if (termiiApiKey) {
      const response = await fetch("https://api.ng.termii.com/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: phoneNumber,
          from: senderId,
          sms: message,
          type: "plain",
          channel: "generic",
          api_key: termiiApiKey,
        }),
      });

      const result = await response.json();

      if (response.ok && result.message_id) {
        console.log(
          `[TERMII SMS] Successfully sent to ${phoneNumber}, ID: ${result.message_id}`,
        );
        return true;
      } else {
        console.error("[TERMII SMS] Failed:", result);
        return false;
      }
    }

    // Fallback: Log SMS for development
    console.log(`[DEV SMS] From ${senderId} to ${phoneNumber}: ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 500));

    return true;
  } catch (error) {
    console.error("SMS sending failed:", error);
    return false;
  }
};

// Send OTP via Email (mock implementation)
const sendEmail = async (
  email: string,
  subject: string,
  message: string,
): Promise<boolean> => {
  // In production, integrate with SendGrid
  console.log(`Email to ${email}: ${subject} - ${message}`);

  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 98% success rate simulation
  return Math.random() > 0.02;
};

export const sendOTP: RequestHandler = async (req, res) => {
  try {
    const { phoneNumber, email, type = "registration" } = req.body;

    if (!phoneNumber && !email) {
      return res.status(400).json({
        success: false,
        error: "Phone number or email is required",
      } as ErrorResponse);
    }

    // Validate Nigerian phone number if provided
    if (phoneNumber) {
      const phoneRegex = /^(\+234|234|0)[789][01]\d{8}$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({
          success: false,
          error: "Invalid Nigerian phone number format",
        } as ErrorResponse);
      }
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    const identifier = phoneNumber || email;

    // Check for rate limiting (max 3 OTPs per hour)
    const existingOTP = otpStorage.get(identifier);
    if (existingOTP && existingOTP.attempts >= 3) {
      const timeSinceLastAttempt =
        Date.now() - (existingOTP.expiresAt - 10 * 60 * 1000);
      if (timeSinceLastAttempt < 60 * 60 * 1000) {
        // 1 hour
        return res.status(429).json({
          success: false,
          error: "Too many OTP requests. Please try again in 1 hour.",
        } as ErrorResponse);
      }
    }

    // Store OTP
    otpStorage.set(identifier, {
      code: otpCode,
      expiresAt,
      verified: false,
      attempts: (existingOTP?.attempts || 0) + 1,
    });

    // Send OTP
    let sent = false;
    if (phoneNumber) {
      const message = `Your InvestNaija verification code is: ${otpCode}. Valid for 10 minutes. Do not share this code.`;
      sent = await sendSMS(phoneNumber, message);
    } else if (email) {
      const subject = "InvestNaija Verification Code";
      const message = `Your verification code is: ${otpCode}. This code expires in 10 minutes. For security, do not share this code with anyone.`;
      sent = await sendEmail(email, subject, message);
    }

    if (!sent) {
      return res.status(500).json({
        success: false,
        error: "Failed to send verification code. Please try again.",
      } as ErrorResponse);
    }

    res.json({
      success: true,
      message: `Verification code sent to ${phoneNumber ? "your phone" : "your email"}`,
      expiresIn: 600, // 10 minutes in seconds
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const verifyOTP: RequestHandler = async (req, res) => {
  try {
    const { phoneNumber, email, code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: "Verification code is required",
      } as ErrorResponse);
    }

    if (!phoneNumber && !email) {
      return res.status(400).json({
        success: false,
        error: "Phone number or email is required",
      } as ErrorResponse);
    }

    const identifier = phoneNumber || email;
    const storedOTP = otpStorage.get(identifier);

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        error: "No verification code found. Please request a new one.",
      } as ErrorResponse);
    }

    // Check if OTP has expired
    if (Date.now() > storedOTP.expiresAt) {
      otpStorage.delete(identifier);
      return res.status(400).json({
        success: false,
        error: "Verification code has expired. Please request a new one.",
      } as ErrorResponse);
    }

    // Check if OTP is correct
    if (storedOTP.code !== code) {
      return res.status(400).json({
        success: false,
        error: "Invalid verification code. Please check and try again.",
      } as ErrorResponse);
    }

    // Mark as verified
    storedOTP.verified = true;
    otpStorage.set(identifier, storedOTP);

    res.json({
      success: true,
      message: "Verification successful",
      verified: true,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const checkOTPStatus: RequestHandler = async (req, res) => {
  try {
    const { phoneNumber, email } = req.query;

    if (!phoneNumber && !email) {
      return res.status(400).json({
        success: false,
        error: "Phone number or email is required",
      } as ErrorResponse);
    }

    const identifier = (phoneNumber || email) as string;
    const storedOTP = otpStorage.get(identifier);

    if (!storedOTP) {
      return res.json({
        success: true,
        verified: false,
        message: "No verification record found",
      });
    }

    const isExpired = Date.now() > storedOTP.expiresAt;
    const isVerified = storedOTP.verified && !isExpired;

    res.json({
      success: true,
      verified: isVerified,
      expired: isExpired,
      attemptsRemaining: Math.max(0, 3 - storedOTP.attempts),
    });
  } catch (error) {
    console.error("Check OTP status error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

// Clean up expired OTPs (call this periodically)
export const cleanupExpiredOTPs = () => {
  const now = Date.now();
  for (const [identifier, otp] of otpStorage.entries()) {
    if (now > otp.expiresAt) {
      otpStorage.delete(identifier);
    }
  }
};

// Run cleanup every 15 minutes
setInterval(cleanupExpiredOTPs, 15 * 60 * 1000);
