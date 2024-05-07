import { RequestHandler } from "express";
import bcrypt from "bcryptjs";
import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  ErrorResponse,
} from "@shared/api";
import {
  createUser,
  getUserByEmail,
  createSession,
  deleteSession,
  getSessionUser,
} from "../data/storage";

// Proper password hashing with bcrypt
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

export const register: RequestHandler = async (req, res) => {
  try {
    const { email, password, phone, firstName, lastName }: RegisterRequest =
      req.body;

    // Validation
    if (!email || !password || !phone || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: "All fields are required",
      } as ErrorResponse);
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      } as ErrorResponse);
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return res.status(400).json({
        success: false,
        error:
          "Password must contain uppercase letters, lowercase letters, and numbers",
      } as ErrorResponse);
    }

    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "User with this email already exists",
      } as ErrorResponse);
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const user = createUser({
      email,
      password: hashedPassword,
      phone,
      firstName,
      lastName,
    });

    // Create session
    const token = createSession(user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
      token,
    } as AuthResponse);
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required",
      } as ErrorResponse);
    }

    // Find user
    const user = getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      } as ErrorResponse);
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      } as ErrorResponse);
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        error: "Account is suspended",
      } as ErrorResponse);
    }

    // Create session
    const token = createSession(user.id);
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    } as AuthResponse);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const logout: RequestHandler = (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      deleteSession(token);
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};

export const getCurrentUser: RequestHandler = (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      } as ErrorResponse);
    }

    const user = getSessionUser(token);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid token",
      } as ErrorResponse);
    }

    res.json({
      success: true,
      user,
    } as AuthResponse);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    } as ErrorResponse);
  }
};
// Commit 20 - 1752188002
// Commit 22 - 1752188002
// Commit 36 - 1752188003
// Commit 43 - 1752188004
// Commit 45 - 1752188004
// Commit 56 - 1752188005
// Commit 57 - 1752188005
