import DatabaseManager from "../database/connection";
import VercelDatabaseManager from "../database/vercel-connection";

// Database interface for both SQLite and PostgreSQL
export interface DatabaseInterface {
  query(sql: string, params?: any[]): Promise<any> | any;
  run(sql: string, params?: any[]): Promise<any> | any;
  healthCheck(): Promise<boolean> | boolean;
  migrate(): Promise<void> | void;
}

// Database adapter that switches between SQLite and PostgreSQL based on environment
class DatabaseAdapter implements DatabaseInterface {
  private isVercel: boolean;
  private sqliteDb?: DatabaseManager;

  constructor() {
    // Detect if we're running on Vercel or with PostgreSQL
    this.isVercel =
      !!process.env.VERCEL ||
      !!process.env.POSTGRES_URL ||
      !!process.env.DATABASE_URL?.startsWith("postgres");

    if (!this.isVercel) {
      this.sqliteDb = DatabaseManager.getInstance();
    }
  }

  async query(sql: string, params?: any[]): Promise<any> {
    if (this.isVercel) {
      // Use PostgreSQL for Vercel
      return await VercelDatabaseManager.query(sql, params);
    } else {
      // Use SQLite for local development
      return this.sqliteDb!.query(sql, params);
    }
  }

  async run(sql: string, params?: any[]): Promise<any> {
    if (this.isVercel) {
      // For PostgreSQL, run and query are the same
      return await VercelDatabaseManager.query(sql, params);
    } else {
      // Use SQLite run method
      return this.sqliteDb!.run(sql, params);
    }
  }

  async healthCheck(): Promise<boolean> {
    if (this.isVercel) {
      return await VercelDatabaseManager.healthCheck();
    } else {
      return await this.sqliteDb!.healthCheck();
    }
  }

  async migrate(): Promise<void> {
    if (this.isVercel) {
      await VercelDatabaseManager.migrate();
    } else {
      await this.sqliteDb!.migrate();
    }
  }

  async close(): Promise<void> {
    if (this.isVercel) {
      await VercelDatabaseManager.close();
    } else {
      await this.sqliteDb!.close();
    }
  }

  // Helper method to convert SQLite syntax to PostgreSQL
  convertToPostgresSQL(sql: string): string {
    if (!this.isVercel) return sql;

    // Convert SQLite syntax to PostgreSQL
    let convertedSql = sql
      // Convert ? placeholders to $1, $2, etc.
      .replace(/\?/g, () => {
        const matches = sql.match(/\?/g);
        return `$${matches ? matches.length : 1}`;
      })
      // Convert AUTOINCREMENT to SERIAL
      .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, "SERIAL PRIMARY KEY")
      // Convert datetime functions
      .replace(/datetime\('now'\)/gi, "CURRENT_TIMESTAMP")
      .replace(/date\('now'\)/gi, "CURRENT_DATE")
      // Convert BLOB to BYTEA
      .replace(/BLOB/gi, "BYTEA")
      // Convert TEXT to VARCHAR for specific cases
      .replace(/TEXT(?!\s)/gi, "TEXT");

    return convertedSql;
  }
}

// Create singleton instance
const db = new DatabaseAdapter();

export default db;

// Export for backward compatibility
export { DatabaseManager, VercelDatabaseManager };
