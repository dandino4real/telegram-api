// import express, { Request, Response, NextFunction } from "express";
// import cors from "cors";
// import helmet from "helmet";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";

// import { connectDB } from "./config/db";
// import cryptoBot from "./bots/cryptoBot";
// import forexBot from "./bots/forexBot";

// import cryptoUserRoutes from "./routes/crypto_user.routes";
// import forexUserRoutes from "./routes/forex_user.routes";
// import staticticsRoutes from "./routes/users_stats.routes";
// import authRoutes from "./routes/auth.routes";
// import adminRoutes from "./routes/admin.routes";

// // initialize express app
// const app = express();

// // Initialize configuration
// dotenv.config();

// app.use(helmet());
// app.use(express.json());
// app.use(cookieParser());

// const corsOrigins = process.env.CORS_ORIGINS
//   ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
//   : ["https://your-frontend.vercel.app"];

// app.use(
//   cors({
//     origin: corsOrigins,
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// app.use((req, res, next) => {
//   console.log(`Received request at ${req.path}`);
//   next();
// });

// // Set up webhooks with Telegraf's createWebhook
// const baseUrl = 'https://telegram-api-k5mk.vercel.app';
// console.log("Setting up webhook for cryptoBot");
// app.use('/webhook/crypto', await cryptoBot.createWebhook({ domain: baseUrl }));
// console.log("Setting up webhook for forexBot");
// app.use('/webhook/forex', await forexBot.createWebhook({ domain: baseUrl }));

// //Calling your Routes Layout
// app.use("/api/auth", authRoutes);
// app.use("/api/users", cryptoUserRoutes);
// app.use("/api/users", staticticsRoutes);
// app.use("/api/users", forexUserRoutes);
// app.use("/api/admin", adminRoutes);

// (async () => {
//   try {
//     await connectDB();
//     console.log("Starting webhook setup...");
//     const cryptoResponse = await cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`);
//     console.log("Crypto webhook response:", JSON.stringify(cryptoResponse));
//     const forexResponse = await forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`);
//     console.log("Forex webhook response:", JSON.stringify(forexResponse));
//     console.log("Webhooks configured for crypto and forex bots");
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error("Webhook setup failed:", error.message);
//     } else {
//       console.error("Webhook setup failed:", error);
//     }
//   }
// })();

// // Graceful shutdownx
// process.once("SIGINT", async () => {
//   cryptoBot.stop("SIGINT");
//   forexBot.stop("SIGINT");
//   process.exit(0);
// });

// process.once("SIGTERM", async () => {
//   cryptoBot.stop("SIGTERM");
//   forexBot.stop("SIGTERM");
//   process.exit(0);
// });
// // server.ts
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   const status = err.status || 500;
//   res.status(status).json({
//     err: process.env.NODE_ENV === "production" ? null : err,
//     msg: err.message || "Internal Server Error",
//     data: null,
//   });
// });

// // 404 error handler
// app.use((req: Request, res: Response) => {
//   res.status(404).json({
//     err: null,
//     msg: "404 Not Found",
//     data: null,
//   });
// });

// export default app;


// import express, { Request, Response, NextFunction } from "express";
// import cors from "cors";
// import helmet from "helmet";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";
// import { Telegraf } from "telegraf"; // Import Telegraf for type safety
// import cryptoBot from "./bots/cryptoBot";
// import forexBot from "./bots/forexBot";

// import { connectDB } from "./config/db";

// import cryptoUserRoutes from "./routes/crypto_user.routes";
// import forexUserRoutes from "./routes/forex_user.routes";
// import staticticsRoutes from "./routes/users_stats.routes";
// import authRoutes from "./routes/auth.routes";
// import adminRoutes from "./routes/admin.routes";

// // Initialize express app
// const app = express();

// // Initialize configuration
// dotenv.config();

// app.use(helmet());
// app.use(express.json());
// app.use(cookieParser());

// const corsOrigins = process.env.CORS_ORIGINS
//   ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
//   : ['https://your-frontend.vercel.app'];

// app.use(
//   cors({
//     origin: corsOrigins,
//     credentials: true,
//     allowedHeaders: ['Content-Type', 'Authorization']
//   })
// );

// // Debug middleware
// app.use((req, res, next) => {
//   console.log(`Received request at ${req.path}`);
//   next();
// });

// // Webhook setup within an async context
// const baseUrl = 'https://telegram-api-k5mk.vercel.app';
// (async () => {
//   try {
//     console.log("Setting up webhook for cryptoBot");
//     const cryptoWebhook = await cryptoBot.createWebhook({ domain: baseUrl });
//     app.use('/webhook/crypto', cryptoWebhook);

//     console.log("Setting up webhook for forexBot");
//     const forexWebhook = await forexBot.createWebhook({ domain: baseUrl });
//     app.use('/webhook/forex', forexWebhook);

