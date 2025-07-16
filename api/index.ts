import { createVercelServer } from "../server/vercel-index";
import { VercelRequest, VercelResponse } from "@vercel/node";

// Create the Express app for Vercel
const app = createVercelServer();

// Export the handler for Vercel
export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
