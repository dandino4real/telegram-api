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





// import { Telegraf, Markup, Context } from "telegraf";
// import { message } from "telegraf/filters";
// import { ICRYPTO_User, CryptoUserModel } from "../models/crypto_user.model";
// import { sendAdminAlertCrypto } from "../utils/services/notifier-crypto";
// import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
// import { isValidUID } from "../utils/validate";
// import rateLimit from "telegraf-ratelimit";
// import mongoose from "mongoose";
// import { session } from "telegraf-session-mongodb";
// import dotenv from "dotenv";

// // Define SessionData interface for type safety
// interface SessionData {
//   step: string;
//   botType: string;
//   captcha?: string;
//   country?: string;
//   bybitUid?: string;
//   blofinUid?: string;
//   requiresBoth?: boolean;
//   createdAt?: number; // Timestamp for session creation
// }

// // Extend Context to include session
// interface BotContext extends Context {
//   session: SessionData;
// }

// dotenv.config();

// const VIDEO_FILE_ID = process.env.BYBIT_VIDEO_FILE_ID;

// export default function (bot: Telegraf<BotContext>) {
//   // Set up MongoDB session middleware
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

//       // Set up MongoDB TTL index for session expiration (7 days)
//       db.collection("crypto_sessions")
//         .createIndex({ "session.createdAt": 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 })
//         .catch((err) => console.error("❌ Error creating TTL index:", err));
//     } else {
//       console.error("❌ Mongoose connected but db is undefined. Session middleware skipped");
//     }
//   } else {
//     console.error("❌ Mongoose not connected. Session middleware skipped");
//   }

//   // Middleware to initialize session and handle expiration
//   bot.use(async (ctx, next) => {
//     console.log(`[DEBUG] Processing update for user ${ctx.from?.id}, session:`, ctx.session);
//     if (!ctx.session) {
//       ctx.session = {
//         step: "welcome",
//         botType: "crypto",
//         createdAt: Date.now(),
//       };
//       console.log(`[DEBUG] Initialized new session for user ${ctx.from?.id}:`, ctx.session);
//     } else {
//       // Check if session is expired (7 days)
//       const sessionAge = Date.now() - (ctx.session.createdAt || 0);
//       const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
//       if (sessionAge > maxAge) {
//         ctx.session = {
//           step: "welcome",
//           botType: "crypto",
//           createdAt: Date.now(),
//         };
//         console.log(`[DEBUG] Session expired for user ${ctx.from?.id}, reset to:`, ctx.session);
//         await ctx.replyWithHTML(
//           `⚠️ <b>Your previous session has expired.</b>\n\n` +
//             `Please type <b>/start</b> to begin the registration process.`
//         );
//         return;
//       }
//       // Ensure createdAt exists for existing sessions
//       if (!ctx.session.createdAt) {
//         ctx.session.createdAt = Date.now();
//         console.log(`[DEBUG] Added createdAt to session for user ${ctx.from?.id}:`, ctx.session);
//       }
//     }
//     return next();
//   });

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
//       const registerLink = isBybit ? process.env.BYBIT_LINK : process.env.BLOFIN_LINK;

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
//           await bot.telegram.sendMessage(user.telegramId, caption, { parse_mode: "HTML" });
//         }
//       } catch (error) {
//         console.error("Error sending rejection message:", error);
//       }
//     }
//   }

//   // Watch for status changes in MongoDB
//   async function watchUserStatusChanges() {
//     const changeStream = CryptoUserModel.watch([], { fullDocument: "updateLookup" });
//     changeStream.on("change", (change) => {
//       if (change.operationType === "update" && change.updateDescription.updatedFields?.status) {
//         notifyUserOnStatusChange(change);
//       }
//     });
//   }

//   const getLinkLimiter = rateLimit({
//     window: 60_000,
//     limit: 3,
//     onLimitExceeded: (ctx: any) => ctx.reply("🚫 Too many link requests! Try again later."),
//   });

//   bot.start(async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     if (!userId) return;

//     // Reset session to start fresh
//     ctx.session = {
//       step: "welcome",
//       botType: "crypto",
//       createdAt: Date.now(),
//     };
//     console.log(`[DEBUG] /start command - Session reset for user ${userId}:`, ctx.session);

//     await ctx.replyWithHTML(
//       `<b>🛠 Welcome to <u>Afibie Crypto Signals</u>! 🚀</b>\n\n` +
//         `📈 <i>Home of Exclusive Futures Trade Signals</i>\n\n` +
//         `<b>To gain access, complete these steps:</b>\n\n` +
//         `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
//         `✅ <b>Step 2:</b> Choose Your Country 🌍\n` +
//         `✅ <b>Step 3:</b> Register on <b>Bybit</b> / <b>Blofin</b> and provide your <b>Login UID</b> \n` +
//         `✅ <b>Step 4:</b> Wait for Verification ⏳\n\n` +
//         `👉 <b>Click the <b>Continue</b> button to start:</b>`,
//       Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_captcha")])
//     );
//   });

//   bot.action("continue_to_captcha", async (ctx) => {
//     if (!ctx.session || ctx.session.step !== "welcome") {
//       console.log(`[DEBUG] continue_to_captcha - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
//       return;
//     }

//     ctx.session.step = "captcha";
//     ctx.session.captcha = generateCaptcha();
//     console.log(`[DEBUG] continue_to_captcha - Set session for user ${ctx.from?.id}:`, ctx.session);

//     // Explicitly save session to MongoDB
//     try {
//       // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession, but it's available
//       await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//       console.log(`[DEBUG] Session saved to MongoDB for user ${ctx.from?.id}`);
//     } catch (error) {
//       console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//     }

