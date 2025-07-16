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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSampleChallenges = exports.getUserNotificationsFromDB = exports.createNotification = exports.getChallengeParticipants = exports.getFinancialChallenges = exports.getUserSocialPayments = exports.createSocialPayment = exports.getUserMoneyRequests = exports.createMoneyRequest = exports.getGroupMembers = exports.getUserSocialGroups = exports.createSocialGroup = exports.getPendingKYCCount = exports.getActiveInvestmentCount = exports.getTotalAUM = exports.getUserCount = exports.getAllUsers = exports.updateInvestment = exports.getUserInvestments = exports.createInvestment = exports.updateTransaction = exports.getTransaction = exports.getUserTransactions = exports.createTransaction = exports.updateWallet = exports.getUserWallet = exports.deleteSession = exports.getSessionUser = exports.createSession = exports.updateUser = exports.getUserById = exports.getUserByEmail = exports.createUser = void 0;
const crypto_1 = require("crypto");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Initialize SQLite database
const ensureDataDir = () => {
    const dataDir = path_1.default.join(process.cwd(), "data");
    if (!fs_1.default.existsSync(dataDir)) {
        fs_1.default.mkdirSync(dataDir, { recursive: true });
    }
    return dataDir;
};
const initDB = () => {
    const dataDir = ensureDataDir();
    const dbPath = path_1.default.join(dataDir, "investnaija.db");
    console.log("🗄️  Initializing SQLite database at:", dbPath);
    const db = new better_sqlite3_1.default(dbPath);
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
const createUser = (userData) => {
    const userId = (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    // Determine role based on email or provided role
    const userRole = userData.role ||
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
        insertUser.run(userId, userData.email, userData.password, userData.phone, userData.firstName, userData.lastName, "pending", "active", userRole, now);
        const insertWallet = db.prepare(`
      INSERT INTO wallets (userId, balance, totalInvested, totalReturns, lastUpdated)
      VALUES (?, ?, ?, ?, ?)
    `);
        insertWallet.run(userId, 0, 0, 0, now);
        return user;
    }
    catch (error) {
        throw new Error(`Failed to create user: ${error}`);
    }
};
exports.createUser = createUser;
const getUserByEmail = (email) => {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
    return stmt.get(email) || null;
};
exports.getUserByEmail = getUserByEmail;
const getUserById = (userId) => {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
    const row = stmt.get(userId);
    if (!row)
        return null;
    const { password } = row, user = __rest(row, ["password"]);
    return user;
};
exports.getUserById = getUserById;
const updateUser = (userId, updates) => {
    const current = (0, exports.getUserById)(userId);
    if (!current)
        return null;
    const updated = Object.assign(Object.assign({}, current), updates);
    const stmt = db.prepare(`
    UPDATE users SET email = ?, phone = ?, firstName = ?, lastName = ?,
    bvn = ?, nin = ?, kycStatus = ?, status = ?, lastLogin = ? WHERE id = ?
  `);
    stmt.run(updated.email, updated.phone, updated.firstName, updated.lastName, updated.bvn || null, updated.nin || null, updated.kycStatus, updated.status, updated.lastLogin || null, userId);
    return updated;
};
exports.updateUser = updateUser;
// Session Management
const createSession = (userId) => {
    const token = (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const insertSession = db.prepare("INSERT INTO user_sessions (token, userId, createdAt) VALUES (?, ?, ?)");
    insertSession.run(token, userId, now);
    const updateLogin = db.prepare("UPDATE users SET lastLogin = ? WHERE id = ?");
    updateLogin.run(now, userId);
    return token;
};
exports.createSession = createSession;
const getSessionUser = (token) => {
    const stmt = db.prepare("SELECT userId FROM user_sessions WHERE token = ?");
    const session = stmt.get(token);
    return session ? (0, exports.getUserById)(session.userId) : null;
};
exports.getSessionUser = getSessionUser;
const deleteSession = (token) => {
    const stmt = db.prepare("DELETE FROM user_sessions WHERE token = ?");
    return stmt.run(token).changes > 0;
};
exports.deleteSession = deleteSession;
// Wallet Management
const getUserWallet = (userId) => {
    const stmt = db.prepare("SELECT * FROM wallets WHERE userId = ?");
    return stmt.get(userId) || null;
};
exports.getUserWallet = getUserWallet;
const updateWallet = (userId, updates) => {
    const current = (0, exports.getUserWallet)(userId);
    if (!current)
        return null;
    const updated = Object.assign(Object.assign(Object.assign({}, current), updates), { lastUpdated: new Date().toISOString() });
    const stmt = db.prepare("UPDATE wallets SET balance = ?, totalInvested = ?, totalReturns = ?, lastUpdated = ? WHERE userId = ?");
    stmt.run(updated.balance, updated.totalInvested, updated.totalReturns, updated.lastUpdated, userId);
    return updated;
};
exports.updateWallet = updateWallet;
// Transaction Management
const createTransaction = (transactionData) => {
    const transactionId = (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const transaction = Object.assign(Object.assign({}, transactionData), { id: transactionId, createdAt: now });
    const stmt = db.prepare(`
    INSERT INTO transactions (id, userId, type, amount, description, status, metadata, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(transactionId, transactionData.userId, transactionData.type, transactionData.amount, transactionData.description, transactionData.status, transactionData.metadata ? JSON.stringify(transactionData.metadata) : null, now);
    return transaction;
};
exports.createTransaction = createTransaction;
const getUserTransactions = (userId, limit = 50) => {
    const stmt = db.prepare("SELECT * FROM transactions WHERE userId = ? ORDER BY createdAt DESC LIMIT ?");
    const rows = stmt.all(userId, limit);
    return rows.map((row) => (Object.assign(Object.assign({}, row), { metadata: row.metadata ? JSON.parse(row.metadata) : undefined })));
};
exports.getUserTransactions = getUserTransactions;
const getTransaction = (transactionId) => {
    const stmt = db.prepare("SELECT * FROM transactions WHERE id = ?");
    const row = stmt.get(transactionId);
    return row
        ? Object.assign(Object.assign({}, row), { metadata: row.metadata ? JSON.parse(row.metadata) : undefined }) : null;
};
exports.getTransaction = getTransaction;
const updateTransaction = (transactionId, updates) => {
    const current = (0, exports.getTransaction)(transactionId);
    if (!current)
        return null;
    const updated = Object.assign(Object.assign({}, current), updates);
    const stmt = db.prepare("UPDATE transactions SET type = ?, amount = ?, description = ?, status = ?, metadata = ? WHERE id = ?");
    stmt.run(updated.type, updated.amount, updated.description, updated.status, updated.metadata ? JSON.stringify(updated.metadata) : null, transactionId);
    return updated;
};
exports.updateTransaction = updateTransaction;
// Investment Management
const createInvestment = (investmentData) => {
    const investmentId = (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const investment = Object.assign(Object.assign({}, investmentData), { id: investmentId, currentValue: investmentData.amount, returns: 0, createdAt: now });
    const stmt = db.prepare(`
    INSERT INTO investments (id, userId, type, amount, currentValue, returns, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(investmentId, investmentData.userId, investmentData.type, investmentData.amount, investment.currentValue, investment.returns, investmentData.status, now);
    return investment;
};
exports.createInvestment = createInvestment;
const getUserInvestments = (userId) => {
    const stmt = db.prepare("SELECT * FROM investments WHERE userId = ? ORDER BY createdAt DESC");
    return stmt.all(userId);
};
exports.getUserInvestments = getUserInvestments;
const updateInvestment = (investmentId, updates) => {
    const stmt = db.prepare("SELECT * FROM investments WHERE id = ?");
    const current = stmt.get(investmentId);
    if (!current)
        return null;
    const updated = Object.assign(Object.assign({}, current), updates);
    const updateStmt = db.prepare("UPDATE investments SET type = ?, amount = ?, currentValue = ?, returns = ?, status = ? WHERE id = ?");
    updateStmt.run(updated.type, updated.amount, updated.currentValue, updated.returns, updated.status, investmentId);
    return updated;
};
exports.updateInvestment = updateInvestment;
// Utility Functions
const getAllUsers = () => {
    const stmt = db.prepare("SELECT * FROM users");
    const rows = stmt.all();
    return rows.map((_a) => {
        var { password } = _a, user = __rest(_a, ["password"]);
        return user;
    });
};
exports.getAllUsers = getAllUsers;
const getUserCount = () => {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM users");
    const result = stmt.get();
    return result.count || 0;
};
exports.getUserCount = getUserCount;
const getTotalAUM = () => {
    const stmt = db.prepare("SELECT SUM(totalInvested) as total FROM wallets");
    const result = stmt.get();
    return result.total || 0;
};
exports.getTotalAUM = getTotalAUM;
const getActiveInvestmentCount = () => {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM investments WHERE status = 'active'");
    const result = stmt.get();
    return result.count || 0;
};
exports.getActiveInvestmentCount = getActiveInvestmentCount;
const getPendingKYCCount = () => {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM users WHERE kycStatus = 'pending'");
    const result = stmt.get();
    return result.count || 0;
};
exports.getPendingKYCCount = getPendingKYCCount;
// Social Banking Functions
const createSocialGroup = (groupData) => {
    const groupId = (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
    INSERT INTO social_groups (id, name, description, targetAmount, createdBy, endDate, category, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(groupId, groupData.name, groupData.description || "", groupData.targetAmount, groupData.createdBy, groupData.endDate || "", groupData.category || "general", now);
    // Add creator as first member
    const memberStmt = db.prepare(`
    INSERT INTO group_members (id, groupId, userId, joinedAt)
    VALUES (?, ?, ?, ?)
  `);
    memberStmt.run((0, crypto_1.randomUUID)(), groupId, groupData.createdBy, now);
    return Object.assign(Object.assign({ id: groupId }, groupData), { currentAmount: 0, status: "active", createdAt: now });
};
exports.createSocialGroup = createSocialGroup;
const getUserSocialGroups = (userId) => {
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
    return stmt.all(userId);
};
exports.getUserSocialGroups = getUserSocialGroups;
const getGroupMembers = (groupId) => {
    const stmt = db.prepare(`
    SELECT gm.*, u.firstName, u.lastName, u.email
    FROM group_members gm
    JOIN users u ON gm.userId = u.id
    WHERE gm.groupId = ? AND gm.status = 'active'
    ORDER BY gm.contribution DESC
  `);
    return stmt.all(groupId);
};
exports.getGroupMembers = getGroupMembers;
const createMoneyRequest = (requestData) => {
    const requestId = (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
    INSERT INTO money_requests (id, fromUserId, toUserId, amount, reason, dueDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(requestId, requestData.fromUserId, requestData.toUserId, requestData.amount, requestData.reason, requestData.dueDate || "", now, now);
    return Object.assign(Object.assign({ id: requestId }, requestData), { status: "pending", createdAt: now, updatedAt: now });
};
exports.createMoneyRequest = createMoneyRequest;
const getUserMoneyRequests = (userId) => {
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
    return stmt.all(userId, userId);
};
exports.getUserMoneyRequests = getUserMoneyRequests;
const createSocialPayment = (paymentData) => {
    const paymentId = (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
    INSERT INTO social_payments (id, fromUserId, toUserId, amount, message, type, isPublic, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(paymentId, paymentData.fromUserId, paymentData.toUserId, paymentData.amount, paymentData.message || "", paymentData.type, paymentData.isPublic || false, now);
    return Object.assign(Object.assign({ id: paymentId }, paymentData), { createdAt: now });
};
exports.createSocialPayment = createSocialPayment;
const getUserSocialPayments = (userId) => {
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
    return stmt.all(userId, userId);
};
exports.getUserSocialPayments = getUserSocialPayments;
const getFinancialChallenges = () => {
    const stmt = db.prepare(`
    SELECT fc.*, COUNT(cp.id) as participantCount
    FROM financial_challenges fc
    LEFT JOIN challenge_participants cp ON fc.id = cp.challengeId
    GROUP BY fc.id
    ORDER BY fc.createdAt DESC
  `);
    return stmt.all();
};
exports.getFinancialChallenges = getFinancialChallenges;
const getChallengeParticipants = (challengeId) => {
    const stmt = db.prepare(`
    SELECT cp.*, u.firstName, u.lastName
    FROM challenge_participants cp
    JOIN users u ON cp.userId = u.id
    WHERE cp.challengeId = ?
    ORDER BY cp.progress DESC, cp.joinedAt ASC
  `);
    return stmt.all(challengeId);
};
exports.getChallengeParticipants = getChallengeParticipants;
// Notification Functions
const createNotification = (notificationData) => {
    const notificationId = (0, crypto_1.randomUUID)();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
    INSERT INTO notifications (id, userId, title, message, type, priority, metadata, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
    stmt.run(notificationId, notificationData.userId, notificationData.title, notificationData.message, notificationData.type, notificationData.priority || "normal", notificationData.metadata
        ? JSON.stringify(notificationData.metadata)
        : null, now);
    return Object.assign(Object.assign({ id: notificationId }, notificationData), { read: false, createdAt: now });
};
exports.createNotification = createNotification;
const getUserNotificationsFromDB = (userId, limit = 50, unreadOnly = false) => {
    const whereClause = unreadOnly
        ? "WHERE userId = ? AND read = false"
        : "WHERE userId = ?";
    const stmt = db.prepare(`
    SELECT * FROM notifications
    ${whereClause}
    ORDER BY createdAt DESC
    LIMIT ?
  `);
    const notifications = stmt.all(userId, limit);
    return notifications.map((n) => (Object.assign(Object.assign({}, n), { metadata: n.metadata ? JSON.parse(n.metadata) : undefined })));
};
exports.getUserNotificationsFromDB = getUserNotificationsFromDB;
// Initialize sample data
const createSampleChallenges = () => {
    const challenges = [
        {
            id: (0, crypto_1.randomUUID)(),
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
            id: (0, crypto_1.randomUUID)(),
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
            id: (0, crypto_1.randomUUID)(),
            title: "Zero Spending Week",
            description: "Challenge yourself to spend only on essentials for one week",
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
        stmt.run(challenge.id, challenge.title, challenge.description, challenge.targetAmount, challenge.duration, challenge.startDate, challenge.endDate, challenge.status, challenge.category, challenge.createdAt);
    });
    console.log("✅ Sample financial challenges created");
};
exports.createSampleChallenges = createSampleChallenges;
