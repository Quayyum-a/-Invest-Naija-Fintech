import { createServer } from "../server/index";
import { VercelRequest, VercelResponse } from "@vercel/node";

const app = createServer();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