//     await ctx.replyWithHTML(
//       `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
//         `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
//         `👉 <b>Type this number:</b> <code>${ctx.session.captcha}</code>`
//     );
//   });

//   bot.command("getlink", getLinkLimiter, async (ctx) => {
//     const tgId = ctx.from?.id?.toString();
//     if (!tgId) return;

//     const user = await CryptoUserModel.findOne({ telegramId: tgId, botType: "crypto" });
//     if (!user || user.status !== "approved") {
//       await ctx.replyWithHTML(
//         `<b>⚠️ Access Denied</b>\n\n` +
//           `⛔ <i>Your access link has expired or you are not yet approved.</i>\n` +
//           `📩 Please contact an admin for assistance.`
//       );
//       return;
//     }

//     try {
//       const inviteLink = await bot.telegram.createChatInviteLink(process.env.GROUP_CHAT_ID!, {
//         expire_date: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
//         member_limit: 1,
//       });
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
//     const text = ctx.message.text.trim();
//     console.log(`[DEBUG] Text message received from user ${ctx.from?.id}: "${text}", session:`, ctx.session);

//     if (!ctx.session) {
//       console.log(`[DEBUG] No session for user ${ctx.from?.id}, prompting /start`);
//       await ctx.replyWithHTML(
//         `⚠️ <b>Session not found.</b>\n\n` +
//           `Please type <b>/start</b> to begin the registration process.`
//       );
//       return;
//     }

//     // If session is not initialized or step is invalid, prompt to start
//     if (!ctx.session.step || !["captcha", "country", "bybit_uid", "blofin_uid", "final_confirmation"].includes(ctx.session.step)) {
//       console.log(`[DEBUG] Invalid session step for user ${ctx.from?.id}:`, ctx.session.step);
//       await ctx.replyWithHTML(
//         `⚠️ <b>Session expired or invalid.</b>\n\n` +
//           `Please type <b>/start</b> to begin the registration process.`
//       );
//       return;
//     }

//     switch (ctx.session.step) {
//       case "captcha": {
//         if (!ctx.session.captcha) {
//           ctx.session.captcha = generateCaptcha();
//           console.log(`[DEBUG] Generated new captcha for user ${ctx.from?.id}:`, ctx.session.captcha);
//           // Save session
//           try {
//             // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//             await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//             console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//           } catch (error) {
//             console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//           }
//           await ctx.replyWithHTML(
//             `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
//               `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
//               `👉 <b>Type this number:</b> <code>${ctx.session.captcha}</code>`
//           );
//           return;
//         }

//         if (verifyCaptcha(text, ctx.session.captcha)) {
//           ctx.session.step = "captcha_confirmed";
//           console.log(`[DEBUG] Captcha verified for user ${ctx.from?.id}, new session:`, ctx.session);
//           // Save session
//           try {
//             // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//             await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//             console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//           } catch (error) {
//             console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//           }
//           await ctx.replyWithHTML(
//             `✅ <b>Correct!</b>\n\n` +
//               `You've passed the captcha verification.\n\n` +
//               `👉 Click the <b>Continue</b> button to proceed to country selection.`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_country")])
//           );
//         } else {
//           ctx.session.captcha = generateCaptcha();
//           console.log(`[DEBUG] Incorrect captcha for user ${ctx.from?.id}, new captcha:`, ctx.session.captcha);
//           // Save session
//           try {
//             // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//             await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//             console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//           } catch (error) {
//             console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//           }
//           await ctx.replyWithHTML(
//             `❌ <b>Incorrect Captcha</b>\n\n` +
//               `🚫 Please try again:\n` +
//               `👉 Type this number: <b>${ctx.session.captcha}</b>`
//           );
//         }
//         break;
//       }

//       case "country": {
//         const normalized = text.trim().toLowerCase();
//         ctx.session.country = text;
//         const isUSA = ["usa", "us", "united states", "united states of america"].includes(normalized);
//         const isUK = ["uk", "united kingdom", "england", "great britain"].includes(normalized);
//         const isCanada = ["canada"].includes(normalized);

