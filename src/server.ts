import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { connectDB } from "./config/db";
import cryptoBot from "./bots/cryptoBot";
import forexBot from "./bots/forexBot";

import cryptoUserRoutes from "./routes/crypto_user.routes";
import forexUserRoutes from "./routes/forex_user.routes";
import staticticsRoutes from "./routes/users_stats.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";

// initialize express app
const app = express();

// Initialize configuration
dotenv.config();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["https://your-frontend.vercel.app"];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use('/webhook/crypto', (req, res) => {
  console.log('Webhook test hit:', req.body);
  res.sendStatus(200);
});
// Webhook endpoints
app.use("/webhook/crypto", cryptoBot.webhookCallback("/crypto"));
app.use("/webhook/forex", forexBot.webhookCallback("/forex"));

//Calling your Routes Layout
app.use("/api/auth", authRoutes);
app.use("/api/users", cryptoUserRoutes);
app.use("/api/users", staticticsRoutes);
app.use("/api/users", forexUserRoutes);
app.use("/api/admin", adminRoutes);

(async () => {
  await connectDB();
  // Set webhooks instead of launching polling
  const baseUrl = "https://telegram-api-k5mk.vercel.app";
  await cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`);
  await forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`);
  console.log("Webhooks configured for crypto and forex bots");
})();

// Graceful shutdown
process.once("SIGINT", async () => {
  cryptoBot.stop("SIGINT");
  forexBot.stop("SIGINT");
  process.exit(0);
});

process.once("SIGTERM", async () => {
  cryptoBot.stop("SIGTERM");
  forexBot.stop("SIGTERM");
  process.exit(0);
});
// server.ts
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  res.status(status).json({
    err: process.env.NODE_ENV === "production" ? null : err,
    msg: err.message || "Internal Server Error",
    data: null,
  });
});

// 404 error handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    err: null,
    msg: "404 Not Found",
    data: null,
  });
});

export default app;
