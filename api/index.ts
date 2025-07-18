import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Handle different API routes
  const { url } = req;

  if (url?.includes("/ping")) {
    return res.json({
      message: "InvestNaija API v1.0",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "production",
      vercel: true,
    });
  }

  if (url?.includes("/health")) {
    return res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "postgres_ready",
      message: "InvestNaija API running on Vercel",
    });
  }

  // Default response
  return res.json({
    message: "InvestNaija API v1.0 - Serverless",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production",
    available_endpoints: ["/api/ping", "/api/health"],
  });
}
