
// import express, { Request, Response, NextFunction } from "express";
// import cors from "cors";
// import helmet from "helmet";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";
// import { Telegraf } from "telegraf";
// import { connectDB } from "./config/db";
// import { BotContext } from "./telegrafContext";

// // Import routes
// import cryptoUserRoutes from "./routes/crypto_user.routes";
// import forexUserRoutes from "./routes/forex_user.routes";
// import staticticsRoutes from "./routes/users_stats.routes";
// import authRoutes from "./routes/auth.routes";
// import adminRoutes from "./routes/admin.routes";

// const app = express();

// // Load environment variables FIRST
// dotenv.config({
//   path:
//     process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });


// // Add debug log for environment variables
// console.log("Environment variables loaded:");
// console.log("CORS_ORIGINS:", process.env.CORS_ORIGINS || "Not set");
// console.log("BOT_TOKEN_CRYPTO:", process.env.BOT_TOKEN_CRYPTO ? "exists" : "MISSING");
// console.log("BOT_TOKEN_FOREX:", process.env.BOT_TOKEN_FOREX ? "exists" : "MISSING");
// console.log("VERCEL_URL:", process.env.VERCEL_URL || "Not set");
// console.log("MONGODB_URI:", process.env.MONGODB_URI ? "exists" : "MISSING");
// console.log("WEBHOOK_SECRET:", process.env.WEBHOOK_SECRET ? "exists" : "MISSING");

// // Validate critical environment variables
// const requiredEnvVars = [
//   "BOT_TOKEN_CRYPTO",
//   "BOT_TOKEN_FOREX",
//   "MONGODB_URI",
//   "WEBHOOK_SECRET",
// ];

// const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
// if (missingVars.length > 0) {
//   console.error("❌ Missing required environment variables:", missingVars);
//   process.exit(1);
// }

// // Middleware setup
// app.use(helmet());
// app.use(express.json());
// app.use(cookieParser());

// const corsOrigins = process.env.CORS_ORIGINS
//   ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
//   : ["https://afibie-fx.vercel.app"];

// app.use(
//   cors({
//     origin: corsOrigins,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     credentials: true,
//     allowedHeaders: ["Content-Type", "Authorization"],
//     exposedHeaders: ["Set-Cookie"],
//   })
// );

// // const corsOrigins = process.env.CORS_ORIGINS
// //   ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
// //   : ["https://afibie-fx.vercel.app"];

// // // Explicitly handle CORS preflight
// // app.options("*", cors({
// //   origin: (origin, callback) => {
// //     if (!origin || corsOrigins.includes(origin)) {
// //       callback(null, true);
// //     } else {
// //       callback(new Error("Not allowed by CORS"));
// //     }
// //   },
// //   credentials: true,
// //   methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
// //   allowedHeaders: ["Content-Type", "Authorization"],
// // }));

// // app.use(
// //   cors({
// //     origin: (origin, callback) => {
// //       console.log("CORS - Origin:", origin); // Debug
// //       if (!origin || corsOrigins.includes(origin)) {
// //         callback(null, true);
// //       } else {
// //         callback(new Error("Not allowed by CORS"));
// //       }
// //     },
// //     credentials: true,
// //     methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
// //     allowedHeaders: ["Content-Type", "Authorization"],
// //   })
// // );

// // Debug middleware
// app.use((req, res, next) => {
//   console.log(`Received ${req.method} request at ${req.path}`);
//   next();
// });


// // ===================================================================
// // Create bot instances and set up bot logic
// // ===================================================================
// // Validate tokens before creating bots
// if (!process.env.BOT_TOKEN_CRYPTO || !process.env.BOT_TOKEN_FOREX) {
//   console.error("FATAL ERROR: Bot tokens are not configured in environment variables.");
//   process.exit(1);
// }


// // Create bot instances
// const cryptoBot = new Telegraf<BotContext>(process.env.BOT_TOKEN_CRYPTO!);
// const forexBot = new Telegraf<BotContext>(process.env.BOT_TOKEN_FOREX!);

// // Set botType in context
// cryptoBot.context.botType = "crypto";
// forexBot.context.botType = "forex";

// // Import bot handlers AFTER creating bot instances
// import cryptoBotHandler from "./bots/cryptoBot";
// import forexBotHandler from "./bots/forexBot";

