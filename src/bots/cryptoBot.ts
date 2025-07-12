// import { Telegraf, Markup } from "telegraf";
// import { message } from "telegraf/filters";
// import { ICRYPTO_User, CryptoUserModel } from "../models/crypto_user.model";
// import { sendAdminAlertCrypto } from "../utils/services/notifier-crypto";
// import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
// import { isValidUID } from "../utils/validate";
// import rateLimit from "telegraf-ratelimit";
// import mongoose from "mongoose";
// import { session } from "telegraf-session-mongodb";
// import { BotContext } from "../telegrafContext";
// import dotenv from "dotenv";

// dotenv.config();

// // Export as default function that receives bot instance

// const VIDEO_FILE_ID = process.env.BYBIT_VIDEO_FILE_ID;
// export default function (bot: Telegraf<BotContext>) {
//   // Add session setup at the BEGINNING
//   if (mongoose.connection.readyState === 1) {
//     const db = mongoose.connection.db;
//     if (db) {
//       bot.use(
//         session(db, {
//           sessionName: "session",
//           collectionName: "crypto_sessions",
//         })
//       );
//       console.log("✅ Crypto Bot MongoDB session connected");
//     } else {
//       console.error(
//         "❌ Mongoose connected but db is undefined. Crypto session middleware skipped"
//       );
//     }
//   } else {
//     console.error(
//       "❌ Mongoose not connected. Crypto session middleware skipped"
//     );
//   }

//   // Replace the session middleware with:
//   bot.use(async (ctx, next) => {
//     // Initialize session if it doesn't exist
//     if (!ctx.session) {
//       ctx.session = {
//         step: "welcome",
//         botType: ctx.botType || "crypto",
//       };
//     }
//     return next();
//   });

//   const userSession: Record<string, any> = {};

//   // Notify user on status change
//   async function notifyUserOnStatusChange(change: any) {
//     const user = change.fullDocument as ICRYPTO_User;
//     if (!user || !user.telegramId) return;

//     if (user.status === "approved") {
//       await bot.telegram.sendMessage(
//         user.telegramId,
//         `<b>🎉 Congratulations!</b> Your registration has been approved. ✅\n\n` +
//           `🔗 <b>Welcome to Afibie Signal Group!</b> 🚀\n\n` +
//           `👉 To get started, type <b>/getlink</b> to receive your exclusive invite link.\n\n` +
//           `⚠️ <i>Note:</i> This link is time-sensitive and may expire soon.\n\n` +
//           `🔥 <i>Enjoy your journey and happy trading!</i> 📈`,
//         { parse_mode: "HTML" }
//       );
//     } else if (user.status === "rejected") {
//       const isBybit = !!user.bybitUid;
//       const uidType = isBybit ? "Bybit" : "Blofin";
//       const userUid = isBybit ? user.bybitUid : user.blofinUid;
//       const registerLink = isBybit
//         ? process.env.BYBIT_LINK
//         : process.env.BLOFIN_LINK;

//       const caption =
//         `<b>🚫 Application Rejected</b>\n\n` +
//         `👤 <b>Your ${uidType} UID:</b> <code>${userUid}</code>\n` +
//         `⚠️ <i>This UID was not registered using our affiliate link.</i>\n\n` +
//         `<b>👉 What to do:</b>\n` +
//         `1️⃣ <b>Create a new ${uidType} account</b> using our official affiliate link below:\n` +
//         `<a href="${registerLink}">🔗 Register Here</a>\n\n` +
//         `2️⃣ After registration, <b>click /start</b> to begin the process again.\n\n` +
//         `🎥 <b>Need help?</b> Watch the step-by-step guide in the video above.\n\n` +
//         `<i>Thank you for your understanding and cooperation!</i> 🙏`;

//       try {
//         if (VIDEO_FILE_ID) {
//           await bot.telegram.sendVideo(user.telegramId, VIDEO_FILE_ID, {
//             caption,
//             parse_mode: "HTML",
//           });
//         } else {
//           // fallback if video is missing
//           await bot.telegram.sendMessage(user.telegramId, caption, {
//             parse_mode: "HTML",
//           });
//         }
//       } catch (error) {
//         console.error("Error sending rejection message:", error);
//       }
//     }
//   }

//   // Watch for status changes in MongoDB
//   async function watchUserStatusChanges() {
//     const changeStream = CryptoUserModel.watch([], {
//       fullDocument: "updateLookup",
//     });
//     changeStream.on("change", (change) => {
//       if (
//         change.operationType === "update" &&
//         change.updateDescription.updatedFields?.status
//       ) {
//         notifyUserOnStatusChange(change);
//       }
//     });
//   }

//   const getLinkLimiter = rateLimit({
//     window: 60_000,
//     limit: 3,
//     onLimitExceeded: (ctx: any) =>
//       ctx.reply("🚫 Too many link requests! Try again later."),
//   });

//   bot.start(async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     if (!userId) return;

//     userSession[userId] = { step: "welcome", botType: "crypto" };

