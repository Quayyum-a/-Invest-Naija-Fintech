import { VercelRequest, VercelResponse } from "@vercel/node";
import db from "../server/config/database";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const isHealthy = await db.healthCheck();
    const status = isHealthy ? 200 : 503;

    return res.status(status).json({
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: isHealthy ? "connected" : "disconnected",
    });
  } catch (error) {
    console.error("Health check error:", error);
    return res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
