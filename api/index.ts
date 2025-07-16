import { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "../server";

const app = createServer();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Convert Vercel request/response to Express format
  return new Promise<void>((resolve, reject) => {
    app(req as any, res as any, (error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