//     await ctx.replyWithHTML(
//       `<b>🛠 Welcome to <u>Afibie Crypto Signals</u>! 🚀</b>\n\n` +
//         `📈 <i>Home of Exclusive Futures Trade Signals</i>\n\n` +
//         `<b>To gain access, complete these steps:</b>\n\n` +
//         `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
//         `✅ <b>Step 2:</b> Choose Your Country 🌍\n` +
//         `✅ <b>Step 3:</b> Register on <b>Bybit</b> / <b>Blofin</b> and provide your <b>Login UID</b> \n` +
//         `✅ <b>Step 4:</b> Wait for Verification ⏳\n\n` +
//         `👉 <b>Click the <b>Continue</b> button to start:</b>`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("🔵 CONTINUE", "continue_to_captcha"),
//       ])
//     );
//   });

//   bot.action("continue_to_captcha", async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "welcome") return;

//     session.step = "captcha";
//     const captcha = generateCaptcha();
//     session.captcha = captcha;

//     await ctx.replyWithHTML(
//       `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
//         `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
//         `👉 <b>Type this number:</b> <code>${captcha}</code>`
//     );
//   });

//   bot.command("getlink", getLinkLimiter, async (ctx) => {
//     const tgId = ctx.from?.id?.toString();
//     if (!tgId) return;

//     const user = await CryptoUserModel.findOne({
//       telegramId: tgId,
//       botType: "crypto",
//     });
//     if (!user || user.status !== "approved") {
//       await ctx.replyWithHTML(
//         `<b>⚠️ Access Denied</b>\n\n` +
//           `⛔ <i>Your access link has expired or you are not yet approved.</i>\n` +
//           `📩 Please contact an admin for assistance.`
//       );
//       return;
//     }

//     try {
//       const inviteLink = await bot.telegram.createChatInviteLink(
//         process.env.GROUP_CHAT_ID!,
//         {
//           expire_date: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
//           member_limit: 1,
//         }
//       );
//       await ctx.replyWithHTML(
//         `<b>🎉 Access Granted!</b>\n\n` +
//           `🔗 <b>Your Exclusive Group Link:</b>\n` +
//           `<a href="${inviteLink.invite_link}">${inviteLink.invite_link}</a>\n\n` +
//           `⚠️ <i>This link can only be used once and will expire in 30 minutes.</i>`
//       );
//     } catch (error) {
//       console.error("Error generating invite link:", error);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to generate invite link. Please try again later or contact an admin.`
//       );
//     }
//   });

//   bot.on(message("text"), async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     const text = ctx.message.text.trim();
//     if (!session) return;

//     switch (session.step) {
//       case "captcha": {
//         if (verifyCaptcha(text, session.captcha)) {
//           session.step = "captcha_confirmed";
//           await ctx.replyWithHTML(
//             `✅ <b>Correct!</b>\n\n` +
//               `You've passed the captcha verification.\n\n` +
//               `👉 Click the <b>Continue</b> button to proceed to country selection.`,
//             Markup.inlineKeyboard([
//               Markup.button.callback("🔵 CONTINUE", "continue_to_country"),
//             ])
//           );
//         } else {
//           const newCaptcha = generateCaptcha();
//           session.captcha = newCaptcha;
//           await ctx.replyWithHTML(
//             `❌ <b>Incorrect Captcha</b>\n\n` +
//               `🚫 Please try again:\n` +
//               `👉 Type this number: <b>${newCaptcha}</b>`
//           );
//         }
//         break;
//       }

//       case "country": {
//         const normalized = text.trim().toLowerCase();
//         session.country = text;
//         const isUSA = [
//           "usa",
//           "us",
//           "united states",
//           "united states of america",
//         ].includes(normalized);
//         const isUK = [
//           "uk",
//           "united kingdom",
//           "england",
//           "great britain",
//         ].includes(normalized);
//         const isCanada = ["canada"].includes(normalized);

//         if (isUSA || isUK || isCanada) {
//           session.step = "blofin_confirmed";
//           session.requiresBoth = false;
//           await ctx.replyWithHTML(
//             `<b>🌍 Country Selected: ${text}</b>\n\n` +
//               `You've chosen your country.\n\n` +
//               `👉 Click the <b>Continue</b> button to proceed with Blofin registration.`,
//             Markup.inlineKeyboard([
//               Markup.button.callback("🔵 CONTINUE", "continue_to_blofin"),
//             ])
//           );
//         } else {
//           session.step = "bybit_confirmed";
//           session.requiresBoth = true;
//           await ctx.replyWithHTML(
//             `<b>🌍 Country Selected: ${text}</b>\n\n` +
//               `You've chosen your country.\n\n` +
//               `👉 Click the <b>Continue</b> button to proceed with Bybit registration. You will also need to register with Blofin.`,
//             Markup.inlineKeyboard([
//               Markup.button.callback("🔵 CONTINUE", "continue_to_bybit"),
//             ])
//           );
//         }
//         break;
//       }

//       case "bybit_uid": {
//         if (!isValidUID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid UID</b>\n\n` +
//               `🚫 Enter a <b>numeric UID</b> between <b>5 to 20 digits</b>.\n\n` +
//               `📌 <i>Example:</i> <code>123456789</code>`
//           );
//           return;
//         }
//         session.bybitUid = text;
//         if (session.requiresBoth) {
//           session.step = "blofin_confirmed";
//           await ctx.replyWithHTML(
//             `<b>✅ Bybit UID Submitted</b>\n` +
//               `You've provided your Bybit UID.\n\n` +
//               `👉 Click the <b>Continue</b> button to proceed with Blofin registration.`,
//             Markup.inlineKeyboard([
//               Markup.button.callback("🔵 CONTINUE", "continue_to_blofin"),
//             ])
//           );
//         } else {
//           session.step = "final_confirmation";
//           await ctx.replyWithHTML(
//             `<b>Final Confirmation</b>\n\n` +
//               `📌 <b>Your Details:</b>\n` +
//               `Blofin UID: ${session.blofinUid || "Not provided"}\n\n` +
//               `👉 Click the <b>Confirm</b> button to submit your details.`,
//             Markup.inlineKeyboard([
//               Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//             ])
//           );
//         }
//         break;
//       }

