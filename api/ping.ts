import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.json({
    message: "InvestNaija API v1.0",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    vercel: true,
  });
}
