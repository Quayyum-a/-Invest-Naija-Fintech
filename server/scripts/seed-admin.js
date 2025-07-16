"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdminUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = require("crypto");
// Initialize database connection
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
    return new better_sqlite3_1.default(dbPath);
};
const seedAdminUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    const db = initDB();
    // Create tables if they don't exist
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
  `);
    // Admin users to create
    const adminUsers = [
        {
            email: "admin@admin.investnaija.com",
            password: "Admin123!",
            firstName: "Super",
            lastName: "Admin",
            phone: "+2348100000001",
            role: "super_admin",
        },
        {
            email: "staff@investnaija.com",
            password: "Admin123!",
            firstName: "Admin",
            lastName: "Staff",
            phone: "+2348100000002",
            role: "admin",
        },
        {
            email: "manager@investnaija.com",
            password: "Admin123!",
            firstName: "System",
            lastName: "Manager",
            phone: "+2348100000003",
            role: "admin",
        },
    ];
    console.log("🌱 Seeding admin users...");
    for (const adminUser of adminUsers) {
        try {
            // Check if user already exists
            const existingUser = db
                .prepare("SELECT id FROM users WHERE email = ?")
                .get(adminUser.email);
            if (existingUser) {
                console.log(`⚠️  Admin user ${adminUser.email} already exists, skipping...`);
                continue;
            }
            // Hash password
            const hashedPassword = yield bcryptjs_1.default.hash(adminUser.password, 12);
            const userId = (0, crypto_1.randomUUID)();
            const now = new Date().toISOString();
            // Insert admin user
            const insertUser = db.prepare(`
        INSERT INTO users (id, email, password, phone, firstName, lastName, kycStatus, status, role, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            insertUser.run(userId, adminUser.email, hashedPassword, adminUser.phone, adminUser.firstName, adminUser.lastName, "verified", // Admin users are pre-verified
            "active", adminUser.role, now);
            // Create wallet for admin user
            const insertWallet = db.prepare(`
        INSERT INTO wallets (userId, balance, totalInvested, totalReturns, lastUpdated)
        VALUES (?, ?, ?, ?, ?)
      `);
            insertWallet.run(userId, 0, 0, 0, now);
            console.log(`✅ Created ${adminUser.role} user: ${adminUser.email}`);
        }
        catch (error) {
            console.error(`❌ Failed to create admin user ${adminUser.email}:`, error);
        }
    }
    db.close();
    console.log("\n🎉 Admin user seeding completed!");
    console.log("\n📝 Admin Login Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Super Admin:");
    console.log("  Email: admin@admin.investnaija.com");
    console.log("  Password: Admin123!");
    console.log("");
    console.log("Admin Staff:");
    console.log("  Email: staff@investnaija.com");
    console.log("  Password: Admin123!");
    console.log("");
    console.log("System Manager:");
    console.log("  Email: manager@investnaija.com");
    console.log("  Password: Admin123!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🌐 Access admin portal at: /admin-login");
});
exports.seedAdminUsers = seedAdminUsers;
// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedAdminUsers().catch(console.error);
}
