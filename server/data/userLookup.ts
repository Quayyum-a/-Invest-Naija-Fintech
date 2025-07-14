import { getUserByEmail, getUserById } from "./storage";
import { User } from "@shared/api";

// Enhanced user lookup functions for production use
export const getUserByPhone = (phone: string): User | null => {
  try {
    const { db } = require("./storage");

    // Normalize phone number for search
    const normalizedPhone = normalizePhoneNumber(phone);

    const stmt = db.prepare("SELECT * FROM users WHERE phone = ? OR phone = ?");
    const user = stmt.get(phone, normalizedPhone) as User | null;

    // Remove password from response
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }

    return null;
  } catch (error) {
    console.error("Error looking up user by phone:", error);
    return null;
  }
};

export const getUserByEmailOrPhone = (identifier: string): User | null => {
  try {
    // First try email lookup
    const userByEmail = getUserByEmail(identifier);
    if (userByEmail) {
      return userByEmail;
    }

    // Then try phone lookup
    const userByPhone = getUserByPhone(identifier);
    if (userByPhone) {
      return userByPhone;
    }

    return null;
  } catch (error) {
    console.error("Error looking up user by email or phone:", error);
    return null;
  }
};

export const searchUsers = (query: string, limit: number = 10): User[] => {
  try {
    const { db } = require("./storage");

    const stmt = db.prepare(`
      SELECT id, email, phone, firstName, lastName, kycStatus, status, createdAt 
      FROM users 
      WHERE (
        email LIKE ? OR 
        phone LIKE ? OR 
        firstName LIKE ? OR 
        lastName LIKE ?
      ) AND status = 'active'
      LIMIT ?
    `);

    const searchTerm = `%${query}%`;
    const users = stmt.all(
      searchTerm,
      searchTerm,
      searchTerm,
      searchTerm,
      limit,
    ) as User[];

    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
};

export const validateRecipient = (
  identifier: string,
): {
  valid: boolean;
  user?: User;
  error?: string;
} => {
  try {
    // Check if identifier is email or phone
    const isEmail = identifier.includes("@");
    const isPhone = /^(\+234|234|0)?[789][01]\d{8}$/.test(
      identifier.replace(/\s+/g, ""),
    );

    if (!isEmail && !isPhone) {
      return {
        valid: false,
        error: "Please enter a valid email address or Nigerian phone number",
      };
    }

    const user = getUserByEmailOrPhone(identifier);

    if (!user) {
      return {
        valid: false,
        error: "Recipient not found. Please check the email or phone number.",
      };
    }

    if (user.status !== "active") {
      return {
        valid: false,
        error: "Recipient account is not active",
      };
    }

    return {
      valid: true,
      user,
    };
  } catch (error) {
    console.error("Error validating recipient:", error);
    return {
      valid: false,
      error: "Failed to validate recipient",
    };
  }
};

// Helper function to normalize Nigerian phone numbers
const normalizePhoneNumber = (phone: string): string => {
  // Remove all spaces and special characters
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");

  // Convert to +234 format
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
};

// Get user's display name for transfers and social features
export const getUserDisplayName = (user: User): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  if (user.firstName) {
    return user.firstName;
  }
  return user.email.split("@")[0];
};

// Check if user can receive money (KYC and limits)
export const canReceiveMoney = (
  user: User,
  amount: number,
): {
  canReceive: boolean;
  reason?: string;
} => {
  try {
    if (user.status !== "active") {
      return {
        canReceive: false,
        reason: "Recipient account is not active",
      };
    }

    // For unverified users, limit receiving to ₦50,000 per transaction
    if (user.kycStatus !== "verified" && amount > 50000) {
      return {
        canReceive: false,
        reason:
          "Recipient needs KYC verification to receive amounts above ₦50,000",
      };
    }

    return { canReceive: true };
  } catch (error) {
    console.error("Error checking if user can receive money:", error);
    return {
      canReceive: false,
      reason: "Failed to verify recipient eligibility",
    };
  }
};