//       case "blofin_uid": {
//         if (!isValidUID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid UID</b>\n\n` +
//               `🚫 Enter a <b>numeric UID</b> between <b>5 to 20 digits</b>.\n\n` +
//               `📌 <i>Example:</i> <code>123456789</code>`
//           );
//           return;
//         }
//         session.blofinUid = text;
//         session.step = "final_confirmation";
//         const details = session.requiresBoth
//           ? `Bybit UID: ${session.bybitUid || "Not provided"}\nBlofin UID: ${
//               session.blofinUid || "Not provided"
//             }`
//           : `Blofin UID: ${session.blofinUid || "Not provided"}`;
//         await ctx.replyWithHTML(
//           `<b>✅ Blofin UID Submitted</b>\n\n` +
//             `Final Confirmation\n\n` +
//             `📌 <b>Your Details:</b>\n` +
//             `${details}\n\n` +
//             `👉 Click the <b>Confirm</b> button to submit your details.`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//           ])
//         );
//         break;
//       }
//     }
//   });

//   bot.action("continue_to_country", async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "captcha_confirmed") return;

//     session.step = "country";
//     await ctx.replyWithHTML(
//       `<b>🚀 Step 2: Country Selection</b>\n\n` +
//         `🌍 What is your country of residence?`,
//       Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]])
//         .oneTime()
//         .resize()
//     );
//   });

//   bot.action("continue_to_bybit", async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "bybit_confirmed") return;

//     session.step = "bybit_link";

//     // const VIDEO_FILE_ID = process.env.BYBIT_VIDEO_FILE_ID;

//     if (!VIDEO_FILE_ID) {
//       await ctx.replyWithHTML(
//         `<b>📈 Step 3: Bybit Registration</b>\n\n` +
//           `<b>Why Bybit?</b>\n` +
//           `📊 <i>Most Trustworthy Exchange</i>\n\n` +
//           `📌 <b>Sign up here</b> 👉 <a href="${process.env.BYBIT_LINK}">Bybit Registration Link</a>\n\n` +
//           `❗ <b>Important:</b> If you already have a Bybit account, you <u>cannot</u> gain access.\n\n` +
//           `✅ Watch the video above to learn how to register properly and gain access.\n\n` +
//           `\n\n<b>✅ Once done, click the "Done" button below to continue.</b>`,
//         Markup.inlineKeyboard([Markup.button.callback("🔵 Done", "done_bybit")])
//       );
//       return;
//     }

//     try {
//       await ctx.replyWithVideo(VIDEO_FILE_ID, {
//         caption:
//           `<b>📈 Step 3: Bybit Registration</b>\n\n` +
//           `<b>Why Bybit?</b>\n` +
//           `📊 <i>Most Trustworthy Exchange</i>\n\n` +
//           `📌 <b>Sign up here</b> 👉 <a href="${process.env.BYBIT_LINK}">Bybit Registration Link</a>\n\n` +
//           `❗ <b>Important:</b> If you already have a Bybit account, you <u>cannot</u> gain access.\n\n` +
//           `✅ Watch the video above to learn how to register properly and gain access.` +
//           `✅ Once done, click the <b>Done</b> button to continue.`,
//         parse_mode: "HTML",
//         reply_markup: Markup.inlineKeyboard([
//           Markup.button.callback("🔵 Done", "done_bybit"),
//         ]).reply_markup,
//       });
//     } catch (error) {
//       console.error("Error sending video:", error);
//       await ctx.replyWithHTML(
//         `<b>📈 Step 3: Bybit Registration</b>\n\n` +
//           `<b>Why Bybit?</b>\n` +
//           `📊 <i>Most Trustworthy Exchange</i>\n\n` +
//           `📌 <b>Sign up here</b> 👉 <a href="${process.env.BYBIT_LINK}">Bybit Registration Link</a>\n\n` +
//           `❗ <b>Important:</b> If you already have a Bybit account, you <u>cannot</u> gain access.\n\n` +
//           `❌ Video unavailable. Please try again later or contact support.\n\n` +
//           `✅ Once done, click the <b>Done</b> button to continue.`,
//         Markup.inlineKeyboard([Markup.button.callback("🔵 Done", "done_bybit")])
//       );
//     }
//   });

//   bot.action("continue_to_blofin", async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "blofin_confirmed") return;

//     session.step = "blofin_link";
//     await ctx.replyWithHTML(
//       `<b>🚀 Step 3: Blofin Registration</b>\n\n` +
//         `<b>Why Blofin?</b>\n` +
//         `🌍 <i>Global Access</i> - <u>No KYC required!</u>\n\n` +
//         `📌 <b>Sign up here</b> 👉 <a href="${process.env.BLOFIN_LINK}">Blofin Registration Link</a>\n\n` +
//         `✅ After registering, click the <b>Done</b> button to continue.`,
//       Markup.inlineKeyboard([Markup.button.callback("🔵 Done", "done_blofin")])
//     );
//   });

