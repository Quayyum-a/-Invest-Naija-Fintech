// import { User, UserWallet, Transaction, Investment } from "@shared/api";
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

    -- Social Banking Tables
    CREATE TABLE IF NOT EXISTS social_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      targetAmount REAL NOT NULL,
      currentAmount REAL NOT NULL DEFAULT 0,
      createdBy TEXT NOT NULL,
      endDate TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      category TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS group_members (
      id TEXT PRIMARY KEY,
      groupId TEXT NOT NULL,
      userId TEXT NOT NULL,
      contribution REAL NOT NULL DEFAULT 0,
      joinedAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      FOREIGN KEY (groupId) REFERENCES social_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(groupId, userId)
    );

    CREATE TABLE IF NOT EXISTS money_requests (
      id TEXT PRIMARY KEY,
      fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      dueDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (fromUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (toUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS social_payments (
      id TEXT PRIMARY KEY,
      fromUserId TEXT NOT NULL,
      toUserId TEXT NOT NULL,
      amount REAL NOT NULL,
      message TEXT,
      type TEXT NOT NULL DEFAULT 'payment',
      isPublic BOOLEAN DEFAULT false,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (fromUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (toUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS financial_challenges (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      targetAmount REAL NOT NULL,
      duration INTEGER NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'upcoming',
      category TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS challenge_participants (
      id TEXT PRIMARY KEY,
      challengeId TEXT NOT NULL,
      userId TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      rank INTEGER DEFAULT 0,
      joinedAt TEXT NOT NULL,
      FOREIGN KEY (challengeId) REFERENCES financial_challenges(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(challengeId, userId)
    );

    -- Notification System
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      read BOOLEAN DEFAULT false,
      metadata TEXT,
      createdAt TEXT NOT NULL,
      readAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Crypto Holdings
    CREATE TABLE IF NOT EXISTS crypto_holdings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      averageBuyPrice REAL NOT NULL,
      currentPrice REAL NOT NULL,
      totalInvested REAL NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Business Profiles
    CREATE TABLE IF NOT EXISTS business_profiles (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      businessName TEXT NOT NULL,
      businessType TEXT NOT NULL,
      rcNumber TEXT,
      tin TEXT,
      industry TEXT,
      businessAddress TEXT,
      verificationStatus TEXT DEFAULT 'pending',
      registrationDate TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Cards Management
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      cardNumber TEXT NOT NULL,
      cardType TEXT NOT NULL,
      cardBrand TEXT DEFAULT 'verve',
      expiryMonth INTEGER,
      expiryYear INTEGER,
      status TEXT DEFAULT 'active',
      dailyLimit REAL DEFAULT 500000,
      monthlyLimit REAL DEFAULT 2000000,
      onlineEnabled BOOLEAN DEFAULT true,
      contactlessEnabled BOOLEAN DEFAULT true,
      internationalEnabled BOOLEAN DEFAULT false,
      issuedDate TEXT NOT NULL,
      lastUsed TEXT,
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
}) => {
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

  const user = {
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
): (any & { password: string }) | null => {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return (stmt.get(email) as any) || null;
};

export const getUserById = (userId: string): any | null => {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  const row = stmt.get(userId) as any;
  if (!row) return null;
  const { password, ...user } = row;
  return user;
};

export const updateUser = (
  userId: string,
  updates: Partial<any>,
): any | null => {
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

export const getSessionUser = (token: string): any | null => {
  const stmt = db.prepare("SELECT userId FROM user_sessions WHERE token = ?");
  const session = stmt.get(token) as any;
  return session ? getUserById(session.userId) : null;
};

export const deleteSession = (token: string): boolean => {
  const stmt = db.prepare("DELETE FROM user_sessions WHERE token = ?");
  return stmt.run(token).changes > 0;
};

// Wallet Management
export const getUserWallet = (userId: string): any | null => {
  const stmt = db.prepare("SELECT * FROM wallets WHERE userId = ?");
  return (stmt.get(userId) as any) || null;
};

export const updateWallet = (
  userId: string,
  updates: Partial<Omit<any, "userId">>,
): any | null => {
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
  transactionData: Omit<any, "id" | "createdAt">,
): any => {
  const transactionId = randomUUID();
  const now = new Date().toISOString();
  const transaction = {
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
): any[] => {
  const stmt = db.prepare(
    "SELECT * FROM transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT ?",
  );
  const rows = stmt.all(userId, limit) as any[];
  return rows.map((row) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
  }));
};

export const getTransaction = (transactionId: string): any | null => {
  const stmt = db.prepare("SELECT * FROM transactions WHERE id = ?");
  const row = stmt.get(transactionId) as any;
  return row
    ? { ...row, metadata: row.metadata ? JSON.parse(row.metadata) : undefined }
    : null;
};

export const updateTransaction = (
  transactionId: string,
  updates: Partial<any>,
): any | null => {
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
    any,
    "id" | "createdAt" | "currentValue" | "returns"
  >,
): any => {
  const investmentId = randomUUID();
  const now = new Date().toISOString();
  const investment = {
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

export const getUserInvestments = (userId: string): any[] => {
  const stmt = db.prepare(
    "SELECT * FROM investments WHERE userId = ? ORDER BY createdAt DESC",
  );
  return stmt.all(userId) as any[];
};

export const updateInvestment = (
  investmentId: string,
  updates: Partial<any>,
): any | null => {
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
export const getAllUsers = (): any[] => {
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

// Social Banking Functions
export const createSocialGroup = (groupData: {
  name: string;
  description?: string;
  targetAmount: number;
  createdBy: string;
  endDate?: string;
  category?: string;
}) => {
  const groupId = randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO social_groups (id, name, description, targetAmount, createdBy, endDate, category, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    groupId,
    groupData.name,
    groupData.description || "",
    groupData.targetAmount,
    groupData.createdBy,
    groupData.endDate || "",
    groupData.category || "general",
    now,
  );

  // Add creator as first member
  const memberStmt = db.prepare(`
    INSERT INTO group_members (id, groupId, userId, joinedAt)
    VALUES (?, ?, ?, ?)
  `);
  memberStmt.run(randomUUID(), groupId, groupData.createdBy, now);

  return {
    id: groupId,
    ...groupData,
    currentAmount: 0,
    status: "active",
    createdAt: now,
  };
};

export const getUserSocialGroups = (userId: string) => {
  const stmt = db.prepare(`
    SELECT sg.*,
           COUNT(gm.id) as memberCount,
           SUM(gm.contribution) as totalContributions
    FROM social_groups sg
    LEFT JOIN group_members gm ON sg.id = gm.groupId
    WHERE sg.id IN (
      SELECT groupId FROM group_members WHERE userId = ? AND status = 'active'
    )
    GROUP BY sg.id
    ORDER BY sg.createdAt DESC
  `);
  return stmt.all(userId) as any[];
};

export const getGroupMembers = (groupId: string) => {
  const stmt = db.prepare(`
    SELECT gm.*, u.firstName, u.lastName, u.email
    FROM group_members gm
    JOIN users u ON gm.userId = u.id
    WHERE gm.groupId = ? AND gm.status = 'active'
    ORDER BY gm.contribution DESC
  `);
  return stmt.all(groupId) as any[];
};

export const createMoneyRequest = (requestData: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  reason: string;
  dueDate?: string;
}) => {
  const requestId = randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO money_requests (id, fromUserId, toUserId, amount, reason, dueDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    requestId,
    requestData.fromUserId,
    requestData.toUserId,
    requestData.amount,
    requestData.reason,
    requestData.dueDate || "",
    now,
    now,
  );

  return {
    id: requestId,
    ...requestData,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
};

export const getUserMoneyRequests = (userId: string) => {
  const stmt = db.prepare(`
    SELECT mr.*,
           uf.firstName as fromFirstName, uf.lastName as fromLastName,
           ut.firstName as toFirstName, ut.lastName as toLastName
    FROM money_requests mr
    JOIN users uf ON mr.fromUserId = uf.id
    JOIN users ut ON mr.toUserId = ut.id
    WHERE mr.fromUserId = ? OR mr.toUserId = ?
    ORDER BY mr.createdAt DESC
  `);
  return stmt.all(userId, userId) as any[];
};

export const createSocialPayment = (paymentData: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  message?: string;
  type: string;
  isPublic?: boolean;
}) => {
  const paymentId = randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO social_payments (id, fromUserId, toUserId, amount, message, type, isPublic, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    paymentId,
    paymentData.fromUserId,
    paymentData.toUserId,
    paymentData.amount,
    paymentData.message || "",
    paymentData.type,
    paymentData.isPublic || false,
    now,
  );

  return { id: paymentId, ...paymentData, createdAt: now };
};

export const getUserSocialPayments = (userId: string) => {
  const stmt = db.prepare(`
    SELECT sp.*,
           uf.firstName as fromFirstName, uf.lastName as fromLastName,
           ut.firstName as toFirstName, ut.lastName as toLastName
    FROM social_payments sp
    JOIN users uf ON sp.fromUserId = uf.id
    JOIN users ut ON sp.toUserId = ut.id
    WHERE sp.fromUserId = ? OR sp.toUserId = ? OR sp.isPublic = true
    ORDER BY sp.createdAt DESC
    LIMIT 50
  `);
  return stmt.all(userId, userId) as any[];
};

export const getFinancialChallenges = () => {
  const stmt = db.prepare(`
    SELECT fc.*, COUNT(cp.id) as participantCount
    FROM financial_challenges fc
    LEFT JOIN challenge_participants cp ON fc.id = cp.challengeId
    GROUP BY fc.id
    ORDER BY fc.createdAt DESC
  `);
  return stmt.all() as any[];
};

export const getChallengeParticipants = (challengeId: string) => {
  const stmt = db.prepare(`
    SELECT cp.*, u.firstName, u.lastName
    FROM challenge_participants cp
    JOIN users u ON cp.userId = u.id
    WHERE cp.challengeId = ?
    ORDER BY cp.progress DESC, cp.joinedAt ASC
  `);
  return stmt.all(challengeId) as any[];
};

// Notification Functions
export const createNotification = (notificationData: {
  userId: string;
  title: string;
  message: string;
  type: string;
  priority?: string;
  metadata?: any;
}) => {
  const notificationId = randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO notifications (id, userId, title, message, type, priority, metadata, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    notificationId,
    notificationData.userId,
    notificationData.title,
    notificationData.message,
    notificationData.type,
    notificationData.priority || "normal",
    notificationData.metadata
      ? JSON.stringify(notificationData.metadata)
      : null,
    now,
  );

  return {
    id: notificationId,
    ...notificationData,
    read: false,
    createdAt: now,
  };
};

export const getUserNotificationsFromDB = (
  userId: string,
  limit: number = 50,
  unreadOnly: boolean = false,
) => {
  const whereClause = unreadOnly
    ? "WHERE userId = ? AND read = false"
    : "WHERE userId = ?";
  const stmt = db.prepare(`
    SELECT * FROM notifications
    ${whereClause}
    ORDER BY createdAt DESC
    LIMIT ?
  `);

  const notifications = stmt.all(userId, limit) as any[];
  return notifications.map((n) => ({
    ...n,
    metadata: n.metadata ? JSON.parse(n.metadata) : undefined,
  }));
};

// Initialize sample data
export const createSampleChallenges = () => {
  const challenges = [
    {
      id: randomUUID(),
      title: "30-Day Savings Challenge",
      description: "Save ₦1,000 more each day for 30 days",
      targetAmount: 30000,
      duration: 30,
      startDate: "2024-12-01",
      endDate: "2024-12-31",
      status: "active",
      category: "savings",
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      title: "Investment Growth Challenge",
      description: "Invest ₦50,000 and track your returns over 3 months",
      targetAmount: 50000,
      duration: 90,
      startDate: "2024-12-01",
      endDate: "2025-03-01",
      status: "active",
      category: "investment",
      createdAt: new Date().toISOString(),
    },
    {
      id: randomUUID(),
      title: "Zero Spending Week",
      description:
        "Challenge yourself to spend only on essentials for one week",
      targetAmount: 0,
      duration: 7,
      startDate: "2024-12-16",
      endDate: "2024-12-23",
      status: "upcoming",
      category: "spending",
      createdAt: new Date().toISOString(),
    },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO financial_challenges
    (id, title, description, targetAmount, duration, startDate, endDate, status, category, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  challenges.forEach((challenge) => {
    stmt.run(
      challenge.id,
      challenge.title,
      challenge.description,
      challenge.targetAmount,
      challenge.duration,
      challenge.startDate,
      challenge.endDate,
      challenge.status,
      challenge.category,
      challenge.createdAt,
    );
  });

  console.log("✅ Sample financial challenges created");
};
