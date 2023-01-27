import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

class DatabaseManager {
  private db: Database.Database;
  private static instance: DatabaseManager;

  private constructor() {
    const dbPath =
      process.env.DATABASE_URL?.replace("sqlite:", "") ||
      "./data/investnaija.db";

    // Ensure data directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);

    // Enable foreign keys
    this.db.pragma("foreign_keys = ON");

    // Enable WAL mode for better concurrency
    this.db.pragma("journal_mode = WAL");

    console.log("✅ SQLite database connection established");
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  public query(sql: string, params?: any[]): any {
    const start = Date.now();
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.all(params || []);
      const duration = Date.now() - start;
      console.log("Executed query", { sql, duration, rows: result.length });
      return { rows: result, rowCount: result.length };
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

  public run(sql: string, params?: any[]): any {
    const start = Date.now();
    try {
      const stmt = this.db.prepare(sql);
      const result = stmt.run(params || []);
      const duration = Date.now() - start;
      console.log("Executed run", { sql, duration, changes: result.changes });
      return result;
    } catch (error) {
      console.error("Database run error:", error);
      throw error;
    }
  }

  public transaction<T>(callback: (db: DatabaseManager) => T): T {
    return this.db.transaction(callback)(this);
  }

  public async migrate(): Promise<void> {
    console.log("🔄 Running database migrations...");

    try {
      // Read and execute schema file
      const schemaPath = path.join(__dirname, "schema.sql");
      const schema = fs.readFileSync(schemaPath, "utf8");

      // Split schema into individual statements
      const statements = schema.split(";").filter((stmt) => stmt.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          this.run(statement);
        }
      }

      console.log("✅ Database schema created successfully");

      // Run seed data if needed
      await this.seedInitialData();

      console.log("✅ Database migration completed");
    } catch (error) {
      console.error("❌ Database migration failed:", error);
      throw error;
    }
  }

  private async seedInitialData(): Promise<void> {
    try {
      // Create default admin user with SQLite
      const adminExists = this.query("SELECT id FROM users WHERE email = ?", [
        "admin@investnaija.com",
      ]);

      if (adminExists.rows.length === 0) {
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash("Admin123!", 12);

        // Insert admin user
        const adminResult = this.run(
          `INSERT INTO users (email, password_hash, phone, first_name, last_name, kyc_status, account_type)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            "admin@investnaija.com",
            hashedPassword,
            "+2348000000000",
            "System",
            "Administrator",
            "verified",
            "personal",
          ],
        );

        // Create admin bank account
        this.run(
          `INSERT INTO bank_accounts (user_id, account_number, account_name, account_type, balance)
           VALUES (?, ?, ?, ?, ?)`,
          [
            adminResult.lastInsertRowid,
            "2200000001",
            "System Administrator",
            "current",
            0.0,
          ],
        );

        console.log("✅ Admin user created with bank account");
      }

      // Create demo user
      const demoExists = this.query("SELECT id FROM users WHERE email = ?", [
        "demo@investnaija.com",
      ]);

      if (demoExists.rows.length === 0) {
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash("Demo123!", 12);

        // Insert demo user
        const demoResult = this.run(
          `INSERT INTO users (email, password_hash, phone, first_name, last_name, kyc_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            "demo@investnaija.com",
            hashedPassword,
            "+2348123456789",
            "Demo",
            "User",
            "pending",
          ],
        );

        // Create demo bank account
        this.run(
          `INSERT INTO bank_accounts (user_id, account_number, account_name, account_type, balance)
           VALUES (?, ?, ?, ?, ?)`,
          [
            demoResult.lastInsertRowid,
            "2200000002",
            "Demo User",
            "savings",
            5000.0,
          ],
        );

        console.log("✅ Demo user created with bank account");
      }
    } catch (error) {
      console.error("Failed to seed initial data:", error);
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = this.query("SELECT datetime('now')");
      return result.rows.length > 0;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  public async close(): Promise<void> {
    this.db.close();
    console.log("Database connection closed");
  }
}

export default DatabaseManager;

// Enhanced database models with PostgreSQL
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  phone: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth?: Date;
  gender?: string;
  bvn?: string;
  nin?: string;
  address?: any;
  state?: string;
  localGovernment?: string;
  kycStatus: "pending" | "in_progress" | "verified" | "rejected";
  kycLevel: 1 | 2 | 3;
  verificationDocuments?: any;
  status: "active" | "suspended" | "frozen" | "closed";
  accountType: "personal" | "business" | "corporate";
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  notificationPreferences?: any;
  deviceTokens?: any;
  lastLogin?: Date;
  loginAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountNumber: string;
  accountName: string;
  accountType: "savings" | "current" | "fixed_deposit" | "domiciliary";
  currency: string;
  balance: number;
  availableBalance: number;
  dailyLimit: number;
  monthlyLimit: number;
  status: "active" | "dormant" | "frozen" | "closed";
  freezeReason?: string;
  openedDate: Date;
  lastTransaction?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  userId: string;
  accountId: string;
  cardNumber: string;
  cardType: "virtual" | "physical";
  cardBrand: "verve" | "mastercard" | "visa";
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  status: "active" | "blocked" | "expired" | "lost" | "stolen";
  dailyLimit: number;
  monthlyLimit: number;
  onlineEnabled: boolean;
  contactlessEnabled: boolean;
  internationalEnabled: boolean;
  deliveryAddress?: any;
  deliveryStatus?: string;
  deliveryDate?: Date;
  issuedDate: Date;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  accountId?: string;
  cardId?: string;
  transactionType: string;
  amount: number;
  currency: string;
  description: string;
  reference: string;
  senderAccount?: string;
  senderName?: string;
  senderBank?: string;
  recipientAccount?: string;
  recipientName?: string;
  recipientBank?: string;
  status: "pending" | "processing" | "completed" | "failed" | "reversed";
  channel?: "web" | "mobile" | "ussd" | "pos" | "atm" | "api";
  location?: any;
  feeAmount: number;
  vatAmount: number;
  totalAmount: number;
  riskScore: number;
  fraudFlags?: any;
  requiresApproval: boolean;
  approvedBy?: string;
  approvalDate?: Date;
  externalReference?: string;
  processorReference?: string;
  settlementId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Loan {
  id: string;
  userId: string;
  accountId: string;
  loanType: "personal" | "business" | "overdraft" | "payday";
  principalAmount: number;
  interestRate: number;
  tenorMonths: number;
  monthlyPayment: number;
  totalAmount: number;
  outstandingBalance: number;
  status:
    | "pending"
    | "approved"
    | "disbursed"
    | "active"
    | "completed"
    | "defaulted"
    | "written_off";
  creditScore?: number;
  approvalNotes?: string;
  approvedBy?: string;
  nextPaymentDate?: Date;
  paymentsMade: number;
  latePaymentCount: number;
  collateral?: any;
  guarantors?: any;
  applicationDate: Date;
  approvalDate?: Date;
  disbursementDate?: Date;
  maturityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
// Commit 13 - 1752188001
// Commit 18 - 1752188002
// Commit 19 - 1752188002
// Commit 33 - 1752188003
// Commit 37 - 1752188004
// Commit 40 - 1752188004
// Commit 63 - 1752188006
// Commit 83 - 1752188008
// Commit 92 - 1752188008
// Commit 93 - 1752188008
// Commit 102 - 1752188009
// Commit 109 - 1752188009
// Commit 111 - 1752188009
// Commit 129 - 1752188011
// Commit 134 - 1752188012
// Commit 146 - 1752188012
// Commit 151 - 1752188013
// Commit 152 - 1752188013
// Commit 157 - 1752188013
// Commit 160 - 1752188013
// Commit 173 - 1752188014
// Commit 182 - 1752188014
// Commit 193 - 1752188015
// Commit 194 - 1752188015
// Commit 204 - 1752188016
// Commit 206 - 1752188017
// Commit 208 - 1752188017
// Commit 254 - 1752188019
// Commit 260 - 1752188019
// Commit 265 - 1752188020
// Commit 289 - 1752188022
// Commit 306 - 1752188023
// Commit 308 - 1752188023
// Commit 310 - 1752188023
// Commit 333 - 1752188025
// Commit 338 - 1752188025
// Commit 340 - 1752188025
// Commit 345 - 1752188027
// Commit 364 - 1752188028
// Commit 379 - 1752188029
// Commit 383 - 1752188030
// Commit 386 - 1752188030
// Commit 400 - 1752188032
// Commit 412 - 1752188032
// Commit 413 - 1752188032
// December commit 1 - 1752189165
// December commit 12 - 1752189165
// December commit 20 - 1752189167
// December commit 37 - 1752189171
// December commit 47 - 1752189175
// December commit 58 - 1752189178
// December commit 68 - 1752189181
// December commit 72 - 1752189183
// December commit 78 - 1752189184
// December commit 84 - 1752189185
// December commit 91 - 1752189187
// December commit 106 - 1752189190
// December commit 127 - 1752189195
// 2023 commit 10 - 1752189200
// 2023 commit 11 - 1752189200
// 2023 commit 19 - 1752189201
// 2023 commit 28 - 1752189204
// 2023 commit 34 - 1752189205
// 2023 commit 37 - 1752189207
// 2023 commit 42 - 1752189209
// 2023 commit 47 - 1752189211
// 2023 commit 54 - 1752189214
// 2023 commit 55 - 1752189214
// 2023 commit 71 - 1752189220
// 2023 commit 78 - 1752189221
// 2023 commit 79 - 1752189222
// 2023 commit 80 - 1752189222
// 2023 commit 91 - 1752189224
// 2023 commit 97 - 1752189225
// 2023 commit 104 - 1752189226
// 2023 commit 113 - 1752189229
// 2023 commit 130 - 1752189233
// 2023 commit 134 - 1752189234
// 2023 commit 141 - 1752189235
// 2023 commit 147 - 1752189236
// 2023 commit 155 - 1752189239
// 2023 commit 161 - 1752189240
// 2023 commit 170 - 1752189243
// 2023 commit 179 - 1752189244
// 2023 commit 181 - 1752189245
// 2023 commit 189 - 1752189246
// 2023 commit 197 - 1752189248
// 2023 commit 202 - 1752189249
// 2023 commit 228 - 1752189253
// 2023 commit 231 - 1752189254
// 2023 commit 232 - 1752189254
// 2023 commit 234 - 1752189254
// 2023 commit 240 - 1752189255
// 2023 commit 254 - 1752189258
// 2023 commit 296 - 1752189264
// 2023 commit 304 - 1752189265
// 2023 commit 306 - 1752189265
// 2023 commit 318 - 1752189268
// 2023 commit 333 - 1752189272
// 2023 commit 341 - 1752189275
// December commit 3 - 1752189481
// December commit 12 - 1752189482
// December commit 43 - 1752189488
// December commit 44 - 1752189488
// December commit 48 - 1752189488
// December commit 60 - 1752189490
// December commit 62 - 1752189490
// December commit 64 - 1752189491
// December commit 83 - 1752189494
// December commit 102 - 1752189496
// December commit 106 - 1752189497
// December commit 117 - 1752189498
// December commit 120 - 1752189498
// December commit 121 - 1752189499
// December commit 122 - 1752189499
// Past year commit 3 - 1752189503
// Past year commit 7 - 1752189504
// Past year commit 12 - 1752189504
// Past year commit 26 - 1752189506
// Past year commit 33 - 1752189507
// Past year commit 35 - 1752189507
// Past year commit 41 - 1752189509
// Past year commit 81 - 1752189513
// Past year commit 93 - 1752189515
// Past year commit 109 - 1752189517
// Past year commit 126 - 1752189519
// Past year commit 131 - 1752189520
// Past year commit 138 - 1752189521
// Past year commit 145 - 1752189522
// Past year commit 155 - 1752189522
// Past year commit 161 - 1752189524
// Past year commit 170 - 1752189526
// Past year commit 176 - 1752189526
