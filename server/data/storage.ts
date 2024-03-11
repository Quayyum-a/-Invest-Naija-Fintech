import { User, UserWallet, Transaction, Investment } from "@shared/api";
import { randomUUID } from "crypto";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Initialize SQLite database
const ensureDataDir = () => {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
};

const initDB = () => {
  const dataDir = ensureDataDir();
  const dbPath = path.join(dataDir, "investnaija.db");

  console.log("🗄️  Initializing SQLite database at:", dbPath);

  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone TEXT NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      bvn TEXT,
      nin TEXT,
      kycStatus TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'active',
      role TEXT NOT NULL DEFAULT 'user',
      lastLogin TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wallets (
      userId TEXT PRIMARY KEY,
      balance REAL NOT NULL DEFAULT 0,
      totalInvested REAL NOT NULL DEFAULT 0,
      totalReturns REAL NOT NULL DEFAULT 0,
      lastUpdated TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      metadata TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currentValue REAL NOT NULL,
      returns REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  console.log("✅ Database schema initialized");
  return db;
};

const db = initDB();

// User Management Functions
export const createUser = (userData: {
  email: string;
  password: string;
  phone: string;
  firstName: string;
  lastName: string;
  role?: "user" | "admin" | "super_admin";
}): User => {
  const userId = randomUUID();
  const now = new Date().toISOString();

  // Determine role based on email or provided role
  const userRole =
    userData.role ||
    (userData.email.endsWith("@admin.investnaija.com")
      ? "super_admin"
      : userData.email.endsWith("@investnaija.com")
        ? "admin"
        : "user");

  const user: User = {
    id: userId,
    email: userData.email,
    phone: userData.phone,
    firstName: userData.firstName,
    lastName: userData.lastName,
    kycStatus: "pending",
    status: "active",
    role: userRole,
    createdAt: now,
  };

  try {
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password, phone, firstName, lastName, kycStatus, status, role, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertUser.run(
      userId,
      userData.email,
      userData.password,
      userData.phone,
      userData.firstName,
      userData.lastName,
      "pending",
      "active",
      userRole,
      now,
    );

    const insertWallet = db.prepare(`
      INSERT INTO wallets (userId, balance, totalInvested, totalReturns, lastUpdated)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertWallet.run(userId, 0, 0, 0, now);

    return user;
  } catch (error) {
    throw new Error(`Failed to create user: ${error}`);
  }
};

export const getUserByEmail = (
  email: string,
): (User & { password: string }) | null => {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return (stmt.get(email) as any) || null;
};

export const getUserById = (userId: string): User | null => {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  const row = stmt.get(userId) as any;
  if (!row) return null;
  const { password, ...user } = row;
  return user;
};

export const updateUser = (
  userId: string,
  updates: Partial<User>,
): User | null => {
  const current = getUserById(userId);
  if (!current) return null;

  const updated = { ...current, ...updates };
  const stmt = db.prepare(`
    UPDATE users SET email = ?, phone = ?, firstName = ?, lastName = ?,
    bvn = ?, nin = ?, kycStatus = ?, status = ?, lastLogin = ? WHERE id = ?
  `);
  stmt.run(
    updated.email,
    updated.phone,
    updated.firstName,
    updated.lastName,
    updated.bvn || null,
    updated.nin || null,
    updated.kycStatus,
    updated.status,
    updated.lastLogin || null,
    userId,
  );
  return updated;
};

// Session Management
export const createSession = (userId: string): string => {
  const token = randomUUID();
  const now = new Date().toISOString();

  const insertSession = db.prepare(
    "INSERT INTO user_sessions (token, userId, createdAt) VALUES (?, ?, ?)",
  );
  insertSession.run(token, userId, now);

  const updateLogin = db.prepare("UPDATE users SET lastLogin = ? WHERE id = ?");
  updateLogin.run(now, userId);

  return token;
};

export const getSessionUser = (token: string): User | null => {
  const stmt = db.prepare("SELECT userId FROM user_sessions WHERE token = ?");
  const session = stmt.get(token) as any;
  return session ? getUserById(session.userId) : null;
};

export const deleteSession = (token: string): boolean => {
  const stmt = db.prepare("DELETE FROM user_sessions WHERE token = ?");
  return stmt.run(token).changes > 0;
};

// Wallet Management
export const getUserWallet = (userId: string): UserWallet | null => {
  const stmt = db.prepare("SELECT * FROM wallets WHERE userId = ?");
  return (stmt.get(userId) as any) || null;
};

export const updateWallet = (
  userId: string,
  updates: Partial<Omit<UserWallet, "userId">>,
): UserWallet | null => {
  const current = getUserWallet(userId);
  if (!current) return null;

  const updated = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString(),
  };
  const stmt = db.prepare(
    "UPDATE wallets SET balance = ?, totalInvested = ?, totalReturns = ?, lastUpdated = ? WHERE userId = ?",
  );
  stmt.run(
    updated.balance,
    updated.totalInvested,
    updated.totalReturns,
    updated.lastUpdated,
    userId,
  );
  return updated;
};

// Transaction Management
export const createTransaction = (
  transactionData: Omit<Transaction, "id" | "createdAt">,
): Transaction => {
  const transactionId = randomUUID();
  const now = new Date().toISOString();
  const transaction: Transaction = {
    ...transactionData,
    id: transactionId,
    createdAt: now,
  };

  const stmt = db.prepare(`
    INSERT INTO transactions (id, userId, type, amount, description, status, metadata, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    transactionId,
    transactionData.userId,
    transactionData.type,
    transactionData.amount,
    transactionData.description,
    transactionData.status,
    transactionData.metadata ? JSON.stringify(transactionData.metadata) : null,
    now,
  );

  return transaction;
};

export const getUserTransactions = (
  userId: string,
  limit: number = 50,
): Transaction[] => {
  const stmt = db.prepare(
    "SELECT * FROM transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT ?",
  );
  const rows = stmt.all(userId, limit) as any[];
  return rows.map((row) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
};

export const getTransaction = (transactionId: string): Transaction | null => {
  const stmt = db.prepare("SELECT * FROM transactions WHERE id = ?");
  const row = stmt.get(transactionId) as any;
  return row
    ? { ...row, metadata: row.metadata ? JSON.parse(row.metadata) : undefined }
    : null;
};

export const updateTransaction = (
  transactionId: string,
  updates: Partial<Transaction>,
): Transaction | null => {
  const current = getTransaction(transactionId);
  if (!current) return null;

  const updated = { ...current, ...updates };
  const stmt = db.prepare(
    "UPDATE transactions SET type = ?, amount = ?, description = ?, status = ?, metadata = ? WHERE id = ?",
  );
  stmt.run(
    updated.type,
    updated.amount,
    updated.description,
    updated.status,
    updated.metadata ? JSON.stringify(updated.metadata) : null,
    transactionId,
  );
  return updated;
};

// Investment Management
export const createInvestment = (
  investmentData: Omit<
    Investment,
    "id" | "createdAt" | "currentValue" | "returns"
  >,
): Investment => {
  const investmentId = randomUUID();
  const now = new Date().toISOString();
  const investment: Investment = {
    ...investmentData,
    id: investmentId,
    currentValue: investmentData.amount,
    returns: 0,
    createdAt: now,
  };

  const stmt = db.prepare(`
    INSERT INTO investments (id, userId, type, amount, currentValue, returns, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    investmentId,
    investmentData.userId,
    investmentData.type,
    investmentData.amount,
    investment.currentValue,
    investment.returns,
    investmentData.status,
    now,
  );

  return investment;
};

export const getUserInvestments = (userId: string): Investment[] => {
  const stmt = db.prepare(
    "SELECT * FROM investments WHERE userId = ? ORDER BY createdAt DESC",
  );
  return stmt.all(userId) as any[];
};

export const updateInvestment = (
  investmentId: string,
  updates: Partial<Investment>,
): Investment | null => {
  const stmt = db.prepare("SELECT * FROM investments WHERE id = ?");
  const current = stmt.get(investmentId) as any;
  if (!current) return null;

  const updated = { ...current, ...updates };
  const updateStmt = db.prepare(
    "UPDATE investments SET type = ?, amount = ?, currentValue = ?, returns = ?, status = ? WHERE id = ?",
  );
  updateStmt.run(
    updated.type,
    updated.amount,
    updated.currentValue,
    updated.returns,
    updated.status,
    investmentId,
  );
  return updated;
};

// Utility Functions
export const getAllUsers = (): User[] => {
  const stmt = db.prepare("SELECT * FROM users");
  const rows = stmt.all() as any[];
  return rows.map(({ password, ...user }) => user);
};

export const getUserCount = (): number => {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM users");
  const result = stmt.get() as any;
  return result.count || 0;
};

export const getTotalAUM = (): number => {
  const stmt = db.prepare("SELECT SUM(totalInvested) as total FROM wallets");
  const result = stmt.get() as any;
  return result.total || 0;
};

export const getActiveInvestmentCount = (): number => {
  const stmt = db.prepare(
    "SELECT COUNT(*) as count FROM investments WHERE status = 'active'",
  );
  const result = stmt.get() as any;
  return result.count || 0;
};

export const getPendingKYCCount = (): number => {
  const stmt = db.prepare(
    "SELECT COUNT(*) as count FROM users WHERE kycStatus = 'pending'",
  );
  const result = stmt.get() as any;
  return result.count || 0;
};
