

// import express, { Request, Response, NextFunction } from "express";
// import cors from "cors";
// import helmet from "helmet";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";
// import cryptoBot from "./bots/cryptoBot";
// import forexBot from "./bots/forexBot";
// import { connectDB } from "./config/db";

// // Import routes
// import cryptoUserRoutes from "./routes/crypto_user.routes";
// import forexUserRoutes from "./routes/forex_user.routes";
// import staticticsRoutes from "./routes/users_stats.routes";
// import authRoutes from "./routes/auth.routes";
// import adminRoutes from "./routes/admin.routes";

// const app = express();
// dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' })

// // Middleware setup
// app.use(helmet());
// app.use(express.json());
// app.use(cookieParser());

// const corsOrigins = process.env.CORS_ORIGINS
//   ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
//   : ['https://your-frontend.vercel.app'];

// app.use(cors({
//   origin: corsOrigins,
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // Debug middleware
// app.use((req, res, next) => {
//   console.log(`Received ${req.method} request at ${req.path}`);
//   next();
// });

// // Asynchronous initialization
// let isInitialized = false;
// let initializationError: any = null;

// const initializeApp = async () => {
//   try {
//     console.log("Starting application initialization...");
    
//     // 1. Connect to MongoDB
//     await connectDB();
//     console.log("✅ MongoDB connected successfully");
    
//     // 2. Set up webhooks
//     const baseUrl = process.env.VERCEL_URL 
//       ? `https://${process.env.VERCEL_URL}` 
//       : 'https://telegram-api-k5mk.vercel.app';
    
//     console.log(`Setting webhooks for base URL: ${baseUrl}`);
    
//     // Set webhooks and get responses
//     const [cryptoResponse, forexResponse] = await Promise.all([
//       cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`),
//       forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`)
//     ]);
    
//     console.log(`Crypto webhook response: ${cryptoResponse}`);
//     console.log(`Forex webhook response: ${forexResponse}`);
    
//     isInitialized = true;
//     console.log("✅ Application initialization complete");
//   } catch (error) {
//     console.error("❌ Initialization failed:", error);
//     initializationError = error;
//     throw error;
//   }
// };

// // Start initialization but don't block server start
// initializeApp().catch(err => {
//   console.error("Initialization error:", err);
// });

// // Webhook handlers with initialization check
// app.post('/webhook/crypto', (req, res) => {
//   if (!isInitialized) {
//     setTimeout(() => {
//       if (!isInitialized) {
//         return res.status(503).send("Server initializing. Please try again.");
//       }
//       // Process the update after initialization
//       cryptoBot.handleUpdate(req.body, res);
//     }, 1000);
//   } else {
//     cryptoBot.handleUpdate(req.body, res);
//   }
// });

// app.post('/webhook/forex', (req, res) => {
//   if (!isInitialized) {
//     setTimeout(() => {
//       if (!isInitialized) {
//         return res.status(503).send("Server initializing. Please try again.");
//       }
//       // Process the update after initialization
//       forexBot.handleUpdate(req.body, res);
//     }, 1000);
//   } else {
//     forexBot.handleUpdate(req.body, res);
//   }
// });

// // API Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users", cryptoUserRoutes);
// app.use("/api/users", staticticsRoutes);
// app.use("/api/users", forexUserRoutes);
// app.use("/api/admin", adminRoutes);

// // Health check endpoint
// app.get('/health', (req, res) => {
//   const status = isInitialized ? 'ok' : 'initializing';
//   const error = initializationError ? initializationError.message : null;
//   res.status(200).json({ 
//     status, 
//     error,
//     bots: ['crypto', 'forex'],
//     initialized: isInitialized
//   });
// });

// // Test endpoint for webhooks
// app.get('/webhook-test', (req, res) => {
//   res.status(200).json({ status: 'Webhook test successful' });
// });

// app.post('/webhook-test', (req, res) => {
//   console.log('Received webhook test:', req.body);
//   res.status(200).send('OK');
// });

// // Graceful shutdown
// process.once('SIGINT', async () => {
//   console.log("SIGINT received. Shutting down gracefully...");
//   await cryptoBot.stop('SIGINT');
//   await forexBot.stop('SIGINT');
//   process.exit(0);
// });

// process.once('SIGTERM', async () => {
//   console.log("SIGTERM received. Shutting down gracefully...");
//   await cryptoBot.stop('SIGTERM');
//   await forexBot.stop('SIGTERM');
//   process.exit(0);
// });

// // Error handling middleware
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   const status = err.status || 500;
//   console.error(`❌ Error [${status}] at ${req.method} ${req.path}:`, err.message, err.stack);
  