//   bot.action("done_bybit", async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "bybit_link") return;

//     session.step = "bybit_uid";
//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Bybit UID</b>\n\n` +
//         `Please enter your <b>Bybit UID</b> below to proceed.\n\n` +
//         `💡 <i>You can find your UID in the account/profile section of the Bybit app or website.</i>\n\n` +
//         `📌 <b>Example:</b> <code>12345678</code>`
//     );
//   });

//   bot.action("done_blofin", async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "blofin_link") return;

//     session.step = "blofin_uid";
//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Blofin UID</b>\n\n` +
//         `Please enter your <b>Blofin UID</b> below to continue.\n\n` +
//         `💡 <i>You can find your UID in the account section of the Blofin platform after logging in.</i>\n\n` +
//         `📌 <b>Example:</b> <code>87654321</code>`
//     );
//   });

//   bot.action("confirm_final", async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "final_confirmation") return;

//     session.step = "final";
//     await saveAndNotify(ctx, session);
//   });

//   async function saveAndNotify(ctx: any, session: any) {
//     const telegramId = ctx.from.id.toString();
//     const updatePayload: Partial<ICRYPTO_User> = {
//       telegramId,
//       username: ctx.from.username,
//       fullName: `${ctx.from.first_name || ""} ${
//         ctx.from.last_name || ""
//       }`.trim(),
//       botType: "crypto",
//       country: session.country,
//       status: "pending",
//     };

//     if (session.bybitUid) {
//       updatePayload.bybitUid = session.bybitUid;
//       updatePayload.registeredVia = session.requiresBoth ? "both" : "bybit";
//     }
//     if (session.blofinUid) {
//       updatePayload.blofinUid = session.blofinUid;
//       if (!session.bybitUid) {
//         updatePayload.registeredVia = "blofin";
//       }
//     }

//     const user = await CryptoUserModel.findOneAndUpdate(
//       { telegramId, botType: session.botType },
//       updatePayload,
//       { upsert: true, new: true }
//     );

//     await ctx.replyWithHTML(
//       `<b>✅ Submission Successful!</b>\n\n` +
//         `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
//         `📌 <i>you will receive a link to join the signal channel once approved.</i>\n\n`
//     );

//     await sendAdminAlertCrypto(user);
//   }

//   // bot.on("video", async (ctx) => {
//   //   try {
//   //     const fileId = ctx.message.video.file_id;
//   //     console.log("🎥 Received video with file_id:", fileId);
//   //     await ctx.reply(`✅ Video received!\nFile ID:\n\`${fileId}\``, { parse_mode: "Markdown" });
//   //   } catch (error) {
//   //     console.error("Error handling video:", error);
//   //   }
//   // });

//   // Start watching for status changes
//   watchUserStatusChanges();

//   // Add this error handler to your bot instance
//   bot.catch((err, ctx) => {
//     console.error(
//       `🚨 Crypto Bot Error for update ${ctx.update.update_id}:`,
//       err
//     );
//     ctx.reply("❌ An error occurred. Please try again later.");
//   });
// }













import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import { ICRYPTO_User, CryptoUserModel } from "../models/crypto_user.model";
import { sendAdminAlertCrypto } from "../utils/services/notifier-crypto";
import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
import { isValidUID } from "../utils/validate";
import rateLimit from "telegraf-ratelimit";
import mongoose from "mongoose";
import { session } from "telegraf-session-mongodb";
import { BotContext } from "../telegrafContext";
import dotenv from "dotenv";

dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

// Log environment variables at startup (sanitize sensitive data)
console.log("[Startup] Environment variables:", {
  MONGODB_URI: process.env.MONGODB_URI ? "Defined" : "Undefined",
  GROUP_CHAT_ID: process.env.GROUP_CHAT_ID ? "Defined" : "Undefined",
  BYBIT_LINK: process.env.BYBIT_LINK ? "Defined" : "Undefined",
  BLOFIN_LINK: process.env.BLOFIN_LINK ? "Defined" : "Undefined",
  BYBIT_VIDEO_FILE_ID: process.env.BYBIT_VIDEO_FILE_ID ? "Defined" : "Undefined",
});

const VIDEO_FILE_ID = process.env.BYBIT_VIDEO_FILE_ID;

// MongoDB connection function
async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in environment variables");
  }

  console.log("Connecting to MongoDB...");
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri, {
        retryWrites: true,
        writeConcern: { w: "majority" },
        connectTimeoutMS: 15000, // Increased to 15s
        serverSelectionTimeoutMS: 10000, // Increased to 10s
        socketTimeoutMS: 60000, // Increased to 60s
        maxPoolSize: 10, // Connection pooling for serverless
      });
      console.log("✅ MongoDB connected successfully");
    }
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    throw err;
  }
}

// Initialize MongoDB connection
connectDB().catch((error) => {
  console.error("[Startup] Failed to initialize MongoDB:", error);
});

