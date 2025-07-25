import { RequestHandler } from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database viewer endpoint (development only)
export const viewDatabase: RequestHandler = (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "Database viewer disabled in production",
    });
  }

  try {
    const dbPath = path.join(__dirname, "../../data/investnaija.db");
    const db = new Database(dbPath);

    // Get all tables
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all();

    const databaseInfo: any = {
      tables: [],
      summary: {
        totalTables: tables.length,
        users: 0,
        wallets: 0,
        transactions: 0,
        investments: 0,
      },
    };

    // Inspect each table
    for (const table of tables) {
      const tableName = table.name;

      try {
        // Get table schema
        const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();

        // Get row count
        const count = db
          .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
          .get();

        // Get sample data
        const sampleData = db
          .prepare(`SELECT * FROM ${tableName} LIMIT 3`)
          .all();

        databaseInfo.tables.push({
          name: tableName,
          columns: schema.map((col: any) => ({
            name: col.name,
            type: col.type,
            notNull: col.notnull === 1,
            primaryKey: col.pk === 1,
          })),
          recordCount: count.count,
          sampleData: sampleData,
        });

        // Update summary
        if (tableName === "users") databaseInfo.summary.users = count.count;
        if (tableName === "wallets") databaseInfo.summary.wallets = count.count;
        if (tableName === "transactions")
          databaseInfo.summary.transactions = count.count;
        if (tableName === "investments")
          databaseInfo.summary.investments = count.count;
      } catch (error) {
        console.error(`Error reading table ${tableName}:`, error);
      }
    }

    db.close();

    res.json({
      success: true,
      data: databaseInfo,
    });
  } catch (error) {
    console.error("Database inspection error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to inspect database",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get specific table data
export const getTableData: RequestHandler = (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "Database viewer disabled in production",
    });
  }

  try {
    const { tableName } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const dbPath = path.join(__dirname, "../../data/investnaija.db");
    const db = new Database(dbPath);

    // Validate table exists
    const tableExists = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
      .get(tableName);

    if (!tableExists) {
      return res.status(404).json({
        success: false,
        error: `Table '${tableName}' not found`,
      });
    }

    // Get table data with pagination
    const data = db
      .prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`)
      .all(Number(limit), Number(offset));

    // Get total count
    const totalCount = db
      .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
      .get();

    // Get table schema
    const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();

    db.close();

    res.json({
      success: true,
      data: {
        tableName,
        schema: schema.map((col: any) => ({
          name: col.name,
          type: col.type,
          notNull: col.notnull === 1,
          primaryKey: col.pk === 1,
        })),
        records: data,
        pagination: {
          total: totalCount.count,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < totalCount.count,
        },
      },
    });
  } catch (error) {
    console.error("Table data retrieval error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve table data",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Execute custom SQL query (development only)
export const executeQuery: RequestHandler = (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "Query execution disabled in production",
    });
  }

  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query is required",
      });
    }

    // Only allow SELECT queries for safety
    if (!query.trim().toLowerCase().startsWith("select")) {
      return res.status(400).json({
        success: false,
        error: "Only SELECT queries are allowed",
      });
    }

    const dbPath = path.join(__dirname, "../../data/investnaija.db");
    const db = new Database(dbPath);

    const result = db.prepare(query).all();
    db.close();

    res.json({
      success: true,
      data: {
        query,
        results: result,
        count: result.length,
      },
    });
  } catch (error) {
    console.error("Query execution error:", error);
    res.status(500).json({
      success: false,
      error: "Query execution failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