//     console.log("Webhooks initialized");
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error("Webhook setup failed:", error.message);
//     } else {
//       console.error("Webhook setup failed:", error);
//     }
//   }
// })();

// // Calling your Routes Layout
// app.use("/api/auth", authRoutes);
// app.use("/api/users", cryptoUserRoutes);
// app.use("/api/users", staticticsRoutes);
// app.use("/api/users", forexUserRoutes);
// app.use("/api/admin", adminRoutes);

// (async () => {
//   try {
//     await connectDB();
//     const baseUrl = 'https://telegram-api-k5mk.vercel.app';
//     console.log("Starting webhook setup with setWebhook...");
//     const cryptoResponse = await cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`);
//     console.log("Crypto webhook response:", JSON.stringify(cryptoResponse));
//     const forexResponse = await forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`);
//     console.log("Forex webhook response:", JSON.stringify(forexResponse));
//     console.log("Webhooks configured for crypto and forex bots");
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error("Webhook setup failed:", error.message);
//     } else {
//       console.error("Webhook setup failed:", String(error));
//     }
//   }
// })();

// // Graceful shutdown
// process.once('SIGINT', async () => {
//   await cryptoBot.stop('SIGINT');
//   await forexBot.stop('SIGINT');
//   process.exit(0);
// });

// process.once('SIGTERM', async () => {
//   await cryptoBot.stop('SIGTERM');
//   await forexBot.stop('SIGTERM');
//   process.exit(0);
// });

// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   const status = err.status || 500;
//   console.error(`Error handler triggered: ${err.message}`);
//   res.status(status).json({
//     err: process.env.NODE_ENV === "production" ? null : err,
//     msg: err.message || "Internal Server Error",
//     data: null,
//   });
// });

// app.use((req: Request, res: Response) => {
//   res.status(404).json({
//     err: null,
//     msg: "404 Not Found",
//     data: null,
//   });
// });

// export default app;



import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { Telegraf } from "telegraf"; // Import Telegraf for type safety
import cryptoBot from "./bots/cryptoBot";
import forexBot from "./bots/forexBot";

import { connectDB } from "./config/db";

import cryptoUserRoutes from "./routes/crypto_user.routes";
import forexUserRoutes from "./routes/forex_user.routes";
import staticticsRoutes from "./routes/users_stats.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";

// Initialize express app
const app = express();

// Initialize configuration
dotenv.config();

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['https://your-frontend.vercel.app'];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Debug middleware
app.use((req, res, next) => {
  console.log(`Received request at ${req.path} with body:`, req.body);
  next();
});

// Webhook setup within an async context
const baseUrl = 'https://telegram-api-k5mk.vercel.app';
(async () => {
  try {
    console.log("Initializing webhooks...");
    const cryptoWebhook = await cryptoBot.createWebhook({ domain: baseUrl });
    app.use('/webhook/crypto', (req, res, next) => {
      console.log('Crypto webhook middleware hit:', req.body);
      cryptoWebhook(req, res, next);
    });

    console.log("Initializing forex webhooks...");
    const forexWebhook = await forexBot.createWebhook({ domain: baseUrl });
    app.use('/webhook/forex', (req, res, next) => {
      console.log('Forex webhook middleware hit:', req.body);
      forexWebhook(req, res, next);
    });

    console.log("Webhooks initialized successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Webhook initialization failed:", error.message);
    } else {
      console.error("Webhook initialization failed:", error);
    }
  }
})();

// Database and webhook registration
(async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    await connectDB();
    console.log("MongoDB connected successfully");

    const baseUrl = 'https://telegram-api-k5mk.vercel.app';
    console.log("Starting webhook setup with setWebhook...");
    const cryptoResponse = await cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`);
    console.log("Crypto webhook response:", JSON.stringify(cryptoResponse));
    const forexResponse = await forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`);
    console.log("Forex webhook response:", JSON.stringify(forexResponse));
    console.log("Webhooks configured for crypto and forex bots");
  } catch (error) {
    if (error instanceof Error) {
      console.error("Initialization failed:", error.message, error.stack);
    } else {
      console.error("Initialization failed:", String(error));
    }
  }
})();

// Calling your Routes Layout
app.use("/api/auth", authRoutes);
app.use("/api/users", cryptoUserRoutes);
app.use("/api/users", staticticsRoutes);
app.use("/api/users", forexUserRoutes);
app.use("/api/admin", adminRoutes);

// Graceful shutdown
process.once('SIGINT', async () => {
  await cryptoBot.stop('SIGINT');
  await forexBot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', async () => {
  await cryptoBot.stop('SIGTERM');
  await forexBot.stop('SIGTERM');
  process.exit(0);
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  console.error(`Error handler triggered: ${err.message}`, err.stack);
  res.status(status).json({
    err: process.env.NODE_ENV === "production" ? null : err,
    msg: err.message || "Internal Server Error",
    data: null,
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    err: null,
    msg: "404 Not Found",
    data: null,
  });
});

export default app;