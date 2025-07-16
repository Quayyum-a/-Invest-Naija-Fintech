"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debugPing = exports.debugTransactions = void 0;
const storage_1 = require("../data/storage");
// Debug endpoint to test JSON responses
const debugTransactions = (req, res) => {
    var _a;
    try {
        // Always set JSON content type
        res.setHeader("Content-Type", "application/json");
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: "User not authenticated",
            });
        }
        const transactions = (0, storage_1.getUserTransactions)(userId);
        // Ensure we return valid JSON
        const response = {
            success: true,
            debug: true,
            timestamp: new Date().toISOString(),
            user_id: userId,
            data: {
                transactions: Array.isArray(transactions) ? transactions : [],
                count: Array.isArray(transactions) ? transactions.length : 0,
                sample_transaction: transactions && transactions.length > 0 ? transactions[0] : null,
            },
        };
        console.log("Debug transactions response:", JSON.stringify(response, null, 2));
        return res.status(200).json(response);
    }
    catch (error) {
        console.error("Debug transactions error:", error);
        res.setHeader("Content-Type", "application/json");
        return res.status(500).json({
            success: false,
            error: "Internal server error",
            debug: true,
            details: error instanceof Error ? error.message : String(error),
        });
    }
};
exports.debugTransactions = debugTransactions;
// Test endpoint for basic JSON response
const debugPing = (req, res) => {
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({
        success: true,
        message: "Debug ping successful",
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
    });
};
exports.debugPing = debugPing;
