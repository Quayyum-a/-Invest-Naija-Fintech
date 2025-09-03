import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getSessionUserAsync as getSessionUser, getUserByIdAsync as getUserById } from "../data/storage";
import { User } from "@shared/api";
import { env } from "../config/env";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
      const decoded = jwt.verify(
        token,
        env.JWT_SECRET || "fallback-secret",
      ) as any;
      const user = await getUserById(decoded.userId);

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
    } else {
      // Fallback to session token
      const user = await getSessionUser(token);
      if (!user) {
        return res.status(403).json({
          success: false,
          error: "Invalid or expired token",
        });
      }
      req.user = user;
    }

    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    try {
      if (token.includes(".")) {
        // JWT token
        const decoded = jwt.verify(
          token,
          env.JWT_SECRET || "fallback-secret",
        ) as any;
        const user = await getUserById(decoded.userId);
        if (user && user.status === "active") {
          req.user = user;
        }
      } else {
        // Session token
        const user = await getSessionUser(token);
        if (user) {
          req.user = user;
        }
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  next();
};

// Role-based authentication middleware
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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

// KYC verification middleware
export const requireKYC = (req: Request, res: Response, next: NextFunction) => {
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

// Generate JWT token
export const generateJWT = (
  userId: string,
  expiresIn: string = "7d",
): string => {
  return jwt.sign({ userId }, env.JWT_SECRET || "fallback-secret", {
    expiresIn,
  });
};

// Verify JWT token
export const verifyJWT = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET || "fallback-secret") as {
      userId: string;
    };
  } catch {
    return null;
  }
};