// // Initialize bots
// cryptoBotHandler(cryptoBot);
// forexBotHandler(forexBot);


// // ===================================================================
// // Webhook setup function with enhanced logging
// // ===================================================================
// const setupBots = async () => {
//   const baseUrl = process.env.VERCEL_URL 
//     ? `https://${process.env.VERCEL_URL}` 
//     : 'https://telegram-api-k5mk.vercel.app';

//   console.log(`Setting webhooks for base URL: ${baseUrl}`);
  
//   try {
//     // CRYPTO BOT
//     const cryptoWebhook = `${baseUrl}/webhook/crypto`;
//     console.log(`Setting crypto webhook to: ${cryptoWebhook}`);
    
//     // Add secret token here
//     await cryptoBot.telegram.setWebhook(cryptoWebhook, {
//       secret_token: process.env.WEBHOOK_SECRET
//     });
//     console.log("✅ Crypto webhook set successfully");
    
//     // FOREX BOT
//     const forexWebhook = `${baseUrl}/webhook/forex`;
//     console.log(`Setting forex webhook to: ${forexWebhook}`);
    
//     // Add secret token here
//     await forexBot.telegram.setWebhook(forexWebhook, {
//       secret_token: process.env.WEBHOOK_SECRET
//     });
//     console.log("✅ Forex webhook set successfully");
    
//     return true;
//   } catch (error) {
//     console.error("❌ Webhook setup error:", error);
//     throw error;
//   }
// };

// // Asynchronous initialization
// let isInitialized = false;
// let initializationError: any = null;

// const initializeApp = async () => {
//   try {
//     console.log("🚀 Starting application initialization...");
    
//     // 1. Connect to MongoDB
//     console.log("Connecting to MongoDB...");
//     await connectDB();
//     console.log("✅ MongoDB connected successfully");
    
//     // 2. Set up webhooks
//     console.log("Setting up webhooks...");
//     await setupBots();
    
//     isInitialized = true;
//     console.log("✅✅✅ Application initialization complete ✅✅✅");
//     return true;
//   } catch (error) {
//     console.error("❌❌❌ Initialization failed:", error);
//     initializationError = error;
//     throw error;
//   }
// };


// // Start initialization
// initializeApp().catch((err) => {
//   console.error("Initialization error:", err);
// });

// // Create a wrapper function for webhook handling
// const createWebhookHandler = (bot: Telegraf<BotContext>) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     console.log(`Received ${req.method} request at ${req.path}`);
    
//     if (!isInitialized) {
//       console.log("Server not initialized, returning 503");
//       res.status(503).send("Server initializing. Please try again.");
//       return;
//     }

//     // Verify secret token
//     const receivedToken = req.headers["x-telegram-bot-api-secret-token"];
//     if (receivedToken !== process.env.WEBHOOK_SECRET) {
//       console.warn(
//         `Unauthorized webhook access attempt to ${req.path} endpoint. ` +
//         `Received: ${receivedToken}, Expected: ${process.env.WEBHOOK_SECRET}`
//       );
//       res.status(401).send("Unauthorized");
//       return;
//     }

//     try {
//       console.log("Processing Telegram update");
//       bot.handleUpdate(req.body, res);
//     } catch (error) {
//       console.error(`Webhook error for ${req.path}:`, error);

//       if (!res.headersSent) {
//         res.status(500).send("Internal server error");
//       }
//     }
//   };
// };



// // Start initialization with retry logic
// const MAX_RETRIES = 3;
// let retryCount = 0;

// const startInitialization = async () => {
//   while (retryCount < MAX_RETRIES && !isInitialized) {
//     try {
//       console.log(`Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
//       await initializeApp();
//     } catch (error) {
//       console.error(`Initialization attempt ${retryCount + 1} failed`);
//       retryCount++;
      
//       if (retryCount < MAX_RETRIES) {
//         console.log(`Retrying in 5 seconds...`);
//         await new Promise(resolve => setTimeout(resolve, 5000));
//       } else {
//         console.error("🚨🚨🚨 Maximum initialization attempts reached. Application failed to start. 🚨🚨🚨");
//       }
//     }
//   }
// };

// // Start initialization
// startInitialization();

// // Apply the webhook handlers
// app.post("/webhook/crypto", express.json(), createWebhookHandler(cryptoBot));
// app.post("/webhook/forex", express.json(), createWebhookHandler(forexBot));