export default function (bot: Telegraf<BotContext>) {
  // Session setup
  if (mongoose.connection.readyState === 1) {
    const db = mongoose.connection.db;
    if (!db) {
      console.error("❌ Mongoose connected but db is undefined. Crypto session middleware skipped");
    } else {
      bot.use(
        session(db, {
          sessionName: "session",
          collectionName: "crypto_sessions",
        })
      );
      console.log("✅ Crypto Bot MongoDB session middleware enabled");
    }
  } else {
    console.error("❌ Mongoose not connected. Crypto session middleware skipped");
  }

  bot.use(async (ctx, next) => {
    if (!ctx.session) {
      ctx.session = {
        step: "welcome",
        botType: ctx.botType || "crypto",
      };
    }
    return next();
  });

  const userSession: Record<string, any> = {};

  async function notifyUserOnStatusChange(change: any) {
    const user = change.fullDocument as ICRYPTO_User;
    if (!user || !user.telegramId) return;

    if (user.status === "approved") {
      await bot.telegram.sendMessage(
        user.telegramId,
        `<b>🎉 Congratulations!</b> Your registration has been approved. ✅\n\n` +
          `🔗 <b>Welcome to Afibie Signal Group!</b> 🚀\n\n` +
          `👉 Click the button below to receive your exclusive invite link.\n\n` +
          `⚠️ <i>Note:</i> This link is time-sensitive and may expire soon.\n\n` +
          `🔥 <i>Enjoy your journey and happy trading!</i> 📈`,
        {
          parse_mode: "HTML",
          reply_markup: Markup.inlineKeyboard([
            Markup.button.callback("🔗 Click to Get Link", "get_invite_link")
          ]).reply_markup
        }
      );
    } else if (user.status === "rejected") {
      const isBybit = !!user.bybitUid;
      const uidType = isBybit ? "Bybit" : "Blofin";
      const userUid = isBybit ? user.bybitUid : user.blofinUid;
      const registerLink = isBybit ? process.env.BYBIT_LINK : process.env.BLOFIN_LINK;

      const caption =
        `<b>🚫 Application Rejected</b>\n\n` +
        `👤 <b>Your ${uidType} UID:</b> <code>${userUid}</code>\n` +
        `⚠️ <i>This UID was not registered using our affiliate link.</i>\n\n` +
        `<b>👉 What to do:</b>\n` +
        `1️⃣ <b>Create a new ${uidType} account</b> using our official affiliate link below:\n` +
        `<a href="${registerLink}">🔗 Register Here</a>\n\n` +
        `2️⃣ After registration, <b>click /start</b> to begin the process again.\n\n` +
        `🎥 <b>Need help?</b> Watch the step-by-step guide in the video above.\n\n` +
        `<i>Thank you for your understanding and cooperation!</i> 🙏`;

      try {
        if (VIDEO_FILE_ID) {
          await bot.telegram.sendVideo(user.telegramId, VIDEO_FILE_ID, {
            caption,
            parse_mode: "HTML",
          });
        } else {
          await bot.telegram.sendMessage(user.telegramId, caption, {
            parse_mode: "HTML",
          });
        }
      } catch (error) {
        console.error("[notifyUserOnStatusChange] Error sending rejection message:", error);
      }
    }
  }

  async function watchUserStatusChanges() {
    try {
      const changeStream = CryptoUserModel.watch([], {
        fullDocument: "updateLookup",
      });
      changeStream.on("change", (change) => {
        if (change.operationType === "update" && change.updateDescription.updatedFields?.status) {
          notifyUserOnStatusChange(change);
        }
      });
    } catch (error) {
      console.error("[watchUserStatusChanges] Error setting up change stream:", error);
    }
  }

  const getLinkLimiter = rateLimit({
    window: 60_000,
    limit: 3,
    onLimitExceeded: (ctx: any) => ctx.reply("🚫 Too many link requests! Try again later."),
  });

  bot.start(async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) {
      console.error("[start] No user ID found");
      return;
    }

    userSession[userId] = { step: "welcome", botType: "crypto" };

    await ctx.replyWithHTML(
      `<b>🛠 Welcome to <u>Afibie Crypto Signals</u>! 🚀</b>\n\n` +
        `📈 <i>Home of Exclusive Futures Trade Signals</i>\n\n` +
        `<b>To gain access, complete these steps:</b>\n\n` +
        `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
        `✅ <b>Step 2:</b> Choose Your Country 🌍\n` +
        `✅ <b>Step 3:</b> Register on <b>Bybit</b> / <b>Blofin</b> and provide your <b>Login UID</b> \n` +
        `✅ <b>Step 4:</b> Wait for Verification ⏳\n\n` +
        `👉 <b>Click the <b>Continue</b> button to start:</b>`,
      Markup.inlineKeyboard([
        Markup.button.callback("🔵 CONTINUE", "continue_to_captcha"),
      ])
    );
  });

  bot.action("continue_to_captcha", async (ctx) => {
    const userId = ctx.from?.id.toString();
    const session = userSession[userId];
    if (!session || session.step !== "welcome") return;

    session.step = "captcha";
    const captcha = generateCaptcha();
    session.captcha = captcha;

    await ctx.replyWithHTML(
      `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
        `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
        `👉 <b>Type this number:</b> <code>${captcha}</code>`
    );
  });

  bot.action("get_invite_link", getLinkLimiter, async (ctx) => {
    const tgId = ctx.from?.id?.toString();
    if (!tgId) {
      console.error("[get_invite_link] No user ID found");
      return;
    }

    try {
      // Ensure MongoDB connection
      await connectDB();

      const user = await CryptoUserModel.findOne({
        telegramId: tgId,
        botType: "crypto",
      });
      if (!user || user.status !== "approved") {
        await ctx.replyWithHTML(
          `<b>⚠️ Access Denied</b>\n\n` +
            `⛔ <i>Your access link has expired or you are not yet approved.</i>\n` +
            `📩 Please contact an admin for assistance.`
        );
        return;
      }

      if (!process.env.GROUP_CHAT_ID) {
        throw new Error("GROUP_CHAT_ID is not defined");
      }

      const inviteLink = await bot.telegram.createChatInviteLink(
        process.env.GROUP_CHAT_ID,
        {
          expire_date: Math.floor(Date.now() / 1000) + 1800,
          member_limit: 1,
        }
      );
      await ctx.replyWithHTML(
        `<b>🎉 Access Granted!</b>\n\n` +
          `🔗 <b>Your Exclusive Group Link:</b>\n` +
          `<a href="${inviteLink.invite_link}">${inviteLink.invite_link}</a>\n\n` +
          `⚠️ <i>This link can only be used once and will expire in 30 minutes.</i>`
      );
      await ctx.editMessageReplyMarkup(undefined);
    } catch (error) {
      console.error("[get_invite_link] Error for user", tgId, ":", error);
      await ctx.replyWithHTML(
        `<b>⚠️ Error</b>\n\n` +
          `🚫 Failed to generate invite link. Please try again later or contact an admin.`
      );
    }
  });

  bot.on(message("text"), async (ctx) => {
    const userId = ctx.from?.id.toString();
    const session = userSession[userId];
    const text = ctx.message.text.trim();
    if (!session || !userId) {
      console.error("[text] No session or userId found:", { userId, session });
      return;
    }

    switch (session.step) {
      case "captcha": {
        if (verifyCaptcha(text, session.captcha)) {
          session.step = "captcha_confirmed";
          await ctx.replyWithHTML(
            `✅ <b>Correct!</b>\n\n` +
              `You've passed the captcha verification.\n\n` +
              `👉 Click the <b>Continue</b> button to proceed to country selection.`,
            Markup.inlineKeyboard([
              Markup.button.callback("🔵 CONTINUE", "continue_to_country"),
            ])
          );
        } else {
          const newCaptcha = generateCaptcha();
          session.captcha = newCaptcha;
          await ctx.replyWithHTML(
            `❌ <b>Incorrect Captcha</b>\n\n` +
              `🚫 Please try again:\n` +
              `👉 Type this number: <b>${newCaptcha}</b>`
          );
        }
        break;
      }

      case "country": {
        const normalized = text.trim().toLowerCase();
        session.country = text;
        const isUSA = ["usa", "us", "united states", "united states of america"].includes(normalized);
        const isUK = ["uk", "united kingdom", "england", "great britain"].includes(normalized);
        const isCanada = ["canada"].includes(normalized);

        if (isUSA || isUK || isCanada) {
          session.step = "blofin_confirmed";
          session.requiresBoth = false;
          await ctx.replyWithHTML(
            `<b>🌍 Country Selected: ${text}</b>\n\n` +
              `You've chosen your country.\n\n` +
              `👉 Click the <b>Continue</b> button to proceed with Blofin registration.`,
            Markup.inlineKeyboard([
              Markup.button.callback("🔵 CONTINUE", "continue_to_blofin"),
            ])
          );
        } else {
          session.step = "bybit_confirmed";
          session.requiresBoth = true;
          await ctx.replyWithHTML(
            `<b>🌍 Country Selected: ${text}</b>\n\n` +
              `You've chosen your country.\n\n` +
              `👉 Click the <b>Continue</b> button to proceed with Bybit registration. You will also need to register with Blofin.`,
            Markup.inlineKeyboard([
              Markup.button.callback("🔵 CONTINUE", "continue_to_bybit"),
            ])
          );
        }
        break;
      }

      case "bybit_uid": {
        if (!isValidUID(text)) {
          await ctx.replyWithHTML(
            `❌ <b>Invalid UID</b>\n\n` +
              `🚫 Enter a <b>numeric UID</b> between <b>5 to 20 digits</b>.\n\n` +
              `📌 <i>Example:</i> <code>123456789</code>`
          );
          return;
        }
        session.bybitUid = text;
        if (session.requiresBoth) {
          session.step = "blofin_confirmed";
          await ctx.replyWithHTML(
            `<b>✅ Bybit UID Submitted</b>\n` +
              `You've provided your Bybit UID.\n\n` +
              `👉 Click the <b>Continue</b> button to proceed with Blofin registration.`,
            Markup.inlineKeyboard([
              Markup.button.callback("🔵 CONTINUE", "continue_to_blofin"),
            ])
          );
        } else {
          session.step = "final_confirmation";
          await ctx.replyWithHTML(
            `<b>Final Confirmation</b>\n\n` +
              `📌 <b>Your Details:</b>\n` +
              `Blofin UID: ${session.blofinUid || "Not provided"}\n\n` +
              `👉 Click the <b>Confirm</b> button to submit your details.`,
            Markup.inlineKeyboard([
              Markup.button.callback("🔵 CONFIRM", "confirm_final"),
            ])
          );
        }
        break;
      }

      case "blofin_uid": {
        if (!isValidUID(text)) {
          await ctx.replyWithHTML(
            `❌ <b>Invalid UID</b>\n\n` +
              `🚫 Enter a <b>numeric UID</b> between <b>5 to 20 digits</b>.\n\n` +
              `📌 <i>Example:</i> <code>123456789</code>`
          );
          return;
        }
        session.blofinUid = text;
        session.step = "final_confirmation";
        const details = session.requiresBoth
          ? `Bybit UID: ${session.bybitUid || "Not provided"}\nBlofin UID: ${session.blofinUid || "Not provided"}`
          : `Blofin UID: ${session.blofinUid || "Not provided"}`;
        await ctx.replyWithHTML(
          `<b>✅ Blofin UID Submitted</b>\n\n` +
            `Final Confirmation\n\n` +
            `📌 <b>Your Details:</b>\n` +
            `${details}\n\n` +
            `👉 Click the <b>Confirm</b> button to submit your details.`,
          Markup.inlineKeyboard([
            Markup.button.callback("🔵 CONFIRM", "confirm_final"),
          ])
        );
        break;
      }
    }
  });

  bot.action("continue_to_country", async (ctx) => {
    const userId = ctx.from?.id.toString();
    const session = userSession[userId];
    if (!session || session.step !== "captcha_confirmed") return;

    session.step = "country";
    await ctx.replyWithHTML(
      `<b>🚀 Step 2: Country Selection</b>\n\n` +
        `🌍 What is your country of residence?`,
      Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]])
        .oneTime()
        .resize()
    );
  });

  bot.action("continue_to_bybit", async (ctx) => {
    const userId = ctx.from?.id.toString();
    const session = userSession[userId];
    if (!session || session.step !== "bybit_confirmed") return;

    session.step = "bybit_link";

    if (!VIDEO_FILE_ID) {
      await ctx.replyWithHTML(
        `<b>📈 Step 3: Bybit Registration</b>\n\n` +
          `<b>Why Bybit?</b>\n` +
          `📊 <i>Most Trustworthy Exchange</i>\n\n` +
          `📌 <b>Sign up here</b> 👉 <a href="${process.env.BYBIT_LINK}">Bybit Registration Link</a>\n\n` +
          `❗ <b>Important:</b> If you already have a Bybit account, you <u>cannot</u> gain access.\n\n` +
          `✅ Watch the video above to learn how to register properly and gain access.\n\n` +
          `\n\n<b>✅ Once done, click the "Done" button below to continue.</b>`,
        Markup.inlineKeyboard([Markup.button.callback("🔵 Done", "done_bybit")])
      );
      return;
    }

    try {
      await ctx.replyWithVideo(VIDEO_FILE_ID, {
        caption:
          `<b>📈 Step 3: Bybit Registration</b>\n\n` +
          `<b>Why Bybit?</b>\n` +
          `📊 <i>Most Trustworthy Exchange</i>\n\n` +
          `📌 <b>Sign up here</b> 👉 <a href="${process.env.BYBIT_LINK}">Bybit Registration Link</a>\n\n` +
          `❗ <b>Important:</b> If you already have a Bybit account, you <u>cannot</u> gain access.\n\n` +
          `✅ Watch the video above to learn how to register properly and gain access.` +
          `✅ Once done, click the <b>Done</b> button to continue.`,
        parse_mode: "HTML",
        reply_markup: Markup.inlineKeyboard([
          Markup.button.callback("🔵 Done", "done_bybit"),
        ]).reply_markup,
      });
    } catch (error) {
      console.error("[continue_to_bybit] Error sending video:", error);
      await ctx.replyWithHTML(
        `<b>📈 Step 3: Bybit Registration</b>\n\n` +
          `<b>Why Bybit?</b>\n` +
          `📊 <i>Most Trustworthy Exchange</i>\n\n` +
          `📌 <b>Sign up here</b> 👉 <a href="${process.env.BYBIT_LINK}">Bybit Registration Link</a>\n\n` +
          `❗ <b>Important:</b> If you already have a Bybit account, you <u>cannot</u> gain access.\n\n` +
          `❌ Video unavailable. Please try again later or contact support.\n\n` +
          `✅ Once done, click the <b>Done</b> button to continue.`,
        Markup.inlineKeyboard([Markup.button.callback("🔵 Done", "done_bybit")])
      );
    }
  });

  bot.action("continue_to_blofin", async (ctx) => {
    const userId = ctx.from?.id.toString();
    const session = userSession[userId];
    if (!session || session.step !== "blofin_confirmed") return;

    session.step = "blofin_link";
    await ctx.replyWithHTML(
      `<b>🚀 Step 3: Blofin Registration</b>\n\n` +
        `<b>Why Blofin?</b>\n` +
        `🌍 <i>Global Access</i> - <u>No KYC required!</u>\n\n` +
        `📌 <b>Sign up here</b> 👉 <a href="${process.env.BLOFIN_LINK}">Blofin Registration Link</a>\n\n` +
        `✅ After registering, click the <b>Done</b> button to continue.`,
      Markup.inlineKeyboard([Markup.button.callback("🔵 Done", "done_blofin")])
    );
  });

  bot.action("done_bybit", async (ctx) => {
    const userId = ctx.from?.id.toString();
    const session = userSession[userId];
    if (!session || session.step !== "bybit_link") return;

    session.step = "bybit_uid";
    await ctx.replyWithHTML(
      `<b>🔹 Submit Your Bybit UID</b>\n\n` +
        `Please enter your <b>Bybit UID</b> below to proceed.\n\n` +
        `💡 <i>You can find your UID in the account/profile section of the Bybit app or website.</i>\n\n` +
        `📌 <b>Example:</b> <code>12345678</code>`
    );
  });

  bot.action("done_blofin", async (ctx) => {
    const userId = ctx.from?.id.toString();
    const session = userSession[userId];
    if (!session || session.step !== "blofin_link") return;

    session.step = "blofin_uid";
    await ctx.replyWithHTML(
      `<b>🔹 Submit Your Blofin UID</b>\n\n` +
        `Please enter your <b>Blofin UID</b> below to continue.\n\n` +
        `💡 <i>You can find your UID in the account section of the Blofin platform after logging in.</i>\n\n` +
        `📌 <b>Example:</b> <code>87654321</code>`
    );
  });

  bot.action("confirm_final", async (ctx) => {
    const userId = ctx.from?.id.toString();
    const session = userSession[userId];
    if (!userId || !session) {
      console.error(`[confirm_final] Error: Invalid userId (${userId}) or session not found`);
      await ctx.replyWithHTML(
        `<b>⚠️ Error</b>\n\n` +
          `🚫 Session expired or invalid. Please start over with /start.`
      );
      return;
    }

    if (session.step !== "final_confirmation") {
      console.error(`[confirm_final] Error: Invalid session step (${session.step}) for user ${userId}`);
      await ctx.replyWithHTML(
        `<b>⚠️ Error</b>\n\n` +
          `🚫 Invalid step. Please start over with /start or try again.`
      );
      return;
    }

    try {
      await connectDB(); // Ensure MongoDB connection before operation
      await saveAndNotify(ctx, session);
      session.step = "final"; // Move step change here
    } catch (error: any) {
      console.error(`[confirm_final] Error for user ${userId}:`, error);
      let errorMessage = "🚫 Failed to submit your details. Please try again or contact an admin.";
      if (error.message.includes("MONGODB_URI")) {
        errorMessage = "🚫 Server configuration error (database). Please contact an admin.";
      } else if (error.message.includes("GROUP_CHAT_ID")) {
        errorMessage = "🚫 Server configuration error (group chat). Please contact an admin.";
      } else if (error.message.includes("Country is missing")) {
        errorMessage = "🚫 Missing country information. Please start over with /start.";
      } else if (error.message.includes("UID must be provided")) {
        errorMessage = "🚫 No Bybit or Blofin UID provided. Please start over with /start.";
      } else if (error.name === "MongooseError" || error.name === "MongoServerError") {
        errorMessage = "🚫 Database connection issue. Please try again later or contact an admin.";
      }
      await ctx.replyWithHTML(`<b>⚠️ Error</b>\n\n${errorMessage}`);
    }
  });

  async function saveAndNotify(ctx: any, session: any) {
    const telegramId = ctx.from.id.toString();
    try {
      console.log(`[saveAndNotify] Processing for user ${telegramId}, session:`, session);

      // Validate environment variables
      if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in environment variables");
      }
      if (!process.env.GROUP_CHAT_ID) {
        throw new Error("GROUP_CHAT_ID is not defined in environment variables");
      }

      // Validate session data
      if (!session.country) {
        throw new Error("Country is missing in session data");
      }
      if (!session.bybitUid && !session.blofinUid) {
        throw new Error("At least one UID (Bybit or Blofin) must be provided");
      }

      const updatePayload: Partial<ICRYPTO_User> = {
        telegramId,
        username: ctx.from.username || "unknown",
        fullName: `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() || "Unknown User",
        botType: "crypto",
        country: session.country,
        status: "pending",
      };

      if (session.bybitUid) {
        updatePayload.bybitUid = session.bybitUid;
        updatePayload.registeredVia = session.requiresBoth ? "both" : "bybit";
      }
      if (session.blofinUid) {
        updatePayload.blofinUid = session.blofinUid;
        if (!session.bybitUid) {
          updatePayload.registeredVia = "blofin";
        }
      }

      console.log(`[saveAndNotify] Saving user data for ${telegramId}:`, updatePayload);

      // Save to MongoDB with increased timeout
      const user = await CryptoUserModel.findOneAndUpdate(
        { telegramId, botType: session.botType },
        updatePayload,
        { upsert: true, new: true, maxTimeMS: 20000 } // Increase timeout to 20s
      );

      console.log(`[saveAndNotify] User saved successfully:`, user);

      await ctx.replyWithHTML(
        `<b>✅ Submission Successful!</b>\n\n` +
          `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
          `📌 <i>You will receive a link to join the signal channel once approved.</i>\n\n`
      );

      console.log(`[saveAndNotify] Sending admin alert for user ${telegramId}`);
      await sendAdminAlertCrypto(user);
      console.log(`[saveAndNotify] Admin alert sent successfully for user ${telegramId}`);
    } catch (error) {
      console.error(`[saveAndNotify] Error for user ${telegramId}:`, error);
      throw error;
    }
  }

  watchUserStatusChanges();

  bot.catch((err, ctx) => {
    console.error(`🚨 Crypto Bot Error for update ${ctx.update.update_id}:`, err);
    ctx.reply("❌ An error occurred. Please try again later.");
  });
}