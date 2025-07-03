
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
//   console.log(`Received request at ${req.path} with body:`, req.body);
//   next();
// });

// // Webhook setup within an async context
// const baseUrl = 'https://telegram-api-k5mk.vercel.app';
// (async () => {
//   try {
//     console.log("Initializing webhooks...");
//     const cryptoWebhook = await cryptoBot.createWebhook({ domain: baseUrl });
//     app.use('/webhook/crypto', (req, res, next) => {
//       console.log('Crypto webhook middleware hit:', req.body);
//       cryptoWebhook(req, res, next);
//     });

//     console.log("Initializing forex webhooks...");
//     const forexWebhook = await forexBot.createWebhook({ domain: baseUrl });
//     app.use('/webhook/forex', (req, res, next) => {
//       console.log('Forex webhook middleware hit:', req.body);
//       forexWebhook(req, res, next);
//     });

//     console.log("Webhooks initialized successfully");
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error("Webhook initialization failed:", error.message);
//     } else {
//       console.error("Webhook initialization failed:", error);
//     }
//   }
// })();

// // Database and webhook registration
// (async () => {
//   try {
//     console.log("Attempting to connect to MongoDB...");
//     await connectDB();
//     console.log("MongoDB connected successfully");

//     const baseUrl = 'https://telegram-api-k5mk.vercel.app';
//     console.log("Starting webhook setup with setWebhook...");
//     const cryptoResponse = await cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`);
//     console.log("Crypto webhook response:", JSON.stringify(cryptoResponse));
//     const forexResponse = await forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`);
//     console.log("Forex webhook response:", JSON.stringify(forexResponse));
//     console.log("Webhooks configured for crypto and forex bots");
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error("Initialization failed:", error.message, error.stack);
//     } else {
//       console.error("Initialization failed:", String(error));
//     }
//   }
// })();

// // Calling your Routes Layout
// app.use("/api/auth", authRoutes);
// app.use("/api/users", cryptoUserRoutes);
// app.use("/api/users", staticticsRoutes);
// app.use("/api/users", forexUserRoutes);
// app.use("/api/admin", adminRoutes);

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
//   console.error(`Error handler triggered: ${err.message}`, err.stack);
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
//   console.log(`Received request at ${req.path} with body:`, req.body);
//   next();
// });


// // ... other imports ...
// let isInitialized = false;
// const initializationPromise = initializeApp();

// async function initializeApp() {
//   if (isInitialized) return;
  
//   console.log("Starting app initialization...");
//   try {
//     // 1. Connect to MongoDB
//     await connectDB();
    
//     // 2. Setup webhook endpoints
//     const baseUrl = 'https://telegram-api-k5mk.vercel.app';
//     const cryptoWebhook = await cryptoBot.createWebhook({ domain: baseUrl });
//     const forexWebhook = await forexBot.createWebhook({ domain: baseUrl });
    
//     app.use('/webhook/crypto', (req, res, next) => {
//       cryptoWebhook(req, res, next);
//     });
    
//     app.use('/webhook/forex', (req, res, next) => {
//       forexWebhook(req, res, next);
//     });
    
//     // 3. Register webhooks with Telegram
//     await cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`);
//     await forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`);
    
//     console.log("✅ App initialization complete");
//     isInitialized = true;
//   } catch (error) {
//     console.error("❌ Initialization failed:", error);
//     throw error;
//   }
// }

// // Add initialization middleware
// const initializationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   if (!isInitialized) {
//     try {
//       await initializationPromise;
//     } catch (err) {
//       res.status(500).send("Server initializing... try again in 10 seconds");
//       return;
//     }
//   }
//   next();
// };
// app.use(initializationMiddleware);

// // ... rest of your routes and middleware ...


// app.get('/webhook-test', (req, res) => {
//   res.status(200).json({ status: 'Webhook test successful' });
// });

// app.post('/webhook-test', (req, res) => {
//   console.log('Received webhook test:', req.body);
//   res.status(200).send('OK');
// });

// // Calling your Routes Layout
// app.use("/api/auth", authRoutes);
// app.use("/api/users", cryptoUserRoutes);
// app.use("/api/users", staticticsRoutes);
// app.use("/api/users", forexUserRoutes);
// app.use("/api/admin", adminRoutes);

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
//   console.error(`Error handler triggered: ${err.message}`, err.stack);
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
//   console.log(`Received request at ${req.path} with body:`, req.body);
//   next();
// });

// // Initialization state
// let isInitialized = false;
// let initializationError: Error | null = null;
// const initializationPromise = initializeApp();

// async function initializeApp() {
//   if (isInitialized) return;

//   console.log("Starting app initialization...");
//   try {
//     // 1. Connect to MongoDB with retry logic
//     let attempts = 0;
//     const maxAttempts = 3;
//     while (attempts < maxAttempts) {
//       try {
//         console.log(`Attempting MongoDB connection (Attempt ${attempts + 1}/${maxAttempts})...`);
//         await connectDB();
//         console.log("MongoDB connected successfully");
//         break;
//       } catch (dbError) {
//         attempts++;
//         if (attempts === maxAttempts) throw dbError;
//         console.warn(
//           `MongoDB connection failed, retrying in 2 seconds:`,
//           dbError instanceof Error ? dbError.message : dbError
//         );
//         await new Promise(resolve => setTimeout(resolve, 2000));
//       }
//     }

//     // 2. Setup webhook endpoints
//     const baseUrl = 'https://telegram-api-k5mk.vercel.app';
//     const cryptoWebhook = await cryptoBot.createWebhook({ domain: baseUrl, path: '/webhook/crypto' });
//     const forexWebhook = await forexBot.createWebhook({ domain: baseUrl, path: '/webhook/forex' });

