import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const hasDb = !!(process.env.MONGO_URI || process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL_NON_POOLING);

  return res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: hasDb ? "configured" : "not_configured",
    message: hasDb ? "Database configured via environment" : "Set MONGO_URI or DATABASE_URL",
  });
}
