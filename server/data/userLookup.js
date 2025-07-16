"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.canReceiveMoney = exports.getUserDisplayName = exports.validateRecipient = exports.searchUsers = exports.getUserByEmailOrPhone = exports.getUserByPhone = void 0;
const storage_1 = require("./storage");
// Enhanced user lookup functions for production use
const getUserByPhone = (phone) => {
    try {
        const { db } = require("./storage");
        // Normalize phone number for search
        const normalizedPhone = normalizePhoneNumber(phone);
        const stmt = db.prepare("SELECT * FROM users WHERE phone = ? OR phone = ?");
        const user = stmt.get(phone, normalizedPhone);
        // Remove password from response
        if (user) {
            const { password } = user, userWithoutPassword = __rest(user, ["password"]);
            return userWithoutPassword;
        }
        return null;
    }
    catch (error) {
        console.error("Error looking up user by phone:", error);
        return null;
    }
};
exports.getUserByPhone = getUserByPhone;
const getUserByEmailOrPhone = (identifier) => {
    try {
        // First try email lookup
        const userByEmail = (0, storage_1.getUserByEmail)(identifier);
        if (userByEmail) {
            return userByEmail;
        }
        // Then try phone lookup
        const userByPhone = (0, exports.getUserByPhone)(identifier);
        if (userByPhone) {
            return userByPhone;
        }
        return null;
    }
    catch (error) {
        console.error("Error looking up user by email or phone:", error);
        return null;
    }
};
exports.getUserByEmailOrPhone = getUserByEmailOrPhone;
const searchUsers = (query, limit = 10) => {
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
        const users = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm, limit);
        return users;
    }
    catch (error) {
        console.error("Error searching users:", error);
        return [];
    }
};
exports.searchUsers = searchUsers;
const validateRecipient = (identifier) => {
    try {
        // Check if identifier is email or phone
        const isEmail = identifier.includes("@");
        const isPhone = /^(\+234|234|0)?[789][01]\d{8}$/.test(identifier.replace(/\s+/g, ""));
        if (!isEmail && !isPhone) {
            return {
                valid: false,
                error: "Please enter a valid email address or Nigerian phone number",
            };
        }
        const user = (0, exports.getUserByEmailOrPhone)(identifier);
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
    }
    catch (error) {
        console.error("Error validating recipient:", error);
        return {
            valid: false,
            error: "Failed to validate recipient",
        };
    }
};
exports.validateRecipient = validateRecipient;
// Helper function to normalize Nigerian phone numbers
const normalizePhoneNumber = (phone) => {
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
const getUserDisplayName = (user) => {
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
        return user.firstName;
    }
    return user.email.split("@")[0];
};
exports.getUserDisplayName = getUserDisplayName;
// Check if user can receive money (KYC and limits)
const canReceiveMoney = (user, amount) => {
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
                reason: "Recipient needs KYC verification to receive amounts above ₦50,000",
            };
        }
        return { canReceive: true };
    }
    catch (error) {
        console.error("Error checking if user can receive money:", error);
        return {
            canReceive: false,
            reason: "Failed to verify recipient eligibility",
        };
    }
};
exports.canReceiveMoney = canReceiveMoney;