//         if (isUSA || isUK || isCanada) {
//           ctx.session.step = "blofin_confirmed";
//           ctx.session.requiresBoth = false;
//           console.log(`[DEBUG] Country selected for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
//           // Save session
//           try {
//             // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//             await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//             console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//           } catch (error) {
//             console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//           }
//           await ctx.replyWithHTML(
//             `<b>🌍 Country Selected: ${text}</b>\n\n` +
//               `You've chosen your country.\n\n` +
//               `👉 Click the <b>Continue</b> button to proceed with Blofin registration.`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_blofin")])
//           );
//         } else {
//           ctx.session.step = "bybit_confirmed";
//           ctx.session.requiresBoth = true;
//           console.log(`[DEBUG] Country selected for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
//           // Save session
//           try {
//             // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//             await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//             console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//           } catch (error) {
//             console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//           }
//           await ctx.replyWithHTML(
//             `<b>🌍 Country Selected: ${text}</b>\n\n` +
//               `You've chosen your country.\n\n` +
//               `👉 Click the <b>Continue</b> button to proceed with Bybit registration. You will also need to register with Blofin.`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_bybit")])
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
//         ctx.session.bybitUid = text;
//         if (ctx.session.requiresBoth) {
//           ctx.session.step = "blofin_confirmed";
//           console.log(`[DEBUG] Bybit UID submitted for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
//           // Save session
//           try {
//             // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//             await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//             console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//           } catch (error) {
//             console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//           }
//           await ctx.replyWithHTML(
//             `<b>✅ Bybit UID Submitted</b>\n` +
//               `You've provided your Bybit UID.\n\n` +
//               `👉 Click the <b>Continue</b> button to proceed with Blofin registration.`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_blofin")])
//           );
//         } else {
//           ctx.session.step = "final_confirmation";
//           console.log(`[DEBUG] Bybit UID submitted for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
//           // Save session
//           try {
//             // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//             await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//             console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//           } catch (error) {
//             console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//           }
//           await ctx.replyWithHTML(
//             `<b>Final Confirmation</b>\n\n` +
//               `📌 <b>Your Details:</b>\n` +
//               `Blofin UID: ${ctx.session.blofinUid || "Not provided"}\n\n` +
//               `👉 Click the <b>Confirm</b> button to submit your details.`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONFIRM", "confirm_final")])
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
//         ctx.session.blofinUid = text;
//         ctx.session.step = "final_confirmation";
//         const details = ctx.session.requiresBoth
//           ? `Bybit UID: ${ctx.session.bybitUid || "Not provided"}\nBlofin UID: ${ctx.session.blofinUid || "Not provided"}`
//           : `Blofin UID: ${ctx.session.blofinUid || "Not provided"}`;
//         console.log(`[DEBUG] Blofin UID submitted for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
//         // Save session
//         try {
//           // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//           await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//           console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//         } catch (error) {
//           console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//         }
//         await ctx.replyWithHTML(
//           `<b>✅ Blofin UID Submitted</b>\n\n` +
//             `Final Confirmation\n\n` +
//             `📌 <b>Your Details:</b>\n` +
//             `${details}\n\n` +
//             `👉 Click the <b>Confirm</b> button to submit your details.`,
//           Markup.inlineKeyboard([Markup.button.callback("🔵 CONFIRM", "confirm_final")])
//         );
//         break;
//       }

//       case "final_confirmation": {
//         const details = ctx.session.requiresBoth
//           ? `Bybit UID: ${ctx.session.bybitUid || "Not provided"}\nBlofin UID: ${ctx.session.blofinUid || "Not provided"}`
//           : `Blofin UID: ${ctx.session.blofinUid || "Not provided"}`;
//         await ctx.replyWithHTML(
//           `<b>Final Confirmation</b>\n\n` +
//             `📌 <b>Your Details:</b>\n` +
//             `${details}\n\n` +
//             `👉 Click the <b>Confirm</b> button to submit your details.`,
//           Markup.inlineKeyboard([Markup.button.callback("🔵 CONFIRM", "confirm_final")])
//         );
//         break;
//       }
//     }
//   });

//   bot.action("continue_to_country", async (ctx) => {
//     if (!ctx.session || ctx.session.step !== "captcha_confirmed") {
//       console.log(`[DEBUG] continue_to_country - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
//       return;
//     }

//     ctx.session.step = "country";
//     console.log(`[DEBUG] continue_to_country - Set session for user ${ctx.from?.id}:`, ctx.session);
//     // Save session
//     try {
//       // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//       await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//       console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//     } catch (error) {
//       console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//     }
//     await ctx.replyWithHTML(
//       `<b>🚀 Step 2: Country Selection</b>\n\n` +
//         `🌍 What is your country of residence?`,
//       Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]]).oneTime().resize()
//     );
//   });

//   bot.action("continue_to_bybit", async (ctx) => {
//     if (!ctx.session || ctx.session.step !== "bybit_confirmed") {
//       console.log(`[DEBUG] continue_to_bybit - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
//       return;
//     }

//     ctx.session.step = "bybit_link";
//     console.log(`[DEBUG] continue_to_bybit - Set session for user ${ctx.from?.id}:`, ctx.session);
//     // Save session
//     try {
//       // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//       await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//       console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//     } catch (error) {
//       console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//     }

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
//         reply_markup: Markup.inlineKeyboard([Markup.button.callback("🔵 Done", "done_bybit")]).reply_markup,
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
//     if (!ctx.session || ctx.session.step !== "blofin_confirmed") {
//       console.log(`[DEBUG] continue_to_blofin - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
//       return;
//     }

//     ctx.session.step = "blofin_link";
//     console.log(`[DEBUG] continue_to_blofin - Set session for user ${ctx.from?.id}:`, ctx.session);
//     // Save session
//     try {
//       // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//       await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//       console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//     } catch (error) {
//       console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//     }
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
//     if (!ctx.session || ctx.session.step !== "bybit_link") {
//       console.log(`[DEBUG] done_bybit - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
//       return;
//     }

//     ctx.session.step = "bybit_uid";
//     console.log(`[DEBUG] done_bybit - Set session for user ${ctx.from?.id}:`, ctx.session);
//     // Save session
//     try {
//       // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//       await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//       console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//     } catch (error) {
//       console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//     }
//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Bybit UID</b>\n\n` +
//         `Please enter your <b>Bybit UID</b> below to proceed.\n\n` +
//         `💡 <i>You can find your UID in the account/profile section of the Bybit app or website.</i>\n\n` +
//         `📌 <b>Example:</b> <code>12345678</code>`
//     );
//   });

//   bot.action("done_blofin", async (ctx) => {
//     if (!ctx.session || ctx.session.step !== "blofin_link") {
//       console.log(`[DEBUG] done_blofin - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
//       return;
//     }

//     ctx.session.step = "blofin_uid";
//     console.log(`[DEBUG] done_blofin - Set session for user ${ctx.from?.id}:`, ctx.session);
//     // Save session
//     try {
//       // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//       await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//       console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//     } catch (error) {
//       console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//     }
//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Blofin UID</b>\n\n` +
//         `Please enter your <b>Blofin UID</b> below to continue.\n\n` +
//         `💡 <i>You can find your UID in the account section of the Blofin platform after logging in.</i>\n\n` +
//         `📌 <b>Example:</b> <code>87654321</code>`
//     );
//   });

