import { createServer } from "./index";
import db from "./config/database";

// Initialize database for Vercel
async function initializeVercelApp() {
  try {
    console.log("🚀 Initializing InvestNaija for Vercel...");

    // Check if database is healthy
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      console.error("❌ Database health check failed");
      throw new Error("Database connection failed");
    }

    // Run migrations if needed
    await db.migrate();

    console.log("✅ InvestNaija initialized successfully for Vercel");
  } catch (error) {
    console.error("❌ Failed to initialize InvestNaija for Vercel:", error);
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
