// Database inspection script
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, "../data/investnaija.db");

console.log("🔍 InvestNaija Database Inspector");
console.log("=".repeat(50));
console.log(`Database: ${dbPath}\n`);

try {
  const db = new Database(dbPath);

  // Get all tables
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all();

  console.log(`📋 Found ${tables.length} tables:\n`);

  for (const table of tables) {
    const tableName = table.name;
    console.log(`\n📊 Table: ${tableName}`);
    console.log("-".repeat(30));

    try {
      // Get table schema
      const schema = db.prepare(`PRAGMA table_info(${tableName})`).all();
      console.log(
        "Columns:",
        schema.map((col) => `${col.name} (${col.type})`).join(", "),
      );

      // Get row count
      const count = db
        .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
        .get();
      console.log(`Records: ${count.count}`);

      // Show sample data (first 5 rows)
      if (count.count > 0) {
        console.log("\nSample data:");
        const sampleData = db
          .prepare(`SELECT * FROM ${tableName} LIMIT 5`)
          .all();

        sampleData.forEach((row, index) => {
          console.log(`Row ${index + 1}:`, JSON.stringify(row, null, 2));
        });

        if (count.count > 5) {
          console.log(`... and ${count.count - 5} more records`);
        }
      }
    } catch (error) {
      console.log(`Error reading table ${tableName}:`, error.message);
    }
  }

  // Summary statistics
  console.log("\n📈 Database Summary:");
  console.log("=".repeat(30));

  // Users
  try {
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
    console.log(`👥 Users: ${userCount.count}`);
  } catch (e) {
    console.log("👥 Users: Table not found");
  }

  // Wallets
  try {
    const walletCount = db
      .prepare("SELECT COUNT(*) as count FROM wallets")
      .get();
    console.log(`💰 Wallets: ${walletCount.count}`);
  } catch (e) {
    console.log("💰 Wallets: Table not found");
  }

  // Transactions
  try {
    const transactionCount = db
      .prepare("SELECT COUNT(*) as count FROM transactions")
      .get();
    console.log(`💸 Transactions: ${transactionCount.count}`);
  } catch (e) {
    console.log("💸 Transactions: Table not found");
  }

  // Investments
  try {
    const investmentCount = db
      .prepare("SELECT COUNT(*) as count FROM investments")
      .get();
    console.log(`📈 Investments: ${investmentCount.count}`);
  } catch (e) {
    console.log("📈 Investments: Table not found");
  }

  db.close();
} catch (error) {
  console.error("❌ Error accessing database:", error.message);
  console.log("\n💡 Possible solutions:");
  console.log("- Make sure the database exists: npm run init");
  console.log("- Check file permissions");
  console.log("- Verify the database path");
}