//   bot.action("confirm_final", async (ctx) => {
//     if (!ctx.session || ctx.session.step !== "final_confirmation") {
//       console.log(`[DEBUG] confirm_final - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
//       return;
//     }

//     ctx.session.step = "final";
//     console.log(`[DEBUG] confirm_final - Set session for user ${ctx.from?.id}:`, ctx.session);
//     // Save session
//     try {
//       // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//       await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//       console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//     } catch (error) {
//       console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//     }
//     await saveAndNotify(ctx, ctx.session);
//   });

//   async function saveAndNotify(ctx: BotContext, session: SessionData) {
//     const telegramId = ctx.from!.id.toString();
//     const updatePayload: Partial<ICRYPTO_User> = {
//       telegramId,
//       username: ctx.from!.username,
//       fullName: `${ctx.from!.first_name || ""} ${ctx.from!.last_name || ""}`.trim(),
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

//     console.log(`[DEBUG] User data saved for user ${telegramId}:`, user);

//     await ctx.replyWithHTML(
//       `<b>✅ Submission Successful!</b>\n\n` +
//         `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
//         `📌 <i>You will receive a link to join the signal channel once approved.</i>\n\n`
//     );

//     await sendAdminAlertCrypto(user);
//   }

//   // Handle non-command messages when session exists
//   bot.on(message("text"), async (ctx) => {
//     if (!ctx.session || !ctx.session.step) {
//       console.log(`[DEBUG] No session or step for user ${ctx.from?.id}:`, ctx.session);
//       await ctx.replyWithHTML(
//         `⚠️ <b>Please start the registration process.</b>\n\n` +
//           `Type <b>/start</b> to begin.`
//       );
//       return;
//     }

//     // Prompt user to continue based on their current step
//     switch (ctx.session.step) {
//       case "captcha":
//         if (!ctx.session.captcha) {
//           ctx.session.captcha = generateCaptcha();
//           console.log(`[DEBUG] Generated new captcha for user ${ctx.from?.id}:`, ctx.session.captcha);
//           // Save session
//           try {
//             // @ts-ignore: telegraf-session-mongodb doesn't expose saveSession
//             await ctx.session.__store.saveSession(ctx.session.__key, ctx.session);
//             console.log(`[DEBUG] Session saved for user ${ctx.from?.id}`);
//           } catch (error) {
//             console.error(`[ERROR] Failed to save session for user ${ctx.from?.id}:`, error);
//           }
//         }
//         await ctx.replyWithHTML(
//           `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
//             `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
//             `👉 <b>Type this number:</b> <code>${ctx.session.captcha}</code>`
//         );
//         break;
//       case "country":
//         await ctx.replyWithHTML(
//           `<b>🚀 Step 2: Country Selection</b>\n\n` +
//             `🌍 What is your country of residence?`,
//           Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]]).oneTime().resize()
//         );
//         break;
//       case "bybit_uid":
//         await ctx.replyWithHTML(
//           `<b>🔹 Submit Your Bybit UID</b>\n\n` +
//             `Please enter your <b>Bybit UID</b> below to proceed.\n\n` +
//             `💡 <i>You can find your UID in the account/profile section of the Bybit app or website.</i>\n\n` +
//             `📌 <b>Example:</b> <code>12345678</code>`
//         );
//         break;
//       case "blofin_uid":
//         await ctx.replyWithHTML(
//           `<b>🔹 Submit Your Blofin UID</b>\n\n` +
//             `Please enter your <b>Blofin UID</b> below to continue.\n\n` +
//             `💡 <i>You can find your UID in the account section of the Blofin platform after logging in.</i>\n\n` +
//             `📌 <b>Example:</b> <code>87654321</code>`
//         );
//         break;
//       case "final_confirmation":
//         const details = ctx.session.requiresBoth
//           ? `Bybit UID: ${ctx.session.bybitUid || "Not provided"}\nBlofin UID: ${ctx.session.blofinUid || "Not provided"}`
//           : `Blofin UID: ${ctx.session.blofinUid || "Not provided"}`;
//         await ctx.replyWithHTML(
//           `<b>Final Confirmation</b>\n\n` +
//             `📌 <b>Your Details:</b>\n` +
//             `${details}\n\n` +
//             `👉 Click the <b>Confirm</b> button to submit your details.`,
//           Markup.inlineKeyboard([Markup.button.callback("🔵 CONFIRM", "confirm_final")])
//         );
//         break;
//       default:
//         console.log(`[DEBUG] Unhandled session step for user ${ctx.from?.id}:`, ctx.session.step);
//         await ctx.replyWithHTML(
//           `⚠️ <b>Please continue the registration process.</b>\n\n` +
//             `Type <b>/start</b> to restart if you're stuck.`
//         );
//         break;
//     }
//   });

//   // Start watching for status changes
//   watchUserStatusChanges();

//   // Error handler
//   bot.catch((err, ctx) => {
//     console.error(`🚨 Crypto Bot Error for update ${ctx.update.update_id}:`, err);
//     ctx.reply("❌ An error occurred. Please try again later.");
//   });
// }




import { Telegraf, Markup, Context } from "telegraf";
import { message } from "telegraf/filters";
import { ICRYPTO_User, CryptoUserModel } from "../models/crypto_user.model";
import { sendAdminAlertCrypto } from "../utils/services/notifier-crypto";
import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
import { isValidUID } from "../utils/validate";
import rateLimit from "telegraf-ratelimit";
import mongoose from "mongoose";
import { session } from "telegraf-session-mongodb";
import dotenv from "dotenv";

