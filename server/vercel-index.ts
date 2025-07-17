import { createServer } from "./index";
import db from "./config/database";

// Initialize database for Vercel
async function initializeVercelApp() {
  try {
    console.log("🚀 Initializing InvestNaija for Vercel...");

    // Check if database is healthy
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      console.warn(
        "⚠️  Database health check failed - continuing without database",
      );
    } else {
      // Run migrations if database is available
      await db.migrate();
      console.log("✅ Database initialized successfully");
    }

    console.log("✅ InvestNaija initialized successfully for Vercel");
  } catch (error) {
    console.error("❌ Failed to initialize InvestNaija for Vercel:", error);
    console.warn("⚠️  Continuing without database features...");
    // Don't throw error to prevent function from failing
    // The app should still start even if initialization has issues
  }
}

// Create and export the server
export function createVercelServer() {
  // Initialize database on cold start
  initializeVercelApp().catch(console.error);

  return createServer();
}

// For compatibility with existing imports
export { createServer };
export default createVercelServer;