//     // Apply webhook middleware with explicit paths
//     app.use('/webhook/crypto', (req, res, next) => {
//       console.log('Crypto webhook middleware hit:', req.body);
//       cryptoWebhook(req, res, next);
//     });

//     app.use('/webhook/forex', (req, res, next) => {
//       console.log('Forex webhook middleware hit:', req.body);
//       forexWebhook(req, res, next);
//     });

//     // 3. Register webhooks with Telegram (ensure path matches)
//     await cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`);
//     await forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`);

//     console.log("✅ App initialization complete");
//     isInitialized = true;
//   } catch (error) {
//     if (error instanceof Error) {
//       console.error("❌ Initialization failed:", error.message, error.stack);
//       initializationError = error;
//     } else {
//       console.error("❌ Initialization failed:", error);
//       initializationError = new Error(String(error));
//     }
//     throw error;
//   }
// }

// // Initialization middleware
// const initializationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
//   if (!isInitialized) {
//     try {
//       await initializationPromise;
//     } catch (err) {
//       console.error("Initialization middleware error:", (err as Error).message, (err as Error).stack);
//       if (initializationError) {
//         res.status(500).json({
//           err: process.env.NODE_ENV === "production" ? null : initializationError,
//           msg: `Server initialization failed: ${initializationError.message}. Please try again later.`,
//           data: null,
//         });
//       } else {
//         res.status(503).send("Server initializing... try again in 10 seconds");
//       }
//       return;
//     }
//   }
//   next();
// };
// app.use(initializationMiddleware);

// // Test routes
// app.get('/webhook-test', (req, res) => {
//   res.status(200).json({ status: 'Webhook test successful' });
// });

// app.post('/webhook-test', (req, res) => {
//   console.log('Received webhook test:', req.body);
//   res.status(200).send('OK');
// });

// // Calling your Routes Layout
// app.use("/api/auth", authRoutes);
// app.use("/api/users", cryptoUserRoutes);
// app.use("/api/users", staticticsRoutes);
// app.use("/api/users", forexUserRoutes);
// app.use("/api/admin", adminRoutes);

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
//   console.error(`Error handler triggered: ${err.message}`, err.stack);
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

// Initialization state
let isInitialized = false;
let initializationError: Error | null = null;
const initializationPromise = initializeApp();

async function initializeApp() {
  if (isInitialized) return;

  console.log("Starting app initialization (single attempt with delay)...");
  try {
    // 1. Skip MongoDB connection to avoid rate limits
    console.log("Skipping MongoDB connection to avoid rate limits...");

    // Add a longer delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    // 2. Setup webhook endpoints only if not already set
    const baseUrl = 'https://telegram-api-k5mk.vercel.app';
    const cryptoWebhook = await cryptoBot.createWebhook({ domain: baseUrl, path: '/webhook/crypto' });
    const forexWebhook = await forexBot.createWebhook({ domain: baseUrl, path: '/webhook/forex' });

    // Apply webhook middleware immediately
    app.use('/webhook/crypto', (req, res, next) => {
      console.log('Crypto webhook middleware hit:', req.body);
      cryptoWebhook(req, res, next);
    });

    app.use('/webhook/forex', (req, res, next) => {
      console.log('Forex webhook middleware hit:', req.body);
      forexWebhook(req, res, next);
    });

    // 3. Register webhooks with Telegram only if not already registered
    const webhookInfo = await cryptoBot.telegram.getWebhookInfo();
    if (!webhookInfo.url || webhookInfo.url !== `${baseUrl}/webhook/crypto`) {
      console.log("Registering crypto webhook with Telegram...");
      await cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`);
    }
    if (!webhookInfo.url || webhookInfo.url !== `${baseUrl}/webhook/forex`) {
      console.log("Registering forex webhook with Telegram...");
      await forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`);
    }

    console.log("✅ App initialization complete (no DB, rate limit aware)");
    isInitialized = true;
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Initialization failed:", error.message, error.stack);
      initializationError = error;
    } else {
      console.error("❌ Initialization failed:", error);
      initializationError = new Error(String(error));
    }
    if ((error as any).code === 429) {
      console.warn("Rate limit hit (429), initialization deferred. Please wait and retry.");
      // Do not throw, allow middleware to handle with 429
    } else {
      throw error;
    }
  }
}

// Initialization middleware
const initializationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!isInitialized) {
    try {
      await initializationPromise;
    } catch (err) {
      console.error("Initialization middleware error:", (err as Error).message, (err as Error).stack);
      if (initializationError && (initializationError as any).code === 429) {
        res.status(429).json({
          err: process.env.NODE_ENV === "production" ? null : initializationError,
          msg: "Rate limit exceeded. Please wait 1 minute and try again.",
          data: null,
        });
      } else if (initializationError) {
        res.status(500).json({
          err: process.env.NODE_ENV === "production" ? null : initializationError,
          msg: `Server initialization failed: ${initializationError.message}. Please try again later.`,
          data: null,
        });
      } else {
        res.status(503).send("Server initializing... please wait and try again");
      }
      return;
    }
  }
  next();
};
app.use(initializationMiddleware);

// Test routes
app.get('/webhook-test', (req, res) => {
  res.status(200).json({ status: 'Webhook test successful' });
});

app.post('/webhook-test', (req, res) => {
  console.log('Received webhook test:', req.body);
  res.status(200).send('OK');
});

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