// Define SessionData interface for type safety
interface SessionData {
  step: string;
  botType: string;
  captcha?: string;
  country?: string;
  bybitUid?: string;
  blofinUid?: string;
  requiresBoth?: boolean;
  createdAt?: number; // Timestamp for session creation
}

// Extend Context to include session
interface BotContext extends Context {
  session: SessionData;
}

dotenv.config();

const VIDEO_FILE_ID = process.env.BYBIT_VIDEO_FILE_ID;

export default function (bot: Telegraf<BotContext>) {
  // Set up MongoDB session middleware
  if (mongoose.connection.readyState === 1) {
    const db = mongoose.connection.db;
    if (db) {
      bot.use(
        session(db, {
          sessionName: "session",
          collectionName: "crypto_sessions",
        })
      );
      console.log("✅ Crypto Bot MongoDB session connected");

      // Set up MongoDB TTL index for session expiration (7 days) - BACKGROUND MODE
      db.collection("crypto_sessions")
        .createIndex(
          { "session.createdAt": 1 }, 
          { 
            expireAfterSeconds: 7 * 24 * 60 * 60,
            background: true // CRITICAL OPTIMIZATION
          }
        )
        .catch((err) => console.error("❌ Error creating TTL index:", err));
    } else {
      console.error("❌ Mongoose connected but db is undefined. Session middleware skipped");
    }
  } else {
    console.error("❌ Mongoose not connected. Session middleware skipped");
  }

  // Middleware to initialize session and handle expiration
  bot.use(async (ctx, next) => {
    console.log(`[DEBUG] Processing update for user ${ctx.from?.id}, session:`, ctx.session);
    if (!ctx.session) {
      ctx.session = {
        step: "welcome",
        botType: "crypto",
        requiresBoth: false,
        createdAt: Date.now(),
      };
      console.log(`[DEBUG] Initialized new session for user ${ctx.from?.id}:`, ctx.session);
    } else {
      // Check if session is expired (7 days)
      const sessionAge = Date.now() - (ctx.session.createdAt || 0);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      if (sessionAge > maxAge) {
        ctx.session = {
          step: "welcome",
          botType: "crypto",
          requiresBoth: false,
          createdAt: Date.now(),
        };
        console.log(`[DEBUG] Session expired for user ${ctx.from?.id}, reset to:`, ctx.session);
        await ctx.replyWithHTML(
          `⚠️ <b>Your previous session has expired.</b>\n\n` +
            `Please type <b>/start</b> to begin the registration process.`
        );
        return;
      }
      // Ensure createdAt exists for existing sessions
      if (!ctx.session.createdAt) {
        ctx.session.createdAt = Date.now();
        console.log(`[DEBUG] Added createdAt to session for user ${ctx.from?.id}:`, ctx.session);
      }
    }
    return next();
  });

  // Notify user on status change
  async function notifyUserOnStatusChange(change: any) {
    const user = change.fullDocument as ICRYPTO_User;
    if (!user || !user.telegramId) return;

    if (user.status === "approved") {
      await bot.telegram.sendMessage(
        user.telegramId,
        `<b>🎉 Congratulations!</b> Your registration has been approved. ✅\n\n` +
          `🔗 <b>Welcome to Afibie Signal Group!</b> 🚀\n\n` +
          `👉 To get started, type <b>/getlink</b> to receive your exclusive invite link.\n\n` +
          `⚠️ <i>Note:</i> This link is time-sensitive and may expire soon.\n\n` +
          `🔥 <i>Enjoy your journey and happy trading!</i> 📈`,
        { parse_mode: "HTML" }
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
          await bot.telegram.sendMessage(user.telegramId, caption, { parse_mode: "HTML" });
        }
      } catch (error) {
        console.error("Error sending rejection message:", error);
      }
    }
  }

  // Watch for status changes in MongoDB
  async function watchUserStatusChanges() {
    const changeStream = CryptoUserModel.watch([], { fullDocument: "updateLookup" });
    changeStream.on("change", (change) => {
      if (change.operationType === "update" && change.updateDescription.updatedFields?.status) {
        notifyUserOnStatusChange(change);
      }
    });
  }

  const getLinkLimiter = rateLimit({
    window: 60_000,
    limit: 3,
    onLimitExceeded: (ctx: any) => ctx.reply("🚫 Too many link requests! Try again later."),
  });

  bot.start(async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) return;

    // Reset session to start fresh
    ctx.session = {
      step: "welcome",
      botType: "crypto",
      requiresBoth: false,
      createdAt: Date.now(),
    };
    console.log(`[DEBUG] /start command - Session reset for user ${userId}:`, ctx.session);

    await ctx.replyWithHTML(
      `<b>🛠 Welcome to <u>Afibie Crypto Signals</u>! 🚀</b>\n\n` +
        `📈 <i>Home of Exclusive Futures Trade Signals</i>\n\n` +
        `<b>To gain access, complete these steps:</b>\n\n` +
        `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
        `✅ <b>Step 2:</b> Choose Your Country 🌍\n` +
        `✅ <b>Step 3:</b> Register on <b>Bybit</b> / <b>Blofin</b> and provide your <b>Login UID</b> \n` +
        `✅ <b>Step 4:</b> Wait for Verification ⏳\n\n` +
        `👉 <b>Click the <b>Continue</b> button to start:</b>`,
      Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_captcha")])
    );
  });

  bot.action("continue_to_captcha", async (ctx) => {
    if (!ctx.session || ctx.session.step !== "welcome") {
      console.log(`[DEBUG] continue_to_captcha - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
      return;
    }

    ctx.session.step = "captcha";
    ctx.session.captcha = generateCaptcha();
    console.log(`[DEBUG] continue_to_captcha - Set session for user ${ctx.from?.id}:`, ctx.session);

    await ctx.replyWithHTML(
      `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
        `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
        `👉 <b>Type this number:</b> <code>${ctx.session.captcha}</code>`
    );
  });

  bot.command("getlink", getLinkLimiter, async (ctx) => {
    const tgId = ctx.from?.id?.toString();
    if (!tgId) return;

    const user = await CryptoUserModel.findOne({ telegramId: tgId, botType: "crypto" });
    if (!user || user.status !== "approved") {
      await ctx.replyWithHTML(
        `<b>⚠️ Access Denied</b>\n\n` +
          `⛔ <i>Your access link has expired or you are not yet approved.</i>\n` +
          `📩 Please contact an admin for assistance.`
      );
      return;
    }

    try {
      const inviteLink = await bot.telegram.createChatInviteLink(process.env.GROUP_CHAT_ID!, {
        expire_date: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        member_limit: 1,
      });
      await ctx.replyWithHTML(
        `<b>🎉 Access Granted!</b>\n\n` +
          `🔗 <b>Your Exclusive Group Link:</b>\n` +
          `<a href="${inviteLink.invite_link}">${inviteLink.invite_link}</a>\n\n` +
          `⚠️ <i>This link can only be used once and will expire in 30 minutes.</i>`
      );
    } catch (error) {
      console.error("Error generating invite link:", error);
      await ctx.replyWithHTML(
        `<b>⚠️ Error</b>\n\n` +
          `🚫 Failed to generate invite link. Please try again later or contact an admin.`
      );
    }
  });

  bot.on(message("text"), async (ctx) => {
    const text = ctx.message.text.trim();
    console.log(`[DEBUG] Text message received from user ${ctx.from?.id}: "${text}", session:`, ctx.session);

    if (!ctx.session) {
      console.log(`[DEBUG] No session for user ${ctx.from?.id}, prompting /start`);
      await ctx.replyWithHTML(
        `⚠️ <b>Session not found.</b>\n\n` +
          `Please type <b>/start</b> to begin the registration process.`
      );
      return;
    }

    // Allowed steps for text input
    const allowedTextSteps = [
      "captcha", 
      "country", 
      "bybit_uid", 
      "blofin_uid", 
      "final_confirmation",
      "captcha_confirmed",  // FIX: Added intermediate states
      "bybit_confirmed",
      "blofin_confirmed"
    ];

    // If session step is invalid or not in allowed list
    if (!ctx.session.step || !allowedTextSteps.includes(ctx.session.step)) {
      console.log(`[DEBUG] Invalid session step for user ${ctx.from?.id}:`, ctx.session.step);
      
      // Provide specific guidance for intermediate steps
      if (ctx.session.step === "welcome") {
        await ctx.replyWithHTML(
          `👋 <b>Welcome!</b>\n\n` +
          `Please click the <b>CONTINUE</b> button to begin.`
        );
      } 
      else if (ctx.session.step === "bybit_link" || ctx.session.step === "blofin_link") {
        await ctx.replyWithHTML(
          `ℹ️ <b>Please use the buttons</b>\n\n` +
          `Click the <b>DONE</b> button after registration.`
        );
      }
      else {
        await ctx.replyWithHTML(
          `⚠️ <b>Please continue using buttons</b>\n\n` +
          `Use the provided buttons to proceed or type /start to restart.`
        );
      }
      return;
    }

    switch (ctx.session.step) {
      case "captcha": {
        if (!ctx.session.captcha) {
          ctx.session.captcha = generateCaptcha();
          console.log(`[DEBUG] Generated new captcha for user ${ctx.from?.id}:`, ctx.session.captcha);
          await ctx.replyWithHTML(
            `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
              `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
              `👉 <b>Type this number:</b> <code>${ctx.session.captcha}</code>`
          );
          return;
        }

        if (verifyCaptcha(text, ctx.session.captcha)) {
          ctx.session.step = "captcha_confirmed";
          console.log(`[DEBUG] Captcha verified for user ${ctx.from?.id}, new session:`, ctx.session);
          await ctx.replyWithHTML(
            `✅ <b>Correct!</b>\n\n` +
              `You've passed the captcha verification.\n\n` +
              `👉 Click the <b>Continue</b> button to proceed to country selection.`,
            Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_country")])
          );
        } else {
          ctx.session.captcha = generateCaptcha();
          console.log(`[DEBUG] Incorrect captcha for user ${ctx.from?.id}, new captcha:`, ctx.session.captcha);
          await ctx.replyWithHTML(
            `❌ <b>Incorrect Captcha</b>\n\n` +
              `🚫 Please try again:\n` +
              `👉 Type this number: <b>${ctx.session.captcha}</b>`
          );
        }
        break;
      }

      case "country": {
        const normalized = text.trim().toLowerCase();
        ctx.session.country = text;
        const isUSA = ["usa", "us", "united states", "united states of america"].includes(normalized);
        const isUK = ["uk", "united kingdom", "england", "great britain"].includes(normalized);
        const isCanada = ["canada"].includes(normalized);

        if (isUSA || isUK || isCanada) {
          ctx.session.step = "blofin_confirmed";
          ctx.session.requiresBoth = false;
          console.log(`[DEBUG] Country selected for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
          await ctx.replyWithHTML(
            `<b>🌍 Country Selected: ${text}</b>\n\n` +
              `You've chosen your country.\n\n` +
              `👉 Click the <b>Continue</b> button to proceed with Blofin registration.`,
            Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_blofin")])
          );
        } else {
          ctx.session.step = "bybit_confirmed";
          ctx.session.requiresBoth = true;
          console.log(`[DEBUG] Country selected for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
          await ctx.replyWithHTML(
            `<b>🌍 Country Selected: ${text}</b>\n\n` +
              `You've chosen your country.\n\n` +
              `👉 Click the <b>Continue</b> button to proceed with Bybit registration. You will also need to register with Blofin.`,
            Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_bybit")])
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
        ctx.session.bybitUid = text;
        if (ctx.session.requiresBoth) {
          ctx.session.step = "blofin_confirmed";
          console.log(`[DEBUG] Bybit UID submitted for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
          await ctx.replyWithHTML(
            `<b>✅ Bybit UID Submitted</b>\n` +
              `You've provided your Bybit UID.\n\n` +
              `👉 Click the <b>Continue</b> button to proceed with Blofin registration.`,
            Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_blofin")])
          );
        } else {
          ctx.session.step = "final_confirmation";
          console.log(`[DEBUG] Bybit UID submitted for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
          await ctx.replyWithHTML(
            `<b>Final Confirmation</b>\n\n` +
              `📌 <b>Your Details:</b>\n` +
              `Blofin UID: ${ctx.session.blofinUid || "Not provided"}\n\n` +
              `👉 Click the <b>Confirm</b> button to submit your details.`,
            Markup.inlineKeyboard([Markup.button.callback("🔵 CONFIRM", "confirm_final")])
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
        ctx.session.blofinUid = text;
        ctx.session.step = "final_confirmation";
        const details = ctx.session.requiresBoth
          ? `Bybit UID: ${ctx.session.bybitUid || "Not provided"}\nBlofin UID: ${ctx.session.blofinUid || "Not provided"}`
          : `Blofin UID: ${ctx.session.blofinUid || "Not provided"}`;
        console.log(`[DEBUG] Blofin UID submitted for user ${ctx.from?.id}: ${text}, new session:`, ctx.session);
        await ctx.replyWithHTML(
          `<b>✅ Blofin UID Submitted</b>\n\n` +
            `Final Confirmation\n\n` +
            `📌 <b>Your Details:</b>\n` +
            `${details}\n\n` +
            `👉 Click the <b>Confirm</b> button to submit your details.`,
          Markup.inlineKeyboard([Markup.button.callback("🔵 CONFIRM", "confirm_final")])
        );
        break;
      }

      case "final_confirmation": {
        const details = ctx.session.requiresBoth
          ? `Bybit UID: ${ctx.session.bybitUid || "Not provided"}\nBlofin UID: ${ctx.session.blofinUid || "Not provided"}`
          : `Blofin UID: ${ctx.session.blofinUid || "Not provided"}`;
        await ctx.replyWithHTML(
          `<b>Final Confirmation</b>\n\n` +
            `📌 <b>Your Details:</b>\n` +
            `${details}\n\n` +
            `👉 Click the <b>Confirm</b> button to submit your details.`,
          Markup.inlineKeyboard([Markup.button.callback("🔵 CONFIRM", "confirm_final")])
        );
        break;
      }
      
      // Handle intermediate states
      case "captcha_confirmed":
        await ctx.replyWithHTML(
          `✅ <b>Captcha already verified!</b>\n\n` +
          `Please click <b>CONTINUE</b> to select your country.`,
          Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_country")])
        );
        break;
        
      case "bybit_confirmed":
        await ctx.replyWithHTML(
          `🌍 <b>Country already selected!</b>\n\n` +
          `Please click <b>CONTINUE</b> to proceed with Bybit registration.`,
          Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_bybit")])
        );
        break;
        
      case "blofin_confirmed":
        await ctx.replyWithHTML(
          `🌍 <b>Country already selected!</b>\n\n` +
          `Please click <b>CONTINUE</b> to proceed with Blofin registration.`,
          Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_blofin")])
        );
        break;
    }
  });

  bot.action("continue_to_country", async (ctx) => {
    if (!ctx.session || ctx.session.step !== "captcha_confirmed") {
      console.log(`[DEBUG] continue_to_country - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
      return;
    }

    ctx.session.step = "country";
    console.log(`[DEBUG] continue_to_country - Set session for user ${ctx.from?.id}:`, ctx.session);
    await ctx.replyWithHTML(
      `<b>🚀 Step 2: Country Selection</b>\n\n` +
        `🌍 What is your country of residence?`,
      Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]]).oneTime().resize()
    );
  });

  bot.action("continue_to_bybit", async (ctx) => {
    if (!ctx.session || ctx.session.step !== "bybit_confirmed") {
      console.log(`[DEBUG] continue_to_bybit - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
      return;
    }

    ctx.session.step = "bybit_link";
    console.log(`[DEBUG] continue_to_bybit - Set session for user ${ctx.from?.id}:`, ctx.session);

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
        reply_markup: Markup.inlineKeyboard([Markup.button.callback("🔵 Done", "done_bybit")]).reply_markup,
      });
    } catch (error) {
      console.error("Error sending video:", error);
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
    if (!ctx.session || ctx.session.step !== "blofin_confirmed") {
      console.log(`[DEBUG] continue_to_blofin - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
      return;
    }

    ctx.session.step = "blofin_link";
    console.log(`[DEBUG] continue_to_blofin - Set session for user ${ctx.from?.id}:`, ctx.session);
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
    if (!ctx.session || ctx.session.step !== "bybit_link") {
      console.log(`[DEBUG] done_bybit - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
      return;
    }

    ctx.session.step = "bybit_uid";
    console.log(`[DEBUG] done_bybit - Set session for user ${ctx.from?.id}:`, ctx.session);
    await ctx.replyWithHTML(
      `<b>🔹 Submit Your Bybit UID</b>\n\n` +
        `Please enter your <b>Bybit UID</b> below to proceed.\n\n` +
        `💡 <i>You can find your UID in the account/profile section of the Bybit app or website.</i>\n\n` +
        `📌 <b>Example:</b> <code>12345678</code>`
    );
  });

  bot.action("done_blofin", async (ctx) => {
    if (!ctx.session || ctx.session.step !== "blofin_link") {
      console.log(`[DEBUG] done_blofin - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
      return;
    }

    ctx.session.step = "blofin_uid";
    console.log(`[DEBUG] done_blofin - Set session for user ${ctx.from?.id}:`, ctx.session);
    await ctx.replyWithHTML(
      `<b>🔹 Submit Your Blofin UID</b>\n\n` +
        `Please enter your <b>Blofin UID</b> below to continue.\n\n` +
        `💡 <i>You can find your UID in the account section of the Blofin platform after logging in.</i>\n\n` +
        `📌 <b>Example:</b> <code>87654321</code>`
    );
  });

  bot.action("confirm_final", async (ctx) => {
    if (!ctx.session || ctx.session.step !== "final_confirmation") {
      console.log(`[DEBUG] confirm_final - Invalid session or step for user ${ctx.from?.id}:`, ctx.session);
      return;
    }

    ctx.session.step = "final";
    console.log(`[DEBUG] confirm_final - Set session for user ${ctx.from?.id}:`, ctx.session);
    await saveAndNotify(ctx, ctx.session);
  });

  async function saveAndNotify(ctx: BotContext, session: SessionData) {
    const telegramId = ctx.from!.id.toString();
    const updatePayload: Partial<ICRYPTO_User> = {
      telegramId,
      username: ctx.from!.username,
      fullName: `${ctx.from!.first_name || ""} ${ctx.from!.last_name || ""}`.trim(),
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

    const user = await CryptoUserModel.findOneAndUpdate(
      { telegramId, botType: session.botType },
      updatePayload,
      { upsert: true, new: true }
    );

    console.log(`[DEBUG] User data saved for user ${telegramId}:`, user);

    await ctx.replyWithHTML(
      `<b>✅ Submission Successful!</b>\n\n` +
        `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
        `📌 <i>You will receive a link to join the signal channel once approved.</i>\n\n`
    );

    await sendAdminAlertCrypto(user);
  }

  // Handle non-command messages when session exists
  bot.on(message("text"), async (ctx) => {
    if (!ctx.session || !ctx.session.step) {
      console.log(`[DEBUG] No session or step for user ${ctx.from?.id}:`, ctx.session);
      await ctx.replyWithHTML(
        `⚠️ <b>Please start the registration process.</b>\n\n` +
          `Type <b>/start</b> to begin.`
      );
      return;
    }

    // Prompt user to continue based on their current step
    switch (ctx.session.step) {
      case "captcha":
        if (!ctx.session.captcha) {
          ctx.session.captcha = generateCaptcha();
          console.log(`[DEBUG] Generated new captcha for user ${ctx.from?.id}:`, ctx.session.captcha);
        }
        await ctx.replyWithHTML(
          `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
            `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
            `👉 <b>Type this number:</b> <code>${ctx.session.captcha}</code>`
        );
        break;
      case "country":
        await ctx.replyWithHTML(
          `<b>🚀 Step 2: Country Selection</b>\n\n` +
            `🌍 What is your country of residence?`,
          Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]]).oneTime().resize()
        );
        break;
      case "bybit_uid":
        await ctx.replyWithHTML(
          `<b>🔹 Submit Your Bybit UID</b>\n\n` +
            `Please enter your <b>Bybit UID</b> below to proceed.\n\n` +
            `💡 <i>You can find your UID in the account/profile section of the Bybit app or website.</i>\n\n` +
            `📌 <b>Example:</b> <code>12345678</code>`
        );
        break;
      case "blofin_uid":
        await ctx.replyWithHTML(
          `<b>🔹 Submit Your Blofin UID</b>\n\n` +
            `Please enter your <b>Blofin UID</b> below to continue.\n\n` +
            `💡 <i>You can find your UID in the account section of the Blofin platform after logging in.</i>\n\n` +
            `📌 <b>Example:</b> <code>87654321</code>`
        );
        break;
      case "final_confirmation":
        const details = ctx.session.requiresBoth
          ? `Bybit UID: ${ctx.session.bybitUid || "Not provided"}\nBlofin UID: ${ctx.session.blofinUid || "Not provided"}`
          : `Blofin UID: ${ctx.session.blofinUid || "Not provided"}`;
        await ctx.replyWithHTML(
          `<b>Final Confirmation</b>\n\n` +
            `📌 <b>Your Details:</b>\n` +
            `${details}\n\n` +
            `👉 Click the <b>Confirm</b> button to submit your details.`,
          Markup.inlineKeyboard([Markup.button.callback("🔵 CONFIRM", "confirm_final")])
        );
        break;
      default:
        console.log(`[DEBUG] Unhandled session step for user ${ctx.from?.id}:`, ctx.session.step);
        await ctx.replyWithHTML(
          `⚠️ <b>Please continue the registration process.</b>\n\n` +
            `Type <b>/start</b> to restart if you're stuck.`
        );
        break;
    }
  });

  // Start watching for status changes
  watchUserStatusChanges();

  // Error handler
  bot.catch((err, ctx) => {
    console.error(`🚨 Crypto Bot Error for update ${ctx.update.update_id}:`, err);
    ctx.reply("❌ An error occurred. Please try again later.");
  });
}