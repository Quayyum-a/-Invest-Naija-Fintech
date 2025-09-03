import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "../server";

// Create a single Express instance reused across invocations
const app = createServer();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Basic CORS (Express also sets headers based on config)
  res.setHeader("Access-Control-Allow-Credentials", "true");
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

  // Strip the "/api" prefix so Express routes like "/wallet" match
  if (req.url?.startsWith("/api")) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }

  // Delegate to Express
  (app as any)(req, res);
}