//   res.status(status).json({
//     error: process.env.NODE_ENV === "production" ? null : err,
//     message: err.message || "Internal Server Error"
//   });
// });

// // 404 Handler
// app.use((req: Request, res: Response) => {
//   res.status(404).json({
//     message: `Endpoint ${req.method} ${req.path} not found`
//   });
// });

// export default app;



import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cryptoBot from "./bots/cryptoBot";
import forexBot from "./bots/forexBot";
import { connectDB } from "./config/db";

// Import routes
import cryptoUserRoutes from "./routes/crypto_user.routes";
import forexUserRoutes from "./routes/forex_user.routes";
import staticticsRoutes from "./routes/users_stats.routes";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.local' })

// Middleware setup
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['https://your-frontend.vercel.app'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Debug middleware
app.use((req, res, next) => {
  console.log(`Received ${req.method} request at ${req.path}`);
  next();
});

// ===================================================================
// ADDED: Webhook setup function
// ===================================================================
const setupBots = async () => {
  if (!process.env.BOT_TOKEN_CRYPTO || !process.env.BOT_TOKEN_FOREX) {
    throw new Error("Bot tokens are not configured");
  }

  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'https://telegram-api-k5mk.vercel.app';

  console.log(`Setting webhooks for base URL: ${baseUrl}`);
  
  try {
    // CRYPTO BOT
    await cryptoBot.telegram.setWebhook(`${baseUrl}/webhook/crypto`);
    console.log("Crypto webhook set successfully");
    
    // FOREX BOT
    await forexBot.telegram.setWebhook(`${baseUrl}/webhook/forex`);
    console.log("Forex webhook set successfully");
  } catch (error) {
    console.error("Webhook setup error:", error);
    throw error;
  }
};

// Asynchronous initialization
let isInitialized = false;
let initializationError: any = null;

const initializeApp = async () => {
  try {
    console.log("Starting application initialization...");
    
    // 1. Connect to MongoDB
    await connectDB();
    console.log("✅ MongoDB connected successfully");
    
    // 2. Set up webhooks using the new function
    // =====================================================
    // REPLACED: Old webhook setup with setupBots call
    // =====================================================
    await setupBots();
    
    isInitialized = true;
    console.log("✅ Application initialization complete");
  } catch (error) {
    console.error("❌ Initialization failed:", error);
    initializationError = error;
    throw error;
  }
};

// Start initialization but don't block server start
initializeApp().catch(err => {
  console.error("Initialization error:", err);
});

// Webhook handlers with initialization check
app.post('/webhook/crypto', (req, res) => {
  if (!isInitialized) {
    setTimeout(() => {
      if (!isInitialized) {
        return res.status(503).send("Server initializing. Please try again.");
      }
      // Process the update after initialization
      cryptoBot.handleUpdate(req.body, res);
    }, 1000);
  } else {
    cryptoBot.handleUpdate(req.body, res);
  }
});

app.post('/webhook/forex', (req, res) => {
  if (!isInitialized) {
    setTimeout(() => {
      if (!isInitialized) {
        return res.status(503).send("Server initializing. Please try again.");
      }
      // Process the update after initialization
      forexBot.handleUpdate(req.body, res);
    }, 1000);
  } else {
    forexBot.handleUpdate(req.body, res);
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", cryptoUserRoutes);
app.use("/api/users", staticticsRoutes);
app.use("/api/users", forexUserRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const status = isInitialized ? 'ok' : 'initializing';
  const error = initializationError ? initializationError.message : null;
  res.status(200).json({ 
    status, 
    error,
    bots: ['crypto', 'forex'],
    initialized: isInitialized
  });
});

// Test endpoint for webhooks
app.get('/webhook-test', (req, res) => {
  res.status(200).json({ status: 'Webhook test successful' });
});

app.post('/webhook-test', (req, res) => {
  console.log('Received webhook test:', req.body);
  res.status(200).send('OK');
});

// Graceful shutdown
process.once('SIGINT', async () => {
  console.log("SIGINT received. Shutting down gracefully...");
  await cryptoBot.stop('SIGINT');
  await forexBot.stop('SIGINT');
  process.exit(0);
});

process.once('SIGTERM', async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await cryptoBot.stop('SIGTERM');
  await forexBot.stop('SIGTERM');
  process.exit(0);
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  console.error(`❌ Error [${status}] at ${req.method} ${req.path}:`, err.message, err.stack);
  
  res.status(status).json({
    error: process.env.NODE_ENV === "production" ? null : err,
    message: err.message || "Internal Server Error"
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    message: `Endpoint ${req.method} ${req.path} not found`
  });
});

export default app;