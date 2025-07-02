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
// app.use(
//   cors({
//     origin: ["http://localhost:4000", "http://localhost:3000"], // change to your frontend domain
//     credentials: true, // allow sending cookies
//     allowedHeaders: ['Content-Type', 'Authorization']
//   })
// );

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['https://your-frontend.vercel.app']

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);


//Calling your Routes Layout
app.use("/api/auth", authRoutes);
app.use("/api/users", cryptoUserRoutes);
app.use("/api/users", staticticsRoutes);
app.use("/api/users", forexUserRoutes);
app.use("/api/admin", adminRoutes);

(async () => {
  await connectDB();
  await cryptoBot.launch();
  await forexBot.launch();
  console.log("🤖 Telegram bot started");
})();

// Graceful shutdown
process.once('SIGINT', async () => {
  console.log("Shutting down server and bots...");
  await cryptoBot.stop('SIGINT');
  await forexBot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', async () => {
  console.log("Shutting down server and bots...");
  await cryptoBot.stop('SIGTERM');
  await forexBot.stop('SIGTERM');
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
