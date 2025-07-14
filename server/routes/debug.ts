import { RequestHandler } from "express";
import { getUserTransactions } from "../data/storage";

// Debug endpoint to test JSON responses
export const debugTransactions: RequestHandler = (req, res) => {
  try {
    // Always set JSON content type
    res.setHeader("Content-Type", "application/json");

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const transactions = getUserTransactions(userId);

    // Ensure we return valid JSON
    const response = {
      success: true,
      debug: true,
      timestamp: new Date().toISOString(),
      user_id: userId,
      data: {
        transactions: Array.isArray(transactions) ? transactions : [],
        count: Array.isArray(transactions) ? transactions.length : 0,
        sample_transaction:
          transactions && transactions.length > 0 ? transactions[0] : null,
      },
    };

    console.log(
      "Debug transactions response:",
      JSON.stringify(response, null, 2),
    );

    return res.status(200).json(response);
  } catch (error) {
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

// Test endpoint for basic JSON response
export const debugPing: RequestHandler = (req, res) => {
  res.setHeader("Content-Type", "application/json");
  return res.status(200).json({
    success: true,
    message: "Debug ping successful",
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });
};
