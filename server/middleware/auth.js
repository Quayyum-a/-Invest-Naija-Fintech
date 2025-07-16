"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyJWT = exports.generateJWT = exports.requireKYC = exports.requireRole = exports.optionalAuth = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const storage_1 = require("../data/storage");
const env_1 = require("../config/env");
const authenticateToken = (req, res, next) => {
    // Ensure we always return JSON for API routes
    if (req.path.startsWith("/api/")) {
        res.setHeader("Content-Type", "application/json");
    }
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
    if (!token) {
        return res.status(401).json({
            success: false,
            error: "Access token required",
        });
    }
    try {
        // Try JWT first, fallback to session token
        if (token.includes(".")) {
            // This looks like a JWT token
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET || "fallback-secret");
            const user = (0, storage_1.getUserById)(decoded.userId);
            if (!user) {
                return res.status(403).json({
                    success: false,
                    error: "User not found",
                });
            }
            if (user.status !== "active") {
                return res.status(403).json({
                    success: false,
                    error: "Account is suspended",
                });
            }
            req.user = user;
        }
        else {
            // Fallback to session token
            const user = (0, storage_1.getSessionUser)(token);
            if (!user) {
                return res.status(403).json({
                    success: false,
                    error: "Invalid or expired token",
                });
            }
            req.user = user;
        }
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            error: "Invalid or expired token",
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
        try {
            if (token.includes(".")) {
                // JWT token
                const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET || "fallback-secret");
                const user = (0, storage_1.getUserById)(decoded.userId);
                if (user && user.status === "active") {
                    req.user = user;
                }
            }
            else {
                // Session token
                const user = (0, storage_1.getSessionUser)(token);
                if (user) {
                    req.user = user;
                }
            }
        }
        catch (error) {
            // Ignore token errors for optional auth
        }
    }
    next();
};
exports.optionalAuth = optionalAuth;
// Role-based authentication middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Authentication required",
            });
        }
        if (!roles.includes(req.user.role || "user")) {
            return res.status(403).json({
                success: false,
                error: "Insufficient permissions",
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
// KYC verification middleware
const requireKYC = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required",
        });
    }
    if (req.user.kycStatus !== "verified") {
        return res.status(403).json({
            success: false,
            error: "KYC verification required for this operation",
        });
    }
    next();
};
exports.requireKYC = requireKYC;
// Generate JWT token
const generateJWT = (userId, expiresIn = "7d") => {
    return jsonwebtoken_1.default.sign({ userId }, env_1.env.JWT_SECRET || "fallback-secret", {
        expiresIn,
    });
};
exports.generateJWT = generateJWT;
// Verify JWT token
const verifyJWT = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET || "fallback-secret");
    }
    catch (_a) {
        return null;
    }
};
exports.verifyJWT = verifyJWT;
