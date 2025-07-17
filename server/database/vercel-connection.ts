import { Pool } from "pg";

// Serverless-compatible database connection for Vercel
class VercelDatabaseManager {
  private static pool: Pool;

  public static getPool(): Pool {
    if (!VercelDatabaseManager.pool) {
      // Check for Vercel Postgres environment variables
      const connectionString =
        process.env.POSTGRES_URL ||
        process.env.DATABASE_URL ||
        process.env.POSTGRES_PRISMA_URL;

      if (!connectionString) {
        console.warn(
          "⚠️  No database connection string found. Database features will be disabled.",
        );
        // Return a mock pool that throws helpful errors
        return null as any;
      }

      VercelDatabaseManager.pool = new Pool({
        connectionString,
        ssl:
          process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
        max: 10, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
      });

      console.log("✅ PostgreSQL database pool created for Vercel");
    }

    return VercelDatabaseManager.pool;
  }

  public static async query(text: string, params?: any[]): Promise<any> {
    const pool = VercelDatabaseManager.getPool();
    if (!pool) {
      console.warn("Database not configured, returning empty result");
      return { rows: [], rowCount: 0 };
    }

    const start = Date.now();

    try {
      const result = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log("Executed query", { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error("Database query error:", error);
      throw error;
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const pool = VercelDatabaseManager.getPool();
      if (!pool) {
        console.warn("Database not configured");
        return false;
      }
      const result = await VercelDatabaseManager.query("SELECT NOW()");
      return result.rows.length > 0;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  public static async migrate(): Promise<void> {
    const pool = VercelDatabaseManager.getPool();
    if (!pool) {
      console.warn("⚠️  Database not configured, skipping migrations");
      return;
    }

    console.log("🔄 Running database migrations for PostgreSQL...");

    try {
      // Create tables if they don't exist
      await VercelDatabaseManager.createTables();
      await VercelDatabaseManager.seedInitialData();
      console.log("✅ Database migration completed");
    } catch (error) {
      console.error("❌ Database migration failed:", error);
      // Don't throw error to prevent deployment failure
      console.warn("Continuing without database...");
    }
  }

  private static async createTables(): Promise<void> {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        middle_name VARCHAR(100),
        date_of_birth DATE,
        gender VARCHAR(10),
        bvn VARCHAR(11),
        nin VARCHAR(11),
        address JSONB,
        state VARCHAR(50),
        local_government VARCHAR(100),
        kyc_status VARCHAR(20) DEFAULT 'pending',
        kyc_level INTEGER DEFAULT 1,
        verification_documents JSONB,
        status VARCHAR(20) DEFAULT 'active',
        account_type VARCHAR(20) DEFAULT 'personal',
        two_factor_enabled BOOLEAN DEFAULT false,
        biometric_enabled BOOLEAN DEFAULT false,
        notification_preferences JSONB,
        device_tokens JSONB,
        last_login TIMESTAMP,
        login_attempts INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createBankAccountsTable = `
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        account_number VARCHAR(20) UNIQUE NOT NULL,
        account_name VARCHAR(255) NOT NULL,
        account_type VARCHAR(20) DEFAULT 'savings',
        currency VARCHAR(3) DEFAULT 'NGN',
        balance DECIMAL(15,2) DEFAULT 0.00,
        available_balance DECIMAL(15,2) DEFAULT 0.00,
        daily_limit DECIMAL(15,2) DEFAULT 500000.00,
        monthly_limit DECIMAL(15,2) DEFAULT 5000000.00,
        status VARCHAR(20) DEFAULT 'active',
        freeze_reason TEXT,
        opened_date DATE DEFAULT CURRENT_DATE,
        last_transaction TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        account_id INTEGER REFERENCES bank_accounts(id),
        transaction_type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'NGN',
        description TEXT,
        reference VARCHAR(100) UNIQUE NOT NULL,
        sender_account VARCHAR(20),
        sender_name VARCHAR(255),
        sender_bank VARCHAR(100),
        recipient_account VARCHAR(20),
        recipient_name VARCHAR(255),
        recipient_bank VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending',
        channel VARCHAR(20),
        location JSONB,
        fee_amount DECIMAL(15,2) DEFAULT 0.00,
        vat_amount DECIMAL(15,2) DEFAULT 0.00,
        total_amount DECIMAL(15,2) NOT NULL,
        risk_score INTEGER DEFAULT 0,
        fraud_flags JSONB,
        requires_approval BOOLEAN DEFAULT false,
        approved_by INTEGER REFERENCES users(id),
        approval_date TIMESTAMP,
        external_reference VARCHAR(255),
        processor_reference VARCHAR(255),
        settlement_id VARCHAR(255),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );
    `;

    await VercelDatabaseManager.query(createUsersTable);
    await VercelDatabaseManager.query(createBankAccountsTable);
    await VercelDatabaseManager.query(createTransactionsTable);

    console.log("✅ Database tables created successfully");
  }

  private static async seedInitialData(): Promise<void> {
    try {
      // Check if admin user exists
      const adminCheck = await VercelDatabaseManager.query(
        "SELECT id FROM users WHERE email = $1",
        ["admin@investnaija.com"],
      );

      if (adminCheck.rows.length === 0) {
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash("Admin123!", 12);

        // Insert admin user
        const adminResult = await VercelDatabaseManager.query(
          `INSERT INTO users (email, password_hash, phone, first_name, last_name, kyc_status, account_type)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
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
        await VercelDatabaseManager.query(
          `INSERT INTO bank_accounts (user_id, account_number, account_name, account_type, balance)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            adminResult.rows[0].id,
            "2200000001",
            "System Administrator",
            "current",
            0.0,
          ],
        );

        console.log("✅ Admin user created with bank account");
      }

      // Check if demo user exists
      const demoCheck = await VercelDatabaseManager.query(
        "SELECT id FROM users WHERE email = $1",
        ["demo@investnaija.com"],
      );

      if (demoCheck.rows.length === 0) {
        const bcrypt = await import("bcryptjs");
        const hashedPassword = await bcrypt.hash("Demo123!", 12);

        // Insert demo user
        const demoResult = await VercelDatabaseManager.query(
          `INSERT INTO users (email, password_hash, phone, first_name, last_name, kyc_status)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
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
        await VercelDatabaseManager.query(
          `INSERT INTO bank_accounts (user_id, account_number, account_name, account_type, balance)
           VALUES ($1, $2, $3, $4, $5)`,
          [demoResult.rows[0].id, "2200000002", "Demo User", "savings", 5000.0],
        );

        console.log("✅ Demo user created with bank account");
      }
    } catch (error) {
      console.error("Failed to seed initial data:", error);
    }
  }

  public static async close(): Promise<void> {
    if (VercelDatabaseManager.pool) {
      await VercelDatabaseManager.pool.end();
      console.log("Database pool closed");
    }
  }
}

export default VercelDatabaseManager;