// // API Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", cryptoUserRoutes);
// app.use("/api/users", staticticsRoutes);
// app.use("/api/users", forexUserRoutes);
// app.use("/api/admin", adminRoutes);

// // Health check endpoint
// app.get("/health", (req, res) => {
//   const status = isInitialized ? "ok" : "initializing";
//   const error = initializationError ? initializationError.message : null;

//   res.status(200).json({
//     status,
//     error,
//     bots: {
//       crypto: !!process.env.BOT_TOKEN_CRYPTO,
//       forex: !!process.env.BOT_TOKEN_FOREX,
//     },
//     initialized: isInitialized,
//   });
// });

// // Graceful shutdown
// process.once("SIGINT", async () => {
//   console.log("SIGINT received. Shutting down gracefully...");
//   await cryptoBot.stop("SIGINT");
//   await forexBot.stop("SIGTERM");
//   process.exit(0);
// });

// process.once("SIGTERM", async () => {
//   console.log("SIGTERM received. Shutting down gracefully...");
//   await cryptoBot.stop("SIGTERM");
//   await forexBot.stop("SIGTERM");
//   process.exit(0);
// });

// // Error handling middleware
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   const status = err.status || 500;
//   console.error(
//     `❌ Error [${status}] at ${req.method} ${req.path}:`,
//     err.message
//   );

//   // Only send response if headers haven't been sent yet
//   if (!res.headersSent) {
//     res.status(status).json({
//       error: process.env.NODE_ENV === "production" ? null : err,
//       message: err.message || "Internal Server Error",
//     });
//   }
// });

// // 404 Handler
// app.use((req: Request, res: Response) => {
//   res.status(404).json({
//     message: `Endpoint ${req.method} ${req.path} not found`,
//   });
// });

// export default app;

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { Telegraf } from "telegraf";
import { connectDB } from "./config/db";
import { BotContext } from "./telegrafContext";
import cryptoUserRoutes from "./routes/crypto_user.routes";
import forexUserRoutes from "./routes/forex_user.routes";
import staticticsRoutes from "./routes/users_stats.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();

// Load environment variables
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

// Debug environment variables
console.log("Environment variables loaded:");
console.log("CORS_ORIGINS:", process.env.CORS_ORIGINS || "Not set");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("VERCEL_URL:", process.env.VERCEL_URL || "Not set");
console.log("MONGODB_URI:", process.env.MONGODB_URI ? "exists" : "MISSING");
console.log("WEBHOOK_SECRET:", process.env.WEBHOOK_SECRET ? "exists" : "MISSING");

// Validate critical environment variables
const requiredEnvVars = ["BOT_TOKEN_CRYPTO", "BOT_TOKEN_FOREX", "MONGODB_URI", "WEBHOOK_SECRET"];
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingVars);
  process.exit(1);
}

// Middleware setup
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["https://afibie-fx.vercel.app", "http://localhost:3000", "http://localhost:4000"];

// Explicitly handle CORS preflight
app.options("*", (req, res) => {
  const origin = req.headers.origin || "";
  console.log("CORS - Handling OPTIONS for:", req.path, "Origin:", origin);
  if (corsOrigins.includes(origin)) {
    res.set({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Expose-Headers": "Set-Cookie",
    });
    res.status(204).send();
  } else {
    console.log("CORS - Rejected origin:", origin);
    res.status(403).send("CORS origin not allowed");
  }
});

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("CORS - Origin:", origin);
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, origin || corsOrigins[0]);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use((req, res, next) => {
  console.log(`Received ${req.method} request at ${req.path}`);
  next();
});

// Bot setup
const cryptoBot = new Telegraf<BotContext>(process.env.BOT_TOKEN_CRYPTO!);
const forexBot = new Telegraf<BotContext>(process.env.BOT_TOKEN_FOREX!);
cryptoBot.context.botType = "crypto";
forexBot.context.botType = "forex";
import cryptoBotHandler from "./bots/cryptoBot";
import forexBotHandler from "./bots/forexBot";
cryptoBotHandler(cryptoBot);
forexBotHandler(forexBot);

