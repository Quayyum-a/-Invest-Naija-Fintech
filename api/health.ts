import { VercelRequest, VercelResponse } from "@vercel/node";
import db from "../server/config/database";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const isHealthy = await db.healthCheck();

    // Always return 200 for basic health check, even without database
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: isHealthy ? "connected" : "not_configured",
      message: isHealthy
        ? "All systems operational"
        : "Running without database - configure POSTGRES_URL to enable database features",
    });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "not_configured",
      message:
        "Running without database - configure POSTGRES_URL to enable database features",
    });
  }
}
