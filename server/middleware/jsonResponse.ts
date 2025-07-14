import { Request, Response, NextFunction } from "express";

// Middleware to ensure API routes always return JSON
export const ensureJsonResponse = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Only apply to API routes
  if (req.path.startsWith("/api/")) {
    // Set JSON content type
    res.setHeader("Content-Type", "application/json");

    // Override res.send to ensure it's always JSON
    const originalSend = res.send;
    res.send = function (data: any) {
      // If data is already a string and looks like HTML, wrap it in JSON error
      if (typeof data === "string" && data.includes("<html")) {
        const errorResponse = {
          success: false,
          error: "Server returned HTML instead of JSON",
          details: "This usually indicates a server configuration issue",
        };
        return originalSend.call(this, JSON.stringify(errorResponse));
      }

      // If data is not already JSON, try to stringify it
      if (typeof data !== "string") {
        try {
          return originalSend.call(this, JSON.stringify(data));
        } catch (error) {
          const errorResponse = {
            success: false,
            error: "Failed to serialize response to JSON",
            details: "Server response could not be converted to JSON",
          };
          return originalSend.call(this, JSON.stringify(errorResponse));
        }
      }

      // Data is already a string, send as-is
      return originalSend.call(this, data);
    };

    // Override res.json to add error handling
    const originalJson = res.json;
    res.json = function (data: any) {
      try {
        return originalJson.call(this, data);
      } catch (error) {
        console.error("JSON serialization error:", error);
        const errorResponse = {
          success: false,
          error: "JSON serialization error",
          details: "Failed to serialize response data",
        };
        return originalJson.call(this, errorResponse);
      }
    };
  }

  next();
};

// Error handler specifically for API routes
export const apiErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Only handle API routes
  if (!req.path.startsWith("/api/")) {
    return next(error);
  }

  console.error("API Error:", {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
  });

  // Ensure JSON content type
  res.setHeader("Content-Type", "application/json");

  // Determine status code
  let statusCode = 500;
  if (error.status || error.statusCode) {
    statusCode = error.status || error.statusCode;
  } else if (error.name === "ValidationError") {
    statusCode = 400;
  } else if (error.name === "UnauthorizedError") {
    statusCode = 401;
  } else if (error.name === "ForbiddenError") {
    statusCode = 403;
  } else if (error.name === "NotFoundError") {
    statusCode = 404;
  }

  // Create error response
  const errorResponse = {
    success: false,
    error: error.message || "Internal server error",
    code: error.code || "UNKNOWN_ERROR",
    ...(process.env.NODE_ENV === "development" && {
      details: error.stack,
      path: req.path,
      method: req.method,
    }),
  };

  res.status(statusCode).json(errorResponse);
};