const setupBots = async () => {
  // Hardcode production URL to avoid VERCEL_URL issues
  const baseUrl = "https://telegram-api-k5mk.vercel.app";
  console.log(`Setting webhooks for base URL: ${baseUrl}`);
  try {
    new URL(baseUrl); // Validate URL
    const cryptoWebhook = `${baseUrl}/webhook/crypto`;
    console.log(`Setting crypto webhook to: ${cryptoWebhook}`);
    await cryptoBot.telegram.setWebhook(cryptoWebhook, {
      secret_token: process.env.WEBHOOK_SECRET,
    });
    console.log("✅ Crypto webhook set successfully");
    const forexWebhook = `${baseUrl}/webhook/forex`;
    console.log(`Setting forex webhook to: ${forexWebhook}`);
    await forexBot.telegram.setWebhook(forexWebhook, {
      secret_token: process.env.WEBHOOK_SECRET,
    });
    console.log("✅ Forex webhook set successfully");
    return true;
  } catch (error) {
    console.error("❌ Webhook setup error:", error);
    throw error;
  }
};

let isInitialized = false;
let initializationError: any = null;

const initializeApp = async () => {
  try {
    console.log("🚀 Starting application initialization...");
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected successfully");
    console.log("Setting up webhooks...");
    await setupBots();
    isInitialized = true;
    console.log("✅✅✅ Application initialization complete ✅✅✅");
    return true;
  } catch (error) {
    console.error("❌❌❌ Initialization failed:", error);
    initializationError = error;
    throw error;
  }
};

const MAX_RETRIES = 3;
let retryCount = 0;

const startInitialization = async () => {
  while (retryCount < MAX_RETRIES && !isInitialized) {
    try {
      console.log(`Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
      await initializeApp();
    } catch (error) {
      console.error(`Initialization attempt ${retryCount + 1} failed`);
      retryCount++;
      if (retryCount < MAX_RETRIES) {
        console.log(`Retrying in 5 seconds...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } else {
        console.error("🚨🚨🚨 Maximum initialization attempts reached. Application failed to start. 🚨🚨🚨");
      }
    }
  }
};

startInitialization();

const createWebhookHandler = (bot: Telegraf<BotContext>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log(`Received ${req.method} request at ${req.path}`);
    if (!isInitialized) {
      console.log("Server not initialized, returning 503");
      res.status(503).send("Server initializing. Please try again.");
      return;
    }
    const receivedToken = req.headers["x-telegram-bot-api-secret-token"];
    if (receivedToken !== process.env.WEBHOOK_SECRET) {
      console.warn(
        `Unauthorized webhook access attempt to ${req.path} endpoint. Received: ${receivedToken}, Expected: ${process.env.WEBHOOK_SECRET}`
      );
      res.status(401).send("Unauthorized");
      return;
    }
    try {
      console.log("Processing Telegram update");
      bot.handleUpdate(req.body, res);
    } catch (error) {
      console.error(`Webhook error for ${req.path}:`, error);
      if (!res.headersSent) {
        res.status(500).send("Internal server error");
      }
    }
  };
};

app.post("/webhook/crypto", express.json(), createWebhookHandler(cryptoBot));
app.post("/webhook/forex", express.json(), createWebhookHandler(forexBot));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", cryptoUserRoutes);
app.use("/api/users", staticticsRoutes);
app.use("/api/users", forexUserRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  const status = isInitialized ? "ok" : "initializing";
  const error = initializationError ? initializationError.message : null;
  res.status(200).json({
    status,
    error,
    bots: {
      crypto: !!process.env.BOT_TOKEN_CRYPTO,
      forex: !!process.env.BOT_TOKEN_FOREX,
    },
    initialized: isInitialized,
  });
});

// Graceful shutdown
process.once("SIGINT", async () => {
  console.log("SIGINT received. Shutting down gracefully...");
  await cryptoBot.stop("SIGINT");
  await forexBot.stop("SIGTERM");
  process.exit(0);
});

process.once("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await cryptoBot.stop("SIGTERM");
  await forexBot.stop("SIGTERM");
  process.exit(0);
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  console.error(`❌ Error [${status}] at ${req.method} ${req.path}:`, err.message);
  if (!res.headersSent) {
    res.status(status).json({
      error: process.env.NODE_ENV === "production" ? null : err,
      message: err.message || "Internal Server Error",
    });
  }
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `Endpoint ${req.method} ${req.path} not found`,
  });
});

export default app;