import { Request, Response, NextFunction } from "express";
import { getSessionUser } from "../data/storage";
import { User } from "@shared/api";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export const authenticateToken = (
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

  const user = getSessionUser(token);
  if (!user) {
    return res.status(403).json({
      success: false,
      error: "Invalid or expired token",
    });
  }

  req.user = user;
  next();
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token) {
    const user = getSessionUser(token);
    if (user) {
      req.user = user;
    }
  }

  next();
};
