import { RequestHandler } from "express";
// import { DemoResponse } from "@shared/api";

export const handleDemo: RequestHandler = (req, res) => {
  const response: any = {
    message: "Hello from Express server",
  };
  res.status(200).json(response);
};
