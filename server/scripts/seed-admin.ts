import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

// Initialize database connection
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
  return new Database(dbPath);
};

const seedAdminUsers = async () => {
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
        console.log(
          `⚠️  Admin user ${adminUser.email} already exists, skipping...`,
        );
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminUser.password, 12);
      const userId = randomUUID();
      const now = new Date().toISOString();

      // Insert admin user
      const insertUser = db.prepare(`
        INSERT INTO users (id, email, password, phone, firstName, lastName, kycStatus, status, role, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertUser.run(
        userId,
        adminUser.email,
        hashedPassword,
        adminUser.phone,
        adminUser.firstName,
        adminUser.lastName,
        "verified", // Admin users are pre-verified
        "active",
        adminUser.role,
        now,
      );

      // Create wallet for admin user
      const insertWallet = db.prepare(`
        INSERT INTO wallets (userId, balance, totalInvested, totalReturns, lastUpdated)
        VALUES (?, ?, ?, ?, ?)
      `);

      insertWallet.run(userId, 0, 0, 0, now);

      console.log(`✅ Created ${adminUser.role} user: ${adminUser.email}`);
    } catch (error) {
      console.error(
        `❌ Failed to create admin user ${adminUser.email}:`,
        error,
      );
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
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAdminUsers().catch(console.error);
}

export { seedAdminUsers };
