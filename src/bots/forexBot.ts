

// import { Telegraf, Markup } from "telegraf";
// import { message } from "telegraf/filters";
// import { IFOREX_User, ForexUserModel } from "../models/forex_user.model";
// import { sendAdminAlertForex } from "../utils/services/notifier-forex";
// import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
// import { isValidLoginID } from "../utils/validate";
// import rateLimit from "telegraf-ratelimit";
// import { createLogger, transports, format } from "winston";
// import { session } from "telegraf-session-mongodb";
// import { BotContext } from "../telegrafContext";
// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config({
//   path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });




// const GROUP_CHAT_ID = process.env.FOREX_GROUP_CHAT_ID
// // MongoDB connection function
// async function connectDB() {
//   const mongoUri = process.env.MONGODB_URI;
//   if (!mongoUri) {
//     throw new Error("MONGODB_URI is not defined in environment variables");
//   }

//   console.log("Connecting to MongoDB...");
//   try {
//     if (mongoose.connection.readyState !== 1) {
//       await mongoose.connect(mongoUri, {
//         retryWrites: true,
//         writeConcern: { w: "majority" },
//         connectTimeoutMS: 15000,
//         serverSelectionTimeoutMS: 10000,
//         socketTimeoutMS: 60000,
//         maxPoolSize: 10,
//       });
//       console.log("✅ MongoDB connected successfully");
//     }
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//     throw err;
//   }
// }

// // Initialize MongoDB connection
// connectDB().catch((error) => {
//   console.error("[Startup] Failed to initialize MongoDB:", error);
// });

// export default function (bot: Telegraf<BotContext>) {
//   // Session setup
//   if (mongoose.connection.readyState === 1) {
//     const db = mongoose.connection.db;
//     if (!db) {
//       console.error(
//         "❌ Mongoose connected but db is undefined. Forex session middleware skipped"
//       );
//     } else {
//       bot.use(
//         session(db, {
//           sessionName: "session",
//           collectionName: "forex_sessions",
//         })
//       );
//       console.log("✅ Forex Bot MongoDB session middleware enabled");
//     }
//   } else {
//     console.error(
//       "❌ Mongoose not connected. Forex session middleware skipped"
//     );
//   }

//   bot.use(async (ctx, next) => {
//     if (!ctx.session) {
//       ctx.session = {
//         step: "welcome",
//         botType: ctx.botType || "forex",
//         retryCount: 0,
//       };
//     }
//     return next();
//   });

//   const logger = createLogger({
//     level: "warn",
//     transports: [
//       new transports.Console({
//         format: format.combine(format.timestamp(), format.simple()),
//       }),
//     ],
//   });

//   const getLinkLimiter = rateLimit({
//     window: 60_000,
//     limit: 3,
//     onLimitExceeded: (ctx) =>
//       ctx.reply("🚫 Too many link requests! Try again later."),
//   });

//   const userSession: Record<string, any> = {};

//   // Notify user on status change
//   async function notifyUserOnStatusChange(change: any) {
//     const user = change.fullDocument as IFOREX_User;
//     if (!user || !user.telegramId) return;

//     if (user.status === "approved") {
//       await bot.telegram.sendMessage(
//         user.telegramId,
//         `<b>🎉 Congratulations!</b> Your registration has been approved. ✅\n\n` +
//           `🔗 <b>Welcome to Afibie Fx Signals!</b> 🚀\n\n` +
//           `👉 Click the button below to receive your exclusive invite link.\n\n` +
//           `⚠️ <i>Note:</i> This link is time-sensitive and may expire soon.\n\n` +
//           `🔥 <i>Enjoy your journey and happy trading!</i> 📈`,
//         {
//           parse_mode: "HTML",
//           reply_markup: Markup.inlineKeyboard([
//             Markup.button.callback("🔗 Click to Get Link", "get_invite_link"),
//           ]).reply_markup,
//         }
//       );
//     } else if (user.status === "rejected") {
//       const session = userSession[user.telegramId] || {
//         botType: "forex",
//         retryCount: 0,
//         step: "login_id",
//       };
//       if (session.retryCount >= 1) {
//         await bot.telegram.sendMessage(
//           user.telegramId,
//           `<b>❌ Sorry, your registration was rejected.</b>\n\n` +
//             `🚫 You have exceeded the maximum retry attempts.\n` +
//             `📩 Please contact an admin for assistance.`,
//           { parse_mode: "HTML" }
//         );
//         return;
//       }
//       session.step = "login_id";
//       session.retryCount = (session.retryCount || 0) + 1;
//       userSession[user.telegramId] = session;

//       const reasonMessage =
//         user.rejectionReason === "no_affiliate_link"
//           ? "Your Exco Trader account was not registered using our affiliate link."
//           : user.rejectionReason === "insufficient_deposit"
//           ? "Your Exco Trader account does not have a minimum deposit of $100."
//           : "No specific reason provided.";

//       const nextSteps =
//         user.rejectionReason === "no_affiliate_link"
//           ? `To gain access to Afibie FX signals, register a new Exco Trader account using our affiliate  link:\n\n` +
//             `👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//             `Once registered, click /start to begin again.`
//           : user.rejectionReason === "insufficient_deposit"
//           ? `To proceed, please deposit at least $100 into your Exco Trader account.\n\n` +
//             `Once deposited, click /start to begin again.`
//           : `Please contact an admin for assistance on next steps.`;

//       const rejectionMessage =
//         `<b>❌ Your registration was rejected.</b>\n\n` +
//         `👤 <b>Your Exco Trader Login ID:</b> <code>${
//           user.excoTraderLoginId || "N/A"
//         }</code>\n` +
//         `⚠️ <b>Reason:</b> ${reasonMessage}\n\n` +
//         `📌 <b>This is your last trial.</b>\n\n` +
//         `${nextSteps}\n\n`;

//       await bot.telegram.sendMessage(user.telegramId, rejectionMessage, {
//         parse_mode: "HTML",
//       });
//     }
//   }

//   // Watch for status changes in MongoDB
//   async function watchUserStatusChanges() {
//     try {
//       await connectDB();
//       const changeStream = ForexUserModel.watch([], {
//         fullDocument: "updateLookup",
//       });
//       changeStream.on("change", (change) => {
//         if (
//           change.operationType === "update" &&
//           change.updateDescription.updatedFields?.status
//         ) {
//           notifyUserOnStatusChange(change);
//         }
//       });
//     } catch (error) {
//       console.error(
//         "[watchUserStatusChanges] Error setting up change stream:",
//         error
//       );
//     }
//   }

//   bot.start(async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     if (!userId) {
//       logger.error("[start] No user ID found");
//       return;
//     }

//     userSession[userId] = { step: "welcome", botType: "forex", retryCount: 0 };

//     await ctx.replyWithHTML(
//       `<b>🛠 Welcome to <u>Afibie FX Signal</u>! 🚀</b>\n\n` +
//         `📈 <i>Home of <b>Exclusive FOREX signals</b></i>\n\n` +
//         `<b>To gain access, complete these steps 👇</b>\n\n` +
//         `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
//         `✅ <b>Step 2:</b> Register at Exco Trader, deposit <b>$100</b> or more, and provide your <b>Login ID</b> 💰\n` +
//         `✅ <b>Step 3:</b> Create Deriv account (Optional) 📊\n\n` +
//         `⏳ <b>Once all steps are completed, you will gain full access to Afibie FX Signals - where strategy meets profitability!</b> 💰📊\n\n` +
//          `<i>(If you have any issues during the process, message support 👉 @Francis_Nbtc)</i>\n\n` +
//         `👉 Click <b>CONTINUE</b> to start:`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("🔵 CONTINUE", "continue_to_captcha"),
//       ])
//     );
//   });

//   bot.action("continue_to_captcha", async (ctx) => {
//     await ctx.answerCbQuery();
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!userId || !session) {
//       logger.error(
//         `[continue_to_captcha] Invalid userId (${userId}) or session not found`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Session expired or invalid. Please start over with /start.`
//       );
//       return;
//     }

//     if (session.step !== "welcome") {
//       logger.warn(
//         `[continue_to_captcha] Invalid session step (${session.step}) for user ${userId}`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     session.step = "captcha";
//     const captcha = generateCaptcha();
//     session.captcha = captcha;

//     await ctx.replyWithHTML(
//       `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
//         `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
//         `👉 <b>Type this number:</b> <code>${captcha}</code>`
//     );
//   });

//   bot.action("get_invite_link", getLinkLimiter, async (ctx) => {
//     const telegramId = ctx.from?.id?.toString();
//     if (!telegramId) {
//       logger.error("[get_invite_link] No user ID found");
//       return;
//     }

//     try {
//       await connectDB();
//       const user = await ForexUserModel.findOne({
//         telegramId,
//         botType: "forex",
//       });
//       if (!user || user.status !== "approved") {
//         logger.warn("Unauthorized get_invite_link attempt", { telegramId });
//         await ctx.replyWithHTML(
//           `⚠️ Your access link has expired or you are not yet approved.\n` +
//             `📩 Please contact an admin.`
//         );
//         return;
//       }

//       if (!GROUP_CHAT_ID) {
//         throw new Error("GROUP_CHAT_ID is not defined");
//       }

//       const inviteLink = await bot.telegram.createChatInviteLink(
//         GROUP_CHAT_ID,
//         {
//           expire_date: Math.floor(Date.now() / 1000) + 1800,
//           member_limit: 1,
//         }
//       );
//       await ctx.replyWithHTML(
//         `<b>🔗 Welcome to Afibie FX Signals! 🚀</b>\n\n` +
//           `Here's your exclusive access link: <a href="${inviteLink.invite_link}">${inviteLink.invite_link}</a>\n\n` +
//           `⚠️ <b>Note:</b> This link is time-sensitive and will expire in 30 minutes.\n` +
//           `Enjoy your journey & happy trading! 📈🔥`
//       );
//     } catch (error) {
//       logger.error("Error generating invite link", { telegramId, error });
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to generate invite link. Please try again later or contact an admin.`
//       );
//     }
//   });

//   // bot.action("confirm_final", async (ctx) => {
//   //   await ctx.answerCbQuery();
//   //   const userId = ctx.from?.id.toString();
//   //   const session = userSession[userId];
//   //   if (!userId || !session) {
//   //     logger.error(
//   //       `[confirm_final] Invalid userId (${userId}) or session not found`
//   //     );
//   //     await ctx.replyWithHTML(
//   //       `<b>⚠️ Error</b>\n\n` +
//   //         `🚫 Session expired or invalid. Please start over with /start.`
//   //     );
//   //     return;
//   //   }

//   //   if (session.step !== "final_confirmation") {
//   //     logger.warn(
//   //       `[confirm_final] Invalid session step (${session.step}) for user ${userId}`
//   //     );
//   //     await ctx.replyWithHTML(
//   //       `<b>⚠️ Error</b>\n\n` +
//   //         `🚫 Invalid step. Please start over with /start.`
//   //     );
//   //     return;
//   //   }

//   //   try {
//   //     await connectDB();
//   //     await saveAndNotify(ctx, session);
//   //     session.step = "final";
//   //   } catch (error: any) {
//   //     logger.error(`[confirm_final] Error for user ${userId}:`, error);
//   //     let errorMessage =
//   //       "🚫 Failed to submit your details. Please try again or contact an admin.";
//   //     if (error.message.includes("MONGODB_URI")) {
//   //       errorMessage =
//   //         "🚫 Server configuration error (database). Please contact an admin.";
//   //     } else if (error.message.includes("GROUP_CHAT_ID")) {
//   //       errorMessage =
//   //         "🚫 Server configuration error (group chat). Please contact an admin.";
//   //     } else if (error.message.includes("Country is missing")) {
//   //       errorMessage =
//   //         "🚫 Missing country information. Please start over with /start.";
//   //     } else if (error.message.includes("Exco Trader Login ID is missing")) {
//   //       errorMessage =
//   //         "🚫 No Exco Trader Login ID provided. Please start over with /start.";
//   //     } else if (
//   //       error.name === "MongooseError" ||
//   //       error.name === "MongoServerError"
//   //     ) {
//   //       errorMessage =
//   //         "🚫 Database connection issue. Please try again later or contact an admin.";
//   //     }
//   //     await ctx.replyWithHTML(`<b>⚠️ Error</b>\n\n${errorMessage}`);
//   //   }
//   // });


// // Add this handler in the Forex bot after the 'cancel_final' handler
// bot.action("confirm_final", async (ctx) => {
//   await ctx.answerCbQuery();
//   const userId = ctx.from?.id.toString();
  
//   // Get session from ctx instead of userSession object
//   const session = ctx.session || {};
  
//   if (!session || session.step !== "final_confirmation") {
//     await ctx.replyWithHTML(
//       `<b>⚠️ Error</b>\n\n🚫 Session expired or invalid. Please start over with /start.`
//     );
//     return;
//   }

//   try {
//     await connectDB();
//     await saveAndNotify(ctx, session);
//     session.step = "final";
//     await ctx.editMessageReplyMarkup(undefined); // Remove buttons after confirmation
//   } catch (error: any) {
//     console.error(`[confirm_final] Error:`, error);
//     await ctx.replyWithHTML(
//       `<b>⚠️ Error</b>\n\n🚫 Failed to submit details. Please try again.`
//     );
//   }
// });

//   bot.action("cancel_final", async (ctx) => {
//     await ctx.answerCbQuery();
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!userId || !session || session.step !== "final_confirmation") {
//       logger.error(
//         `[cancel_final] Invalid userId (${userId}) or session step (${session?.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid action. Please start over with /start.`
//       );
//       return;
//     }

//     session.step = "welcome";
//     session.excoTraderLoginId = undefined;
//     session.derivLoginId = undefined;
//     session.country = undefined;
//     session.captcha = undefined;
//     session.retryCount = 0;

//     await ctx.replyWithHTML(
//       `<b>🛠 Registration Cancelled</b>\n\n` +
//         `📌 You have cancelled the registration process.\n\n` +
//         `👉 Type <b>/start</b> to begin again.`
//     );
//     await ctx.editMessageReplyMarkup(undefined);
//   });

//   bot.on(message("text"), async (ctx) => {
//     const userId = ctx.from?.id.toString();
//     if (!userId) {
//       logger.error("[text] No user ID found");
//       return;
//     }
//     const session = userSession[userId];
//     const text = ctx.message.text.trim();
//     if (!session) {
//       logger.error("[text] No session found for user", { userId });
//       return;
//     }

//     switch (session.step) {
//       case "captcha": {
//         if (verifyCaptcha(text, session.captcha)) {
//           session.step = "captcha_confirmed";
//           await ctx.replyWithHTML(
//             `✅ <b>Correct!</b>\n\n` +
//               `You've passed the captcha verification.\n\n` +
//               `👉 Click <b>CONTINUE</b> to proceed to country selection.`,
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
//               `👉 Type this number: <code>${newCaptcha}</code>`
//           );
//         }
//         break;
//       }

//       case "country": {
//         session.country = text;
//         session.step = "waiting_for_done";
//         await ctx.replyWithHTML(
//           `<b>🌍 Step 2: Exco Trader Registration</b>\n\n` +
//             `📌 <b>Sign up here</b> 👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//             `✅ Click <b>Done</b> after completing your registration!\n\n` +
//             `📌 <b>Deposit Requirement:</b>\n` +
//             `⚡ To gain access, deposit at least <b>$100</b> into your Exco Trader account.\n\n` +
//             `💬 <i>Note: The Exco team may contact you to assist with setting up your account.</i>\n\n` +
//             `📌 <b>Submit Exco Trader Login ID</b>\n` +
//             `🔹 Check your email for your Login ID.\n` +
//             `🔹 Enter your Login ID below after clicking Done.`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("✅ Done", "done_exco"),
//           ])
//         );
//         break;
//       }

//       case "exco_login": {
//         if (!isValidLoginID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>123456565</code>`
//           );
//           return;
//         }
//         session.excoTraderLoginId = text;
//         session.step = "exco_confirmed";
//         await ctx.replyWithHTML(
//           `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//             `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("🔵 CONTINUE", "continue_to_deriv"),
//           ])
//         );
//         break;
//       }

//       case "deriv": {
//         if (!isValidLoginID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid Deriv Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>DR123456</code>`
//           );
//           return;
//         }
//         session.derivLoginId = text;
//         session.step = "final_confirmation";
//         const details = [
//           `Exco Trader Login ID: ${
//             session.excoTraderLoginId || "Not provided"
//           }`,
//           session.derivLoginId
//             ? `Deriv Login ID: ${session.derivLoginId}`
//             : null,
//         ]
//           .filter(Boolean)
//           .join("\n");

//         await ctx.replyWithHTML(
//           `<b>Final Confirmation</b>\n\n` +
//             `📌 <b>Your Details:</b>\n` +
//             `${details}\n\n` +
//             ` <b>correct?</b>\n` +
//             `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//             Markup.button.callback("❌ CANCEL", "cancel_final"),
//           ])
//         );
//         break;
//       }

//       case "login_id": {
//         if (!isValidLoginID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>EX123456</code>`
//           );
//           return;
//         }
//         session.excoTraderLoginId = text;
//         session.step = "exco_confirmed";
//         await ctx.replyWithHTML(
//           `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//             `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("🔵 CONTINUE", "continue_to_deriv"),
//           ])
//         );
//         break;
//       }
//     }
//   });

//   bot.action("continue_to_country", async (ctx) => {
//     await ctx.answerCbQuery();
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "captcha_confirmed") {
//       logger.error(
//         `[continue_to_country] Invalid userId (${userId}) or session step (${session?.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     session.step = "country";
//     await ctx.replyWithHTML(
//       `<b>🌍 Country Selection</b>\n\n` + `What is your country of residence?`,
//       Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]])
//         .oneTime()
//         .resize()
//     );
//   });

//   bot.action("done_exco", async (ctx) => {
//     await ctx.answerCbQuery();
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "waiting_for_done") {
//       logger.error(
//         `[done_exco] Invalid userId (${userId}) or session step (${session?.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     session.step = "exco_login";
//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//         `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//         `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//         `📌 <b>Example:</b> <code>123456456</code>`
//     );
//   });

//   bot.action("continue_to_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "exco_confirmed") {
//       logger.error(
//         `[continue_to_deriv] Invalid userId (${userId}) or session step (${session?.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     session.step = "deriv";
//     await ctx.replyWithHTML(
//       `<b>📌 Step 3: Deriv Registration (Optional)</b>\n\n` +
//         `We also give synthetic signals.\n` +
//         `Create a Deriv account to take Synthetic Trades 👉 <a href="${
//           process.env.DERIV_LINK || "https://fxht.short.gy/DeTGB"
//         }">Deriv Registration Link</a>\n\n` +
//         `✅ Click <b>Done</b> after registration, or <b>Skip</b> to proceed.`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("✅ Done", "done_deriv"),
//         Markup.button.callback("⏭ Skip", "done_deriv"),
//       ])
//     );
//   });

//   bot.action("done_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "deriv") {
//       logger.error(
//         `[done_deriv] Invalid userId (${userId}) or session step (${session?.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     session.step = "final_confirmation";
//     const details = [
//       `Exco Trader Login ID: ${session.excoTraderLoginId || "Not provided"}`
//     ]
//       .filter(Boolean)
//       .join("\n");

//     await ctx.replyWithHTML(
//       `<b>Final Confirmation</b>\n\n` +
//         `📌 <b>Your Details:</b>\n` +
//         `${details}\n\n` +
//         `⚠️ <b>Not correct?</b> Type <b>/start</b> to restart the process.\n\n` +
//         `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//         Markup.button.callback("❌ CANCEL", "cancel_final"),
//       ])
//     );
//   });

//   bot.action("continue_to_login_id", async (ctx) => {
//     await ctx.answerCbQuery();
//     const userId = ctx.from?.id.toString();
//     const session = userSession[userId];
//     if (!session || session.step !== "login_id") {
//       logger.error(
//         `[continue_to_login_id] Invalid userId (${userId}) or session step (${session?.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//         `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//         `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//         `📌 <b>Example:</b> <code>5677123456</code>`
//     );
//   });

//   async function saveAndNotify(ctx: any, session: any) {
//     const telegramId = ctx.from.id.toString();
//     try {
//       if (!session.country) {
//         throw new Error("Country is missing in session data");
//       }
//       if (!session.excoTraderLoginId) {
//         throw new Error("Exco Trader Login ID is missing");
//       }

//       const user = await ForexUserModel.findOneAndUpdate(
//         { telegramId, botType: session.botType },
//         {
//           telegramId,
//           username: ctx.from.username || "unknown",
//           fullName:
//             `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() ||
//             "Unknown User",
//           botType: "forex",
//           country: session.country,
//           excoTraderLoginId: session.excoTraderLoginId,
//           status: "pending",
//         },
//         { upsert: true, new: true, maxTimeMS: 20000 }
//       );

//       await ctx.replyWithHTML(
//         `<b>✅ Submission Successful!</b>\n\n` +
//           `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
//           `📌 <i>You will receive a link to join the signal channel once approved.</i>\n\n`
//       );

//       await sendAdminAlertForex(user);
//     } catch (error) {
//       logger.error(`[saveAndNotify] Error for user ${telegramId}:`, error);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to submit your details. Please try again later or contact an admin.`
//       );
//     }
//   }

//   watchUserStatusChanges();

//   bot.catch((err, ctx) => {
//     console.error(
//       `🚨 Forex Bot Error for update ${ctx.update.update_id}:`,
//       err
//     );
//     ctx.reply("❌ An error occurred. Please try again later.");
//   });
// }































// import { Telegraf, Markup, Context } from "telegraf";
// import { message } from "telegraf/filters";
// import { IFOREX_User, ForexUserModel } from "../models/forex_user.model";
// import { sendAdminAlertForex } from "../utils/services/notifier-forex";
// import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
// import { isValidLoginID } from "../utils/validate";
// import rateLimit from "telegraf-ratelimit";
// import { createLogger, transports, format } from "winston";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import { MongoClient } from "mongodb";

// // Extend BotContext here to include saveSession
// export interface BotContext extends Context {
//   session?: any;
//   saveSession?: () => Promise<void>;
// }

// dotenv.config({
//   path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });

// const GROUP_CHAT_ID = process.env.FOREX_GROUP_CHAT_ID;

// // MongoDB connection function
// async function connectDB() {
//   const mongoUri = process.env.MONGODB_URI;
//   if (!mongoUri) {
//     throw new Error("MONGODB_URI is not defined in environment variables");
//   }

//   console.log("Connecting to MongoDB...");
//   try {
//     if (mongoose.connection.readyState !== 1) {
//       await mongoose.connect(mongoUri, {
//         retryWrites: true,
//         writeConcern: { w: "majority" },
//         connectTimeoutMS: 15000,
//         serverSelectionTimeoutMS: 10000,
//         socketTimeoutMS: 60000,
//         maxPoolSize: 10,
//       });
//       console.log("✅ MongoDB connected successfully");
//     }
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//     throw err;
//   }
// }

// // Initialize MongoDB connection
// connectDB().catch((error) => {
//   console.error("[Startup] Failed to initialize MongoDB:", error);
// });

// // Custom session manager
// class SessionManager {
//   private collection: any;
//   private client: MongoClient;

//   constructor() {
//     const mongoUri = process.env.MONGODB_URI;
//     if (!mongoUri) throw new Error("MONGODB_URI not defined");
    
//     this.client = new MongoClient(mongoUri);
//     this.collection = null;
//   }

//   async init() {
//     await this.client.connect();
//     const db = this.client.db();
//     this.collection = db.collection("forex_sessions");
//     console.log("✅ Custom Forex session manager initialized");
//   }

//   async getSession(telegramId: string) {
//     if (!this.collection) await this.init();
//     const session = await this.collection.findOne({ telegramId });
//     return session || {
//       step: "welcome",
//       botType: "forex",
//       telegramId,
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };
//   }

//   async saveSession(telegramId: string, sessionData: any) {
//     if (!this.collection) await this.init();
//     await this.collection.updateOne(
//       { telegramId },
//       {
//         $set: {
//           ...sessionData,
//           telegramId,
//           updatedAt: new Date()
//         }
//       },
//       { upsert: true }
//     );
//   }
// }

// // Create session manager instance
// const sessionManager = new SessionManager();

// export interface BotContext extends Context {
//   session?: any;
//   saveSession?: () => Promise<void>;
// }

// export default function (bot: Telegraf<BotContext>) {
//   // Custom session middleware
//   bot.use(async (ctx, next) => {
//     const telegramId = ctx.from?.id.toString();
//     if (!telegramId) return next();
    
//     // Get session from DB
//     ctx.session = await sessionManager.getSession(telegramId);
    
//     // Add save method to context
//     ctx.saveSession = async () => {
//       await sessionManager.saveSession(telegramId, ctx.session);
//     };
    
//     await next();
    
//     // Save session after handling
//     if (ctx.saveSession) {
//       await ctx.saveSession();
//     }
//   });

//   const logger = createLogger({
//     level: "warn",
//     transports: [
//       new transports.Console({
//         format: format.combine(format.timestamp(), format.simple()),
//       }),
//     ],
//   });

//   const getLinkLimiter = rateLimit({
//     window: 60_000,
//     limit: 3,
//     onLimitExceeded: (ctx) =>
//       ctx.reply("🚫 Too many link requests! Try again later."),
//   });

//   // Notify user on status change
//   async function notifyUserOnStatusChange(change: any) {
//     const user = change.fullDocument as IFOREX_User;
//     if (!user || !user.telegramId) return;

//     if (user.status === "approved") {
//       await bot.telegram.sendMessage(
//         user.telegramId,
//         `<b>🎉 Congratulations!</b> Your registration has been approved. ✅\n\n` +
//           `🔗 <b>Welcome to Afibie Fx Signals!</b> 🚀\n\n` +
//           `👉 Click the button below to receive your exclusive invite link.\n\n` +
//           `⚠️ <i>Note:</i> This link is time-sensitive and may expire soon.\n\n` +
//           `🔥 <i>Enjoy your journey and happy trading!</i> 📈`,
//         {
//           parse_mode: "HTML",
//           reply_markup: Markup.inlineKeyboard([
//             Markup.button.callback("🔗 Click to Get Link", "get_invite_link"),
//           ]).reply_markup,
//         }
//       );
//     } else if (user.status === "rejected") {
//       const reasonMessage =
//         user.rejectionReason === "no_affiliate_link"
//           ? "Your Exco Trader account was not registered using our affiliate link."
//           : user.rejectionReason === "insufficient_deposit"
//           ? "Your Exco Trader account does not have a minimum deposit of $100."
//           : "No specific reason provided.";

//       const nextSteps =
//         user.rejectionReason === "no_affiliate_link"
//           ? `To gain access to Afibie FX signals, register a new Exco Trader account using our affiliate  link:\n\n` +
//             `👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//             `Once registered, click /start to begin again.`
//           : user.rejectionReason === "insufficient_deposit"
//           ? `To proceed, please deposit at least $100 into your Exco Trader account.\n\n` +
//             `Once deposited, click /start to begin again.`
//           : `Please contact an admin for assistance on next steps.`;

//       const rejectionMessage =
//         `<b>❌ Your registration was rejected.</b>\n\n` +
//         `👤 <b>Your Exco Trader Login ID:</b> <code>${
//           user.excoTraderLoginId || "N/A"
//         }</code>\n` +
//         `⚠️ <b>Reason:</b> ${reasonMessage}\n\n` +
//         `${nextSteps}\n\n`;

//       await bot.telegram.sendMessage(user.telegramId, rejectionMessage, {
//         parse_mode: "HTML",
//       });
//     }
//   }

//   // Watch for status changes in MongoDB
//   async function watchUserStatusChanges() {
//     try {
//       await connectDB();
//       const changeStream = ForexUserModel.watch([], {
//         fullDocument: "updateLookup",
//       });
//       changeStream.on("change", (change) => {
//         if (
//           change.operationType === "update" &&
//           change.updateDescription.updatedFields?.status
//         ) {
//           notifyUserOnStatusChange(change);
//         }
//       });
//     } catch (error) {
//       console.error(
//         "[watchUserStatusChanges] Error setting up change stream:",
//         error
//       );
//     }
//   }

//   bot.start(async (ctx) => {
//     // Reset session on start
//     ctx.session = {
//       step: "welcome",
//       botType: "forex",
//       telegramId: ctx.from.id.toString(),
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };
//      if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//     await ctx.replyWithHTML(
//       `<b>🛠 Welcome to <u>Afibie FX Signal</u>! 🚀</b>\n\n` +
//         `📈 <i>Home of <b>Exclusive FOREX signals</b></i>\n\n` +
//         `<b>To gain access, complete these steps 👇</b>\n\n` +
//         `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
//         `✅ <b>Step 2:</b> Register at Exco Trader, deposit <b>$100</b> or more, and provide your <b>Login ID</b> 💰\n` +
//         `✅ <b>Step 3:</b> Create Deriv account (Optional) 📊\n\n` +
//         `⏳ <b>Once all steps are completed, you will gain full access to Afibie FX Signals - where strategy meets profitability!</b> 💰📊\n\n` +
//          `<i>(If you have any issues during the process, message support 👉 @Francis_Nbtc)</i>\n\n` +
//         `👉 Click <b>CONTINUE</b> to start:`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("🔵 CONTINUE", "continue_to_captcha"),
//       ])
//     );
//   });

//   bot.action("continue_to_captcha", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (ctx.session.step !== "welcome") {
//       logger.warn(
//         `[continue_to_captcha] Invalid session step (${ctx.session.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "captcha";
//     const captcha = generateCaptcha();
//     ctx.session.captcha = captcha;
//       if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//     await ctx.replyWithHTML(
//       `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
//         `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
//         `👉 <b>Type this number:</b> <code>${captcha}</code>`
//     );
//   });

//   bot.action("get_invite_link", getLinkLimiter, async (ctx) => {
//     const telegramId = ctx.from?.id?.toString();
//     if (!telegramId) {
//       logger.error("[get_invite_link] No user ID found");
//       return;
//     }

//     try {
//       await connectDB();
//       const user = await ForexUserModel.findOne({
//         telegramId,
//         botType: "forex",
//       });
//       if (!user || user.status !== "approved") {
//         logger.warn("Unauthorized get_invite_link attempt", { telegramId });
//         await ctx.replyWithHTML(
//           `⚠️ Your access link has expired or you are not yet approved.\n` +
//             `📩 Please contact an admin.`
//         );
//         return;
//       }

//       if (!GROUP_CHAT_ID) {
//         throw new Error("GROUP_CHAT_ID is not defined");
//       }

//       const inviteLink = await bot.telegram.createChatInviteLink(
//         GROUP_CHAT_ID,
//         {
//           expire_date: Math.floor(Date.now() / 1000) + 1800,
//           member_limit: 1,
//         }
//       );
//       await ctx.replyWithHTML(
//         `<b>🔗 Welcome to Afibie FX Signals! 🚀</b>\n\n` +
//           `Here's your exclusive access link: <a href="${inviteLink.invite_link}">${inviteLink.invite_link}</a>\n\n` +
//           `⚠️ <b>Note:</b> This link is time-sensitive and will expire in 30 minutes.\n` +
//           `Enjoy your journey & happy trading! 📈🔥`
//       );
//     } catch (error) {
//       logger.error("Error generating invite link", { telegramId, error });
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to generate invite link. Please try again later or contact an admin.`
//       );
//     }
//   });

//   bot.action("confirm_final", async (ctx) => {
//     await ctx.answerCbQuery();
    
//     // Refresh session before processing
//     ctx.session = await sessionManager.getSession(ctx.from.id.toString());
//     console.log('last-step:', ctx.session.step);
    
//     if (ctx.session.step !== "final_confirmation") {
//       await ctx.replyWithHTML(
//         `${ctx.session}<b>⚠️ Error</b>\n\n🚫 Session expired or invalid. Please start over with /start.`
//       );
//       return;
//     }

//     try {
//       await connectDB();
//       await saveAndNotify(ctx, ctx.session);
      
//       // Clear session after successful submission
//       ctx.session = {
//         step: "completed",
//         botType: "forex",
//         telegramId: ctx.from.id.toString(),
//         createdAt: new Date(),
//         updatedAt: new Date()
//       };
//        if (ctx.saveSession) {
//       await ctx.saveSession();
//     }
      
//       await ctx.editMessageReplyMarkup(undefined); // Remove buttons after confirmation
//     } catch (error: any) {
//       console.error(`[confirm_final] Error:`, error);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n🚫 Failed to submit details. Please try again.`
//       );
//     }
//   });

//   bot.action("cancel_final", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (ctx.session.step !== "final_confirmation") {
//       logger.error(
//         `[cancel_final] Invalid session step (${ctx.session.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid action. Please start over with /start.`
//       );
//       return;
//     }

//     // Reset session
//     ctx.session = {
//       step: "welcome",
//       botType: "forex",
//       telegramId: ctx.from.id.toString(),
//       createdAt: new Date(),
//       updatedAt: new Date()
//     };
//       if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//     await ctx.replyWithHTML(
//       `<b>🛠 Registration Cancelled</b>\n\n` +
//         `📌 You have cancelled the registration process.\n\n` +
//         `👉 Type <b>/start</b> to begin again.`
//     );
//     await ctx.editMessageReplyMarkup(undefined);
//   });

//   bot.on(message("text"), async (ctx) => {
//     const text = ctx.message.text.trim();
//     const session = ctx.session;

//     switch (session.step) {
//       case "captcha": {
//         if (!session.captcha) {
//           console.error("Captcha not found in session");
//           await ctx.reply("Session error. Please start over with /start");
//           return;
//         }

//         if (verifyCaptcha(text, session.captcha)) {
//           session.step = "captcha_confirmed";
//             if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//           await ctx.replyWithHTML(
//             `✅ <b>Correct!</b>\n\n` +
//               `You've passed the captcha verification.\n\n` +
//               `👉 Click <b>CONTINUE</b> to proceed to country selection.`,
//             Markup.inlineKeyboard([
//               Markup.button.callback("🔵 CONTINUE", "continue_to_country"),
//             ])
//           );
//         } else {
//           const newCaptcha = generateCaptcha();
//           session.captcha = newCaptcha;
//            if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//           await ctx.replyWithHTML(
//             `❌ <b>Incorrect Captcha</b>\n\n` +
//               `🚫 Please try again:\n` +
//               `👉 Type this number: <code>${newCaptcha}</code>`
//           );
//         }
//         break;
//       }

//       case "country": {
//         session.country = text;
//         session.step = "waiting_for_done";
//           if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//         await ctx.replyWithHTML(
//           `<b>🌍 Step 2: Exco Trader Registration</b>\n\n` +
//             `📌 <b>Sign up here</b> 👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//             `✅ Click <b>Done</b> after completing your registration!\n\n` +
//             `📌 <b>Deposit Requirement:</b>\n` +
//             `⚡ To gain access, deposit at least <b>$100</b> into your Exco Trader account.\n\n` +
//             `💬 <i>Note: The Exco team may contact you to assist with setting up your account.</i>\n\n` +
//             `📌 <b>Submit Exco Trader Login ID</b>\n` +
//             `🔹 Check your email for your Login ID.\n` +
//             `🔹 Enter your Login ID below after clicking Done.`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("✅ Done", "done_exco"),
//           ])
//         );
//         break;
//       }

//       case "exco_login": {
//         if (!isValidLoginID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>123456565</code>`
//           );
//           return;
//         }
//         session.excoTraderLoginId = text;
//         session.step = "exco_confirmed";
//          if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//         await ctx.replyWithHTML(
//           `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//             `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("🔵 CONTINUE", "continue_to_deriv"),
//           ])
//         );
//         break;
//       }

//       case "deriv": {
//         if (!isValidLoginID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid Deriv Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>DR123456</code>`
//           );
//           return;
//         }
//         session.derivLoginId = text;
//         session.step = "final_confirmation";
//          if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//         const details = [
//           `Exco Trader Login ID: ${session.excoTraderLoginId || "Not provided"}`
//         ]
//           .filter(Boolean)
//           .join("\n");

//         await ctx.replyWithHTML(
//           `<b>Final Confirmation</b>\n\n` +
//             `📌 <b>Your Details:</b>\n` +
//             `${details}\n\n` +
//             ` <b>correct?</b>\n` +
//             `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//             Markup.button.callback("❌ CANCEL", "cancel_final"),
//           ])
//         );
//         break;
//       }

//       case "login_id": {
//         if (!isValidLoginID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>EX123456</code>`
//           );
//           return;
//         }
//         session.excoTraderLoginId = text;
//         session.step = "exco_confirmed";
//           if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//         await ctx.replyWithHTML(
//           `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//             `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("🔵 CONTINUE", "continue_to_deriv"),
//           ])
//         );
//         break;
//       }
//     }
//   });

//   bot.action("continue_to_country", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (ctx.session.step !== "captcha_confirmed") {
//       logger.error(
//         `[continue_to_country] Invalid session step (${ctx.session.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "country";
//      if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//     await ctx.replyWithHTML(
//       `<b>🌍 Country Selection</b>\n\n` + `What is your country of residence?`,
//       Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]])
//         .oneTime()
//         .resize()
//     );
//   });

//   bot.action("done_exco", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (ctx.session.step !== "waiting_for_done") {
//       logger.error(
//         `[done_exco] Invalid session step (${ctx.session.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "exco_login";
//      if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//         `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//         `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//         `📌 <b>Example:</b> <code>123456456</code>`
//     );
//   });

//   bot.action("continue_to_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (ctx.session.step !== "exco_confirmed") {
//       logger.error(
//         `[continue_to_deriv] Invalid session step (${ctx.session.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "deriv";
//      if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//     await ctx.replyWithHTML(
//       `<b>📌 Step 3: Deriv Registration (Optional)</b>\n\n` +
//         `We also give synthetic signals.\n` +
//         `Create a Deriv account to take Synthetic Trades 👉 <a href="${
//           process.env.DERIV_LINK || "https://fxht.short.gy/DeTGB"
//         }">Deriv Registration Link</a>\n\n` +
//         `✅ Click <b>Done</b> after registration, or <b>Skip</b> to proceed.`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("✅ Done", "done_deriv"),
//         Markup.button.callback("⏭ Skip", "done_deriv"),
//       ])
//     );
//   });

//   bot.action("done_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (ctx.session.step !== "deriv") {
//       logger.error(
//         `[done_deriv] Invalid session step (${ctx.session.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "final_confirmation";
//      if (ctx.saveSession) {
//       await ctx.saveSession();
//     }

//     const details = [
//       `Exco Trader Login ID: ${ctx.session.excoTraderLoginId || "Not provided"}`
//     ]
//       .filter(Boolean)
//       .join("\n");

//     await ctx.replyWithHTML(
//       `<b>Final Confirmation</b>\n\n` +
//         `📌 <b>Your Details:</b>\n` +
//         `${details}\n\n` +
//         `⚠️ <b>Not correct?</b> Type <b>/start</b> to restart the process.\n\n` +
//         `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//         Markup.button.callback("❌ CANCEL", "cancel_final"),
//       ])
//     );
//   });

//   bot.action("continue_to_login_id", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (ctx.session.step !== "login_id") {
//       logger.error(
//         `[continue_to_login_id] Invalid session step (${ctx.session.step})`
//       );
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//         `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//         `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//         `📌 <b>Example:</b> <code>5677123456</code>`
//     );
//   });

//   async function saveAndNotify(ctx: any, session: any) {
//     const telegramId = ctx.from.id.toString();
//     try {
//       if (!session.country) {
//         throw new Error("Country is missing in session data");
//       }
//       if (!session.excoTraderLoginId) {
//         throw new Error("Exco Trader Login ID is missing");
//       }

//       const user = await ForexUserModel.findOneAndUpdate(
//         { telegramId, botType: session.botType },
//         {
//           telegramId,
//           username: ctx.from.username || "unknown",
//           fullName:
//             `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() ||
//             "Unknown User",
//           botType: "forex",
//           country: session.country,
//           excoTraderLoginId: session.excoTraderLoginId,
//           status: "pending",
//         },
//         { upsert: true, new: true, maxTimeMS: 20000 }
//       );

//       await ctx.replyWithHTML(
//         `<b>✅ Submission Successful!</b>\n\n` +
//           `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
//           `📌 <i>You will receive a link to join the signal channel once approved.</i>\n\n`
//       );

//       await sendAdminAlertForex(user);
//     } catch (error) {
//       logger.error(`[saveAndNotify] Error for user ${telegramId}:`, error);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to submit your details. Please try again later or contact an admin.`
//       );
//     }
//   }

//   watchUserStatusChanges();

//   bot.catch((err, ctx) => {
//     console.error(
//       `🚨 Forex Bot Error for update ${ctx.update.update_id}:`,
//       err
//     );
//     ctx.reply("❌ An error occurred. Please try again later.");
//   });
// }






























// import { Telegraf, Markup } from "telegraf";
// import { message } from "telegraf/filters";
// import { IFOREX_User, ForexUserModel } from "../models/forex_user.model";
// import { sendAdminAlertForex } from "../utils/services/notifier-forex";
// import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
// import { isValidLoginID } from "../utils/validate";
// import rateLimit from "telegraf-ratelimit";
// import { createLogger, transports, format } from "winston";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import { MongoClient } from "mongodb";
// import { Context } from "telegraf";

// // Environment configuration
// dotenv.config({
//   path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });

// const GROUP_CHAT_ID = process.env.FOREX_GROUP_CHAT_ID;

// // Define BaseBotContext and BotContext
// export interface BaseBotContext extends Context {}

// export interface SessionData {
//   step: string;
//   botType: string;
//   telegramId?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
//   captcha?: string;
//   country?: string;
//   excoTraderLoginId?: string;
//   derivLoginId?: string;
//   [key: string]: any;
// }

// export interface BotContext extends BaseBotContext {
//   session: SessionData;
//   saveSession?: () => Promise<void>;
// }

// // MongoDB connection function
// async function connectDB() {
//   const mongoUri = process.env.MONGODB_URI;
//   if (!mongoUri) {
//     throw new Error("MONGODB_URI is not defined in environment variables");
//   }

//   console.log("Connecting to MongoDB...");
//   try {
//     if (mongoose.connection.readyState !== 1) {
//       await mongoose.connect(mongoUri, {
//         retryWrites: true,
//         writeConcern: { w: "majority" },
//         connectTimeoutMS: 15000,
//         serverSelectionTimeoutMS: 10000,
//         socketTimeoutMS: 60000,
//         maxPoolSize: 10,
//       });
//       console.log("✅ MongoDB connected successfully");
//     }
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//     throw err;
//   }
// }

// // Initialize MongoDB connection
// connectDB().catch((error) => {
//   console.error("[Startup] Failed to initialize MongoDB:", error);
// });

// // Custom session manager with locking
// class SessionManager {
//   private collection: any;
//   private client: MongoClient;
//   private locks: Map<string, Promise<void>> = new Map();

//   constructor() {
//     const mongoUri = process.env.MONGODB_URI;
//     if (!mongoUri) throw new Error("MONGODB_URI not defined");
//     this.client = new MongoClient(mongoUri);
//     this.collection = null;
//   }

//   async init() {
//     await this.client.connect();
//     const db = this.client.db();
//     this.collection = db.collection("forex_sessions");
//     console.log("✅ Custom Forex session manager initialized");
//   }

//   async getSession(telegramId: string) {
//     if (!this.collection) await this.init();
//     if (this.locks.has(telegramId)) {
//       await this.locks.get(telegramId);
//     }
//     const session = await this.collection.findOne({ telegramId });
//     return session || {
//       step: "welcome",
//       botType: "forex",
//       telegramId,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
//   }

//   async saveSession(telegramId: string, sessionData: any) {
//     if (!this.collection) await this.init();
//     const savePromise = this.collection.updateOne(
//       { telegramId },
//       {
//         $set: {
//           ...sessionData,
//           telegramId,
//           updatedAt: new Date(),
//         },
//       },
//       { upsert: true }
//     );
//     this.locks.set(telegramId, savePromise);
//     await savePromise;
//     this.locks.delete(telegramId);
//   }
// }

// // Create session manager instance
// const sessionManager = new SessionManager();

// // Logger configuration
// const logger = createLogger({
//   level: "warn",
//   transports: [
//     new transports.Console({
//       format: format.combine(format.timestamp(), format.simple()),
//     }),
//   ],
// });

// // Rate limiters
// const actionLimiter = rateLimit({
//   window: 1000, // 1-second window
//   limit: 1, // 1 action per second
//   onLimitExceeded: (ctx) =>
//     ctx.reply("🚫 Please wait a moment before trying again."),
// });

// const getLinkLimiter = rateLimit({
//   window: 60_000,
//   limit: 3,
//   onLimitExceeded: (ctx) =>
//     ctx.reply("🚫 Too many link requests! Try again later."),
// });

// export default function (bot: Telegraf<BotContext>) {
//   // Session middleware
//   bot.use(async (ctx, next) => {
//     const telegramId = ctx.from?.id.toString();
//     ctx.saveSession = async () => {};
//     if (!telegramId) {
//       logger.error("[Session Middleware] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     ctx.session = await sessionManager.getSession(telegramId);
//     ctx.session.telegramId = telegramId; // Ensure telegramId is set
//     ctx.saveSession = async () => {
//       await sessionManager.saveSession(telegramId, ctx.session);
//     };
//     await next();
//     await ctx.saveSession();
//   });

//   // Apply rate limiter for actions
//   bot.use(actionLimiter);

//   // Notify user on status change
//   async function notifyUserOnStatusChange(change: any) {
//     const user = change.fullDocument as IFOREX_User;
//     if (!user || !user.telegramId) return;

//     if (user.status === "approved") {
//       await bot.telegram.sendMessage(
//         user.telegramId,
//         `<b>🎉 Congratulations!</b> Your registration has been approved. ✅\n\n` +
//           `🔗 <b>Welcome to Afibie Fx Signals!</b> 🚀\n\n` +
//           `👉 Click the button below to receive your exclusive invite link.\n` +
//           `⚠️ <i>Note:</i> This link is time-sensitive and may expire soon.\n\n` +
//           `🔥 <i>Enjoy your journey and happy trading!</i> 📈`,
//         {
//           parse_mode: "HTML",
//           reply_markup: Markup.inlineKeyboard([
//             Markup.button.callback("🔗 Click to Get Link", "get_invite_link"),
//           ]).reply_markup,
//         }
//       );
//     } else if (user.status === "rejected") {
//       const reasonMessage =
//         user.rejectionReason === "no_affiliate_link"
//           ? "Your Exco Trader account was not registered using our affiliate link."
//           : user.rejectionReason === "insufficient_deposit"
//           ? "Your Exco Trader account does not have a minimum deposit of $100."
//           : "No specific reason provided.";

//       const nextSteps =
//         user.rejectionReason === "no_affiliate_link"
//           ? `To gain access to Afibie FX signals, register a new Exco Trader account using our affiliate link:\n\n` +
//             `👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//             `Once registered, click /start to begin again.`
//           : user.rejectionReason === "insufficient_deposit"
//           ? `To proceed, please deposit at least $100 into your Exco Trader account.\n\n` +
//             `Once deposited, click /start to begin again.`
//           : `Please contact an admin for assistance on next steps.`;

//       const rejectionMessage =
//         `<b>❌ Your registration was rejected.</b>\n\n` +
//         `👤 <b>Your Exco Trader Login ID:</b> <code>${user.excoTraderLoginId || "N/A"}</code>\n` +
//         `⚠️ <b>Reason:</b> ${reasonMessage}\n\n` +
//         `${nextSteps}\n\n`;

//       await bot.telegram.sendMessage(user.telegramId, rejectionMessage, {
//         parse_mode: "HTML",
//       });
//     }
//   }

//   // Watch for status changes in MongoDB
//   async function watchUserStatusChanges() {
//     try {
//       await connectDB();
//       const changeStream = ForexUserModel.watch([], {
//         fullDocument: "updateLookup",
//       });
//       changeStream.on("change", (change) => {
//         if (
//           change.operationType === "update" &&
//           change.updateDescription.updatedFields?.status
//         ) {
//           notifyUserOnStatusChange(change);
//         }
//       });
//     } catch (error) {
//       console.error("[watchUserStatusChanges] Error setting up change stream:", error);
//     }
//   }

//   bot.start(async (ctx) => {
//     if (!ctx.from) {
//       logger.error("[start] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     ctx.session = {
//       step: "welcome",
//       botType: "forex",
//       telegramId,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
//     await ctx.saveSession?.();

//     await ctx.replyWithHTML(
//       `<b>🛠 Welcome to <u>Afibie FX Signal</u>! 🚀</b>\n\n` +
//         `📈 <i>Home of <b>Exclusive FOREX signals</b></i>\n\n` +
//         `<b>To gain access, complete these steps 👇</b>\n\n` +
//         `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
//         `✅ <b>Step 2:</b> Register at Exco Trader, deposit <b>$100</b> or more, and provide your <b>Login ID</b> 💰\n` +
//         `✅ <b>Step 3:</b> Create Deriv account (Optional) 📊\n\n` +
//         `⏳ <b>Once all steps are completed, you will gain full access to Afibie FX Signals - where strategy meets profitability!</b> 💰📊\n\n` +
//         `<i>(If you have any issues during the process, message support 👉 @Francis_Nbtc)</i>\n\n` +
//         `👉 Click <b>CONTINUE</b> to start:`,
//       Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_captcha")])
//     );
//   });

//   bot.action("continue_to_captcha", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[continue_to_captcha] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     if (ctx.session.step !== "welcome") {
//       logger.warn(`[continue_to_captcha] Invalid session step (${ctx.session.step})`);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "captcha";
//     const captcha = generateCaptcha();
//     ctx.session.captcha = captcha;
//     await ctx.saveSession?.();

//     await ctx.replyWithHTML(
//       `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
//         `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
//         `👉 <b>Type this number:</b> <code>${captcha}</code>`
//     );
//   });

//   bot.action("get_invite_link", getLinkLimiter, async (ctx) => {
//     if (!ctx.from) {
//       logger.error("[get_invite_link] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();

//     try {
//       await connectDB();
//       const user = await ForexUserModel.findOne({
//         telegramId,
//         botType: "forex",
//       });
//       if (!user || user.status !== "approved") {
//         logger.warn("Unauthorized get_invite_link attempt", { telegramId });
//         await ctx.replyWithHTML(
//           `⚠️ Your access link has expired or you are not yet approved.\n` +
//             `📩 Please contact an admin.`
//         );
//         return;
//       }

//       if (!GROUP_CHAT_ID) {
//         throw new Error("GROUP_CHAT_ID is not defined");
//       }

//       const inviteLink = await bot.telegram.createChatInviteLink(GROUP_CHAT_ID, {
//         expire_date: Math.floor(Date.now() / 1000) + 1800,
//         member_limit: 1,
//       });
//       await ctx.replyWithHTML(
//         `<b>🔗 Welcome to Afibie FX Signals! 🚀</b>\n\n` +
//           `Here's your exclusive access link: <a href="${inviteLink.invite_link}">${inviteLink.invite_link}</a>\n\n` +
//           `⚠️ <b>Note:</b> This link is time-sensitive and will expire in 30 minutes.\n` +
//           `Enjoy your journey & happy trading! 📈🔥`
//       );
//     } catch (error) {
//       logger.error("Error generating invite link", { telegramId, error });
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to generate invite link. Please try again later or contact an admin.`
//       );
//     }
//   });

//   bot.action("confirm_final", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[confirm_final] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     ctx.session = await sessionManager.getSession(telegramId);

//     if (ctx.session.step !== "final_confirmation") {
//       logger.warn(`[confirm_final] Invalid session step (${ctx.session.step})`);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Session expired or invalid. Please start over with /start.`
//       );
//       return;
//     }

//     try {
//       await connectDB();
//       await saveAndNotify(ctx, ctx.session);
//       ctx.session = {
//         step: "completed",
//         botType: "forex",
//         telegramId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       await ctx.saveSession?.();
//       await ctx.editMessageReplyMarkup(undefined);
//     } catch (error: any) {
//       logger.error(`[confirm_final] Error:`, error);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to submit details. Please try again.`
//       );
//     }
//   });

//   bot.action("cancel_final", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[cancel_final] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     ctx.session = await sessionManager.getSession(telegramId);

//     if (ctx.session.step !== "final_confirmation") {
//       logger.warn(`[cancel_final] Invalid session step (${ctx.session.step})`);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid action. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session = {
//       step: "welcome",
//       botType: "forex",
//       telegramId,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
//     await ctx.saveSession?.();

//     await ctx.replyWithHTML(
//       `<b>🛠 Registration Cancelled</b>\n\n` +
//         `📌 You have cancelled the registration process.\n\n` +
//         `👉 Type <b>/start</b> to begin again.`
//     );
//     await ctx.editMessageReplyMarkup(undefined);
//   });

//   bot.on(message("text"), async (ctx) => {
//     if (!ctx.from) {
//       logger.error("[text] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const text = ctx.message.text.trim();
//     const session = ctx.session;

//     switch (session.step) {
//       case "captcha": {
//         if (!session.captcha) {
//           console.error("Captcha not found in session");
//           await ctx.reply("Session error. Please start over with /start");
//           return;
//         }

//         if (verifyCaptcha(text, session.captcha)) {
//           session.step = "captcha_confirmed";
//           await ctx.saveSession?.();

//           await ctx.replyWithHTML(
//             `✅ <b>Correct!</b>\n\n` +
//               `You've passed the captcha verification.\n\n` +
//               `👉 Click <b>CONTINUE</b> to proceed to country selection.`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_country")])
//           );
//         } else {
//           const newCaptcha = generateCaptcha();
//           session.captcha = newCaptcha;
//           await ctx.saveSession?.();

//           await ctx.replyWithHTML(
//             `❌ <b>Incorrect Captcha</b>\n\n` +
//               `🚫 Please try again:\n` +
//               `👉 Type this number: <code>${newCaptcha}</code>`
//           );
//         }
//         break;
//       }

//       case "country": {
//         session.country = text;
//         session.step = "waiting_for_done";
//         await ctx.saveSession?.();

//         await ctx.replyWithHTML(
//           `<b>🌍 Step 2: Exco Trader Registration</b>\n\n` +
//             `📌 <b>Sign up here</b> 👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//             `✅ Click <b>Done</b> after completing your registration!\n\n` +
//             `📌 <b>Deposit Requirement:</b>\n` +
//             `⚡ To gain access, deposit at least <b>$100</b> into your Exco Trader account.\n\n` +
//             `💬 <i>Note: The Exco team may contact you to assist with setting up your account.</i>\n\n` +
//             `📌 <b>Submit Exco Trader Login ID</b>\n` +
//             `🔹 Check your email for your Login ID.\n` +
//             `🔹 Enter your Login ID below after clicking Done.`,
//           Markup.inlineKeyboard([Markup.button.callback("✅ Done", "done_exco")])
//         );
//         break;
//       }

//       case "exco_login": {
//         if (!isValidLoginID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>123456565</code>`
//           );
//           return;
//         }
//         session.excoTraderLoginId = text;
//         session.step = "exco_confirmed";
//         await ctx.saveSession?.();

//         await ctx.replyWithHTML(
//           `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//             `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//           Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_deriv")])
//         );
//         break;
//       }

//       case "deriv": {
//         if (!isValidLoginID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid Deriv Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>DR123456</code>`
//           );
//           return;
//         }
//         session.derivLoginId = text;
//         session.step = "final_confirmation";
//         await ctx.saveSession?.();

//         const details = [`Exco Trader Login ID: ${session.excoTraderLoginId || "Not provided"}`]
//           .filter(Boolean)
//           .join("\n");

//         await ctx.replyWithHTML(
//           `<b>Final Confirmation</b>\n\n` +
//             `📌 <b>Your Details:</b>\n` +
//             `${details}\n\n` +
//             `⚠️ <b>Not correct?</b> Type <b>/start</b> to restart the process.\n\n` +
//             `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//           Markup.inlineKeyboard([
//             Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//             Markup.button.callback("❌ CANCEL", "cancel_final"),
//           ])
//         );
//         break;
//       }

//       case "login_id": {
//         if (!isValidLoginID(text)) {
//           await ctx.replyWithHTML(
//             `❌ <b>Invalid Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>EX123456</code>`
//           );
//           return;
//         }
//         session.excoTraderLoginId = text;
//         session.step = "exco_confirmed";
//         await ctx.saveSession?.();

//         await ctx.replyWithHTML(
//           `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//             `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//           Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_deriv")])
//         );
//         break;
//       }
//     }
//   });

//   bot.action("continue_to_country", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[continue_to_country] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     ctx.session = await sessionManager.getSession(telegramId);

//     if (ctx.session.step !== "captcha_confirmed") {
//       logger.warn(`[continue_to_country] Invalid session step (${ctx.session.step})`);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "country";
//     await ctx.saveSession?.();

//     await ctx.replyWithHTML(
//       `<b>🌍 Country Selection</b>\n\n` + `What is your country of residence?`,
//       Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]]).oneTime().resize()
//     );
//   });

//   bot.action("done_exco", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[done_exco] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     ctx.session = await sessionManager.getSession(telegramId);

//     if (ctx.session.step !== "waiting_for_done") {
//       logger.warn(`[done_exco] Invalid session step (${ctx.session.step})`);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "exco_login";
//     await ctx.saveSession?.();

//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//         `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//         `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//         `📌 <b>Example:</b> <code>123456456</code>`
//     );
//   });

//   bot.action("continue_to_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[continue_to_deriv] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     ctx.session = await sessionManager.getSession(telegramId);

//     if (ctx.session.step !== "exco_confirmed") {
//       logger.warn(`[continue_to_deriv] Invalid session step (${ctx.session.step})`);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "deriv";
//     await ctx.saveSession?.();

//     await ctx.replyWithHTML(
//       `<b>📌 Step 3: Deriv Registration (Optional)</b>\n\n` +
//         `We also give synthetic signals.\n` +
//         `Create a Deriv account to take Synthetic Trades 👉 <a href="${
//           process.env.DERIV_LINK || "https://fxht.short.gy/DeTGB"
//         }">Deriv Registration Link</a>\n\n` +
//         `✅ Click <b>Done</b> after registration, or <b>Skip</b> to proceed.`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("✅ Done", "done_deriv"),
//         Markup.button.callback("⏭ Skip", "done_deriv"),
//       ])
//     );
//   });

//   bot.action("done_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[done_deriv] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     ctx.session = await sessionManager.getSession(telegramId);

//     if (ctx.session.step !== "deriv") {
//       logger.warn(`[done_deriv] Invalid session step (${ctx.session.step})`);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     ctx.session.step = "final_confirmation";
//     await ctx.saveSession?.();

//     const details = [`Exco Trader Login ID: ${ctx.session.excoTraderLoginId || "Not provided"}`]
//       .filter(Boolean)
//       .join("\n");

//     await ctx.replyWithHTML(
//       `<b>Final Confirmation</b>\n\n` +
//         `📌 <b>Your Details:</b>\n` +
//         `${details}\n\n` +
//         `⚠️ <b>Not correct?</b> Type <b>/start</b> to restart the process.\n\n` +
//         `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//       Markup.inlineKeyboard([
//         Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//         Markup.button.callback("❌ CANCEL", "cancel_final"),
//       ])
//     );
//   });

//   bot.action("continue_to_login_id", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[continue_to_login_id] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     ctx.session = await sessionManager.getSession(telegramId);

//     if (ctx.session.step !== "login_id") {
//       logger.warn(`[continue_to_login_id] Invalid session step (${ctx.session.step})`);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Invalid step. Please start over with /start.`
//       );
//       return;
//     }

//     await ctx.replyWithHTML(
//       `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//         `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//         `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//         `📌 <b>Example:</b> <code>5677123456</code>`
//     );
//   });

//   async function saveAndNotify(ctx: BotContext, session: SessionData) {
//     if (!ctx.from) {
//       logger.error("[saveAndNotify] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       if (!session.country) {
//         throw new Error("Country is missing in session data");
//       }
//       if (!session.excoTraderLoginId) {
//         throw new Error("Exco Trader Login ID is missing");
//       }

//       const user = await ForexUserModel.findOneAndUpdate(
//         { telegramId, botType: session.botType },
//         {
//           telegramId,
//           username: ctx.from.username || "unknown",
//           fullName:
//             `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() || "Unknown User",
//           botType: "forex",
//           country: session.country,
//           excoTraderLoginId: session.excoTraderLoginId,
//           status: "pending",
//         },
//         { upsert: true, new: true, maxTimeMS: 20000 }
//       );

//       await ctx.replyWithHTML(
//         `<b>✅ Submission Successful!</b>\n\n` +
//           `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
//           `📌 <i>You will receive a link to join the signal channel once approved.</i>\n\n`
//       );

//       await sendAdminAlertForex(user);
//     } catch (error) {
//       logger.error(`[saveAndNotify] Error for user ${telegramId}:`, error);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to submit your details. Please try again later or contact an admin.`
//       );
//     }
//   }

//   watchUserStatusChanges();

//   bot.catch((err, ctx) => {
//     console.error(`🚨 Forex Bot Error for update ${ctx.update.update_id}:`, err);
//     ctx.reply("❌ An error occurred. Please try again later.");
//   });
// }















































































// import { Telegraf, Markup} from "telegraf";
// import { message } from "telegraf/filters";
// import { IFOREX_User, ForexUserModel } from "../models/forex_user.model";
// import { sendAdminAlertForex } from "../utils/services/notifier-forex";
// import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
// import { isValidLoginID } from "../utils/validate";
// import rateLimit from "telegraf-ratelimit";
// import { createLogger, transports, format } from "winston";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import { MongoClient } from "mongodb";
// import { Context } from "telegraf";

// // Environment configuration
// dotenv.config({
//   path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });

// const GROUP_CHAT_ID = process.env.FOREX_GROUP_CHAT_ID;

// // Define BaseBotContext and BotContext
// export interface BaseBotContext extends Context {}

// export interface SessionData {
//   step: string;
//   botType: string;
//   telegramId?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
//   captcha?: string;
//   country?: string;
//   excoTraderLoginId?: string;
//   derivLoginId?: string;
//   [key: string]: any;
// }

// export interface BotContext extends BaseBotContext {
//   session: SessionData;
// }

// // MongoDB connection function
// async function connectDB() {
//   const mongoUri = process.env.MONGODB_URI;
//   if (!mongoUri) {
//     throw new Error("MONGODB_URI is not defined in environment variables");
//   }

//   console.log("Connecting to MongoDB...");
//   try {
//     if (mongoose.connection.readyState !== 1) {
//       await mongoose.connect(mongoUri, {
//         retryWrites: true,
//         writeConcern: { w: "majority" },
//         connectTimeoutMS: 30000,
//         serverSelectionTimeoutMS: 20000,
//         socketTimeoutMS: 60000,
//         maxPoolSize: 10,
//       });
//       console.log("✅ MongoDB connected successfully");
//     }
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//     throw err;
//   }
// }

// // Initialize MongoDB connection
// connectDB().catch((error) => {
//   console.error("[Startup] Failed to initialize MongoDB:", error);
// });

// // Custom session manager with stricter locking
// class SessionManager {
//   private collection: any;
//   private client: MongoClient;
//   private locks: Map<string, Promise<void>> = new Map();

//   constructor() {
//     const mongoUri = process.env.MONGODB_URI;
//     if (!mongoUri) throw new Error("MONGODB_URI not defined");
//     this.client = new MongoClient(mongoUri);
//     this.collection = null;
//   }

//   async init() {
//     await this.client.connect();
//     const db = this.client.db();
//     this.collection = db.collection("forex_sessions");
//     console.log("✅ Custom Forex session manager initialized");
//   }

//   async getSession(telegramId: string, retryCount = 5): Promise<SessionData> {
//     if (!this.collection) await this.init();
//     if (this.locks.has(telegramId)) {
//       await this.locks.get(telegramId); // Wait for any pending operations
//     }
//     for (let attempt = 1; attempt <= retryCount; attempt++) {
//       try {
//         const session = await this.collection.findOne({ telegramId }, { maxTimeMS: 20000 });
//         logger.info(`[getSession] Fetched session for ${telegramId}:`, session || { step: "welcome" });
//         return (
//           session || {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           }
//         );
//       } catch (error) {
//         logger.error(`[getSession] Attempt ${attempt} failed for ${telegramId}:`, error);
//         if (attempt === retryCount) {
//           logger.warn(`[getSession] Resetting session for ${telegramId} due to repeated failures`);
//           return {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//         }
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }
//     }
//     return {
//       step: "welcome",
//       botType: "forex",
//       telegramId,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
//   }

//   async saveSession(telegramId: string, sessionData: any, retryCount = 5): Promise<void> {
//     if (!this.collection) await this.init();
//     const lockPromise = (async () => {
//       try {
//         const result = await this.collection.updateOne(
//           { telegramId },
//           {
//             $set: {
//               ...sessionData,
//               telegramId,
//               updatedAt: new Date(),
//             },
//           },
//           { upsert: true, maxTimeMS: 20000 }
//         );
//         logger.info(`[saveSession] Saved session for ${telegramId}:`, sessionData);
//       } catch (error) {
//         logger.error(`[saveSession] Attempt failed for ${telegramId}:`, error);
//         throw error;
//       }
//     })();
//     this.locks.set(telegramId, lockPromise);
//     try {
//       await lockPromise;
//     } finally {
//       this.locks.delete(telegramId);
//     }
//   }
// }

// // Create session manager instance
// const sessionManager = new SessionManager();

// // Logger configuration
// const logger = createLogger({
//   level: "info",
//   transports: [
//     new transports.Console({
//       format: format.combine(format.timestamp(), format.simple()),
//     }),
//   ],
// });

// // Rate limiters
// const actionLimiter = rateLimit({
//   window: 3000, // Increased to 3 seconds
//   limit: 1,
//   onLimitExceeded: (ctx) =>
//     ctx.reply("🚫 Please wait a moment before trying again."),
// });

// const getLinkLimiter = rateLimit({
//   window: 60_000,
//   limit: 3,
//   onLimitExceeded: (ctx) =>
//     ctx.reply("🚫 Too many link requests! Try again later."),
// });

// export default function (bot: Telegraf<BotContext>) {
//   // Session middleware
//   bot.use(async (ctx, next) => {
//     if (!ctx.from) {
//       logger.error("[Session Middleware] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       ctx.session.telegramId = telegramId;
//       await sessionManager.saveSession(telegramId, ctx.session); // Save immediately to ensure consistency
//       logger.info(`[Middleware] Initialized session for ${telegramId}:`, ctx.session);
//       await next();
//     } catch (error) {
//       logger.error("[Session Middleware] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Session initialization failed. Please try again.");
//     }
//   });

//   // Apply rate limiter for actions
//   bot.use(actionLimiter);

//   // Notify user on status change
//   async function notifyUserOnStatusChange(change: any) {
//     const user = change.fullDocument as IFOREX_User;
//     if (!user || !user.telegramId) return;

//     if (user.status === "approved") {
//       await bot.telegram.sendMessage(
//         user.telegramId,
//         `<b>🎉 Congratulations!</b> Your registration has been approved. ✅\n\n` +
//           `🔗 <b>Welcome to Afibie Fx Signals!</b> 🚀\n\n` +
//           `👉 Click the button below to receive your exclusive invite link.\n` +
//           `⚠️ <i>Note:</i> This link is time-sensitive and may expire soon.\n\n` +
//           `🔥 <i>Enjoy your journey and happy trading!</i> 📈`,
//         {
//           parse_mode: "HTML",
//           reply_markup: Markup.inlineKeyboard([
//             Markup.button.callback("🔗 Click to Get Link", "get_invite_link"),
//           ]).reply_markup,
//         }
//       );
//     } else if (user.status === "rejected") {
//       const reasonMessage =
//         user.rejectionReason === "no_affiliate_link"
//           ? "Your Exco Trader account was not registered using our affiliate link."
//           : user.rejectionReason === "insufficient_deposit"
//           ? "Your Exco Trader account does not have a minimum deposit of $100."
//           : "No specific reason provided.";

//       const nextSteps =
//         user.rejectionReason === "no_affiliate_link"
//           ? `To gain access to Afibie FX signals, register a new Exco Trader account using our affiliate link:\n\n` +
//             `👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//             `Once registered, click /start to begin again.`
//           : user.rejectionReason === "insufficient_deposit"
//           ? `To proceed, please deposit at least $100 into your Exco Trader account.\n\n` +
//             `Once deposited, click /start to begin again.`
//           : `Please contact an admin for assistance on next steps.`;

//       const rejectionMessage =
//         `<b>❌ Your registration was rejected.</b>\n\n` +
//         `👤 <b>Your Exco Trader Login ID:</b> <code>${user.excoTraderLoginId || "N/A"}</code>\n` +
//         `⚠️ <b>Reason:</b> ${reasonMessage}\n\n` +
//         `${nextSteps}\n\n`;

//       await bot.telegram.sendMessage(user.telegramId, rejectionMessage, {
//         parse_mode: "HTML",
//       });
//     }
//   }

//   // Watch for status changes in MongoDB
//   async function watchUserStatusChanges() {
//     try {
//       await connectDB();
//       const changeStream = ForexUserModel.watch([], {
//         fullDocument: "updateLookup",
//       });
//       changeStream.on("change", (change) => {
//         if (
//           change.operationType === "update" &&
//           change.updateDescription.updatedFields?.status
//         ) {
//           notifyUserOnStatusChange(change);
//         }
//       });
//     } catch (error) {
//       console.error("[watchUserStatusChanges] Error setting up change stream:", error);
//     }
//   }

//   bot.start(async (ctx) => {
//     if (!ctx.from) {
//       logger.error("[start] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       ctx.session = {
//         step: "welcome",
//         botType: "forex",
//         telegramId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       await sessionManager.saveSession(telegramId, ctx.session);
//       logger.info(`[start] Session set to welcome for ${telegramId}:`, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>🛠 Welcome to <u>Afibie FX Signal</u>! 🚀</b>\n\n` +
//           `📈 <i>Home of <b>Exclusive FOREX signals</b></i>\n\n` +
//           `<b>To gain access, complete these steps 👇</b>\n\n` +
//           `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
//           `✅ <b>Step 2:</b> Register at Exco Trader, deposit <b>$100</b> or more, and provide your <b>Login ID</b> 💰\n` +
//           `✅ <b>Step 3:</b> Create Deriv account (Optional) 📊\n\n` +
//           `⏳ <b>Once all steps are completed, you will gain full access to Afibie FX Signals - where strategy meets profitability!</b> 💰📊\n\n` +
//           `<i>(If you have any issues during the process, message support 👉 @Francis_Nbtc)</i>\n\n` +
//           `👉 Click <b>CONTINUE</b> to start:`,
//         Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_captcha")])
//       );
//     } catch (error) {
//       logger.error("[start] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to initialize session. Please try again.");
//     }
//   });

//   bot.action("continue_to_captcha", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[continue_to_captcha] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       logger.info(`[continue_to_captcha] Session before check for ${telegramId}:`, ctx.session);
//       if (ctx.session.step !== "welcome") {
//         logger.warn(`[continue_to_captcha] Invalid session step (${ctx.session.step}), delaying reset`, { telegramId });
//         await new Promise((resolve) => setTimeout(resolve, 500)); // Delay to allow pending saves
//         ctx.session = await sessionManager.getSession(telegramId); // Re-fetch
//         if (ctx.session.step !== "welcome") {
//           ctx.session = {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           await sessionManager.saveSession(telegramId, ctx.session);
//           await ctx.replyWithHTML(
//             `<b>⚠️ Error</b>\n\n` +
//               `🚫 Invalid step. Please start over with /start.`
//           );
//           return;
//         }
//       }

//       ctx.session.step = "captcha";
//       ctx.session.captcha = generateCaptcha();
//       await sessionManager.saveSession(telegramId, ctx.session);
//       logger.info(`[continue_to_captcha] Session updated for ${telegramId}:`, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
//           `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
//           `👉 <b>Type this number:</b> <code>${ctx.session.captcha}</code>`
//       );
//     } catch (error) {
//       logger.error("[continue_to_captcha] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("get_invite_link", getLinkLimiter, async (ctx) => {
//     if (!ctx.from) {
//       logger.error("[get_invite_link] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();

//     try {
//       await connectDB();
//       const user = await ForexUserModel.findOne({
//         telegramId,
//         botType: "forex",
//       });
//       if (!user || user.status !== "approved") {
//         logger.warn("Unauthorized get_invite_link attempt", { telegramId });
//         await ctx.replyWithHTML(
//           `⚠️ Your access link has expired or you are not yet approved.\n` +
//             `📩 Please contact an admin.`
//         );
//         return;
//       }

//       if (!GROUP_CHAT_ID) {
//         throw new Error("GROUP_CHAT_ID is not defined");
//       }

//       const inviteLink = await bot.telegram.createChatInviteLink(GROUP_CHAT_ID, {
//         expire_date: Math.floor(Date.now() / 1000) + 1800,
//         member_limit: 1,
//       });
//       await ctx.replyWithHTML(
//         `<b>🔗 Welcome to Afibie FX Signals! 🚀</b>\n\n` +
//           `Here's your exclusive access link: <a href="${inviteLink.invite_link}">${inviteLink.invite_link}</a>\n\n` +
//           `⚠️ <b>Note:</b> This link is time-sensitive and will expire in 30 minutes.\n` +
//           `Enjoy your journey & happy trading! 📈🔥`
//       );
//     } catch (error) {
//       logger.error("Error generating invite link", { telegramId, error });
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to generate invite link. Please try again later or contact an admin.`
//       );
//     }
//   });

//   bot.action("confirm_final", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[confirm_final] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       logger.info(`[confirm_final] Session before check for ${telegramId}:`, ctx.session);
//       if (ctx.session.step !== "final_confirmation") {
//         logger.warn(`[confirm_final] Invalid session step (${ctx.session.step}), delaying reset`, { telegramId });
//         await new Promise((resolve) => setTimeout(resolve, 500));
//         ctx.session = await sessionManager.getSession(telegramId);
//         if (ctx.session.step !== "final_confirmation") {
//           ctx.session = {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           await sessionManager.saveSession(telegramId, ctx.session);
//           await ctx.replyWithHTML(
//             `<b>⚠️ Error</b>\n\n` +
//               `🚫 Session expired or invalid. Please start over with /start.`
//           );
//           return;
//         }
//       }

//       await connectDB();
//       await saveAndNotify(ctx, ctx.session);
//       ctx.session = {
//         step: "completed",
//         botType: "forex",
//         telegramId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       await sessionManager.saveSession(telegramId, ctx.session);
//       logger.info(`[confirm_final] Session updated to completed for ${telegramId}:`, ctx.session);

//       if (ctx.callbackQuery?.message && "text" in ctx.callbackQuery.message && ctx.callbackQuery.message.reply_markup) {
//         try {
//           await ctx.editMessageReplyMarkup(undefined);
//         } catch (error: any) {
//           if (error.message.includes("message is not modified")) {
//             logger.warn("[confirm_final] Reply markup unchanged, skipping", { telegramId });
//           } else {
//             throw error;
//           }
//         }
//       }
//     } catch (error: any) {
//       logger.error(`[confirm_final] Error for user`, { telegramId, error });
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to submit details. Please try again.`
//       );
//     }
//   });

//   bot.action("cancel_final", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[cancel_final] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       logger.info(`[cancel_final] Session before check for ${telegramId}:`, ctx.session);
//       if (ctx.session.step !== "final_confirmation") {
//         logger.warn(`[cancel_final] Invalid session step (${ctx.session.step}), delaying reset`, { telegramId });
//         await new Promise((resolve) => setTimeout(resolve, 500));
//         ctx.session = await sessionManager.getSession(telegramId);
//         if (ctx.session.step !== "final_confirmation") {
//           ctx.session = {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           await sessionManager.saveSession(telegramId, ctx.session);
//           await ctx.replyWithHTML(
//             `<b>⚠️ Error</b>\n\n` +
//               `🚫 Invalid action. Please start over with /start.`
//           );
//           return;
//         }
//       }

//       ctx.session = {
//         step: "welcome",
//         botType: "forex",
//         telegramId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       await sessionManager.saveSession(telegramId, ctx.session);
//       logger.info(`[cancel_final] Session reset to welcome for ${telegramId}:`, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>🛠 Registration Cancelled</b>\n\n` +
//           `📌 You have cancelled the registration process.\n\n` +
//           `👉 Type <b>/start</b> to begin again.`
//       );

//       if (ctx.callbackQuery?.message && "text" in ctx.callbackQuery.message && ctx.callbackQuery.message.reply_markup) {
//         try {
//           await ctx.editMessageReplyMarkup(undefined);
//         } catch (error: any) {
//           if (error.message.includes("message is not modified")) {
//             logger.warn("[cancel_final] Reply markup unchanged, skipping", { telegramId });
//           } else {
//             throw error;
//           }
//         }
//       }
//     } catch (error) {
//       logger.error("[cancel_final] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.on(message("text"), async (ctx) => {
//     if (!ctx.from) {
//       logger.error("[text] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     const text = ctx.message.text.trim();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       logger.info(`[text] Session before processing for ${telegramId}:`, ctx.session);
//       const session = ctx.session;

//       switch (session.step) {
//         case "captcha": {
//           if (!session.captcha) {
//             logger.error("Captcha not found in session, resetting", { telegramId });
//             session.step = "welcome";
//             await sessionManager.saveSession(telegramId, session);
//             await ctx.reply("Session error. Please start over with /start");
//             return;
//           }

//           if (verifyCaptcha(text, session.captcha)) {
//             session.step = "captcha_confirmed";
//             await sessionManager.saveSession(telegramId, session);
//             logger.info(`[text] Session updated to captcha_confirmed for ${telegramId}:`, session);

//             await ctx.replyWithHTML(
//               `✅ <b>Correct!</b>\n\n` +
//                 `You've passed the captcha verification.\n\n` +
//                 `👉 Click <b>CONTINUE</b> to proceed to country selection.`,
//               Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_country")])
//             );
//           } else {
//             const newCaptcha = generateCaptcha();
//             session.captcha = newCaptcha;
//             await sessionManager.saveSession(telegramId, session);
//             logger.info(`[text] Session updated with new captcha for ${telegramId}:`, session);

//             await ctx.replyWithHTML(
//               `❌ <b>Incorrect Captcha</b>\n\n` +
//                 `🚫 Please try again:\n` +
//                 `👉 Type this number: <code>${newCaptcha}</code>`
//             );
//           }
//           break;
//         }

//         case "country": {
//           session.country = text;
//           session.step = "waiting_for_done";
//           await sessionManager.saveSession(telegramId, session);
//           logger.info(`[text] Session updated to waiting_for_done for ${telegramId}:`, session);

//           await ctx.replyWithHTML(
//             `<b>🌍 Step 2: Exco Trader Registration</b>\n\n` +
//               `📌 <b>Sign up here</b> 👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//               `✅ Click <b>Done</b> after completing your registration!\n\n` +
//               `📌 <b>Deposit Requirement:</b>\n` +
//               `⚡ To gain access, deposit at least <b>$100</b> into your Exco Trader account.\n\n` +
//               `💬 <i>Note: The Exco team may contact you to assist with setting up your account.</i>\n\n` +
//               `📌 <b>Submit Exco Trader Login ID</b>\n` +
//               `🔹 Check your email for your Login ID.\n` +
//               `🔹 Enter your Login ID below after clicking Done.`,
//             Markup.inlineKeyboard([Markup.button.callback("✅ Done", "done_exco")])
//           );
//           break;
//         }

//         case "exco_login": {
//           if (!isValidLoginID(text)) {
//             await ctx.replyWithHTML(
//               `❌ <b>Invalid Login ID</b>\n\n` +
//                 `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//                 `📌 <b>Example:</b> <code>123456565</code>`
//             );
//             return;
//           }
//           session.excoTraderLoginId = text;
//           session.step = "exco_confirmed";
//           await sessionManager.saveSession(telegramId, session);
//           logger.info(`[text] Session updated to exco_confirmed for ${telegramId}:`, session);

//           await ctx.replyWithHTML(
//             `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//               `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_deriv")])
//           );
//           break;
//         }

//         case "deriv": {
//           if (!isValidLoginID(text)) {
//             await ctx.replyWithHTML(
//               `❌ <b>Invalid Deriv Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>DR123456</code>`
//             );
//             return;
//           }
//           session.derivLoginId = text;
//           session.step = "final_confirmation";
//           await sessionManager.saveSession(telegramId, session);
//           logger.info(`[text] Session updated to final_confirmation for ${telegramId}:`, session);

//           const details = [`Exco Trader Login ID: ${session.excoTraderLoginId || "Not provided"}`]
//             .filter(Boolean)
//             .join("\n");

//           await ctx.replyWithHTML(
//             `<b>Final Confirmation</b>\n\n` +
//               `📌 <b>Your Details:</b>\n` +
//               `${details}\n\n` +
//               `⚠️ <b>Not correct?</b> Type <b>/start</b> to restart the process.\n\n` +
//               `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//             Markup.inlineKeyboard([
//               Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//               Markup.button.callback("❌ CANCEL", "cancel_final"),
//             ])
//           );
//           break;
//         }

//         case "login_id": {
//           if (!isValidLoginID(text)) {
//             await ctx.replyWithHTML(
//               `❌ <b>Invalid Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>EX123456</code>`
//             );
//             return;
//           }
//           session.excoTraderLoginId = text;
//           session.step = "exco_confirmed";
//           await sessionManager.saveSession(telegramId, session);
//           logger.info(`[text] Session updated to exco_confirmed for ${telegramId}:`, session);

//           await ctx.replyWithHTML(
//             `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//               `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_deriv")])
//           );
//           break;
//         }

//         default: {
//           logger.warn(`[text] Invalid session step (${session.step}), delaying reset`, { telegramId });
//           await new Promise((resolve) => setTimeout(resolve, 500));
//           session.step = "welcome";
//           await sessionManager.saveSession(telegramId, session);
//           await ctx.replyWithHTML(
//             `<b>⚠️ Error</b>\n\n` +
//               `🚫 Invalid step. Please start over with /start.`
//           );
//           break;
//         }
//       }
//     } catch (error) {
//       logger.error("[text] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process message. Please try again.");
//     }
//   });

//   bot.action("continue_to_country", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[continue_to_country] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       logger.info(`[continue_to_country] Session before check for ${telegramId}:`, ctx.session);
//       if (ctx.session.step !== "captcha_confirmed") {
//         logger.warn(`[continue_to_country] Invalid session step (${ctx.session.step}), delaying reset`, { telegramId });
//         await new Promise((resolve) => setTimeout(resolve, 500));
//         ctx.session = await sessionManager.getSession(telegramId);
//         if (ctx.session.step !== "captcha_confirmed") {
//           ctx.session = {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           await sessionManager.saveSession(telegramId, ctx.session);
//           await ctx.replyWithHTML(
//             `<b>⚠️ Error</b>\n\n` +
//               `🚫 Invalid step. Please start over with /start.`
//           );
//           return;
//         }
//       }

//       ctx.session.step = "country";
//       await sessionManager.saveSession(telegramId, ctx.session);
//       logger.info(`[continue_to_country] Session updated to country for ${telegramId}:`, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>🌍 Country Selection</b>\n\n` + `What is your country of residence?`,
//         Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]]).oneTime().resize()
//       );
//     } catch (error) {
//       logger.error("[continue_to_country] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("done_exco", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[done_exco] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       logger.info(`[done_exco] Session before check for ${telegramId}:`, ctx.session);
//       if (ctx.session.step !== "waiting_for_done") {
//         logger.warn(`[done_exco] Invalid session step (${ctx.session.step}), delaying reset`, { telegramId });
//         await new Promise((resolve) => setTimeout(resolve, 500));
//         ctx.session = await sessionManager.getSession(telegramId);
//         if (ctx.session.step !== "waiting_for_done") {
//           ctx.session = {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           await sessionManager.saveSession(telegramId, ctx.session);
//           await ctx.replyWithHTML(
//             `<b>⚠️ Error</b>\n\n` +
//               `🚫 Invalid step. Please start over with /start.`
//           );
//           return;
//         }
//       }

//       ctx.session.step = "exco_login";
//       await sessionManager.saveSession(telegramId, ctx.session);
//       logger.info(`[done_exco] Session updated to exco_login for ${telegramId}:`, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//           `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//           `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//           `📌 <b>Example:</b> <code>123456456</code>`
//       );
//     } catch (error) {
//       logger.error("[done_exco] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("continue_to_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[continue_to_deriv] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       logger.info(`[continue_to_deriv] Session before check for ${telegramId}:`, ctx.session);
//       if (ctx.session.step !== "exco_confirmed") {
//         logger.warn(`[continue_to_deriv] Invalid session step (${ctx.session.step}), delaying reset`, { telegramId });
//         await new Promise((resolve) => setTimeout(resolve, 500));
//         ctx.session = await sessionManager.getSession(telegramId);
//         if (ctx.session.step !== "exco_confirmed") {
//           ctx.session = {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           await sessionManager.saveSession(telegramId, ctx.session);
//           await ctx.replyWithHTML(
//             `<b>⚠️ Error</b>\n\n` +
//               `🚫 Invalid step. Please start over with /start.`
//           );
//           return;
//         }
//       }

//       ctx.session.step = "deriv";
//       await sessionManager.saveSession(telegramId, ctx.session);
//       logger.info(`[continue_to_deriv] Session updated to deriv for ${telegramId}:`, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>📌 Step 3: Deriv Registration (Optional)</b>\n\n` +
//           `We also give synthetic signals.\n` +
//           `Create a Deriv account to take Synthetic Trades 👉 <a href="${
//             process.env.DERIV_LINK || "https://fxht.short.gy/DeTGB"
//           }">Deriv Registration Link</a>\n\n` +
//           `✅ Click <b>Done</b> after registration, or <b>Skip</b> to proceed.`,
//         Markup.inlineKeyboard([
//           Markup.button.callback("✅ Done", "done_deriv"),
//           Markup.button.callback("⏭ Skip", "done_deriv"),
//         ])
//       );
//     } catch (error) {
//       logger.error("[continue_to_deriv] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("done_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[done_deriv] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       logger.info(`[done_deriv] Session before check for ${telegramId}:`, ctx.session);
//       if (ctx.session.step !== "deriv") {
//         logger.warn(`[done_deriv] Invalid session step (${ctx.session.step}), delaying reset`, { telegramId });
//         await new Promise((resolve) => setTimeout(resolve, 500));
//         ctx.session = await sessionManager.getSession(telegramId);
//         if (ctx.session.step !== "deriv") {
//           ctx.session = {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           await sessionManager.saveSession(telegramId, ctx.session);
//           await ctx.replyWithHTML(
//             `<b>⚠️ Error</b>\n\n` +
//               `🚫 Invalid step. Please start over with /start.`
//           );
//           return;
//         }
//       }

//       ctx.session.step = "final_confirmation";
//       await sessionManager.saveSession(telegramId, ctx.session);
//       logger.info(`[done_deriv] Session updated to final_confirmation for ${telegramId}:`, ctx.session);

//       const details = [`Exco Trader Login ID: ${ctx.session.excoTraderLoginId || "Not provided"}`]
//         .filter(Boolean)
//         .join("\n");

//       await ctx.replyWithHTML(
//         `<b>Final Confirmation</b>\n\n` +
//           `📌 <b>Your Details:</b>\n` +
//           `${details}\n\n` +
//           `⚠️ <b>Not correct?</b> Type <b>/start</b> to restart the process.\n\n` +
//           `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//         Markup.inlineKeyboard([
//           Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//           Markup.button.callback("❌ CANCEL", "cancel_final"),
//         ])
//       );
//     } catch (error) {
//       logger.error("[done_deriv] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("continue_to_login_id", async (ctx) => {
//     await ctx.answerCbQuery();
//     if (!ctx.from) {
//       logger.error("[continue_to_login_id] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       logger.info(`[continue_to_login_id] Session before check for ${telegramId}:`, ctx.session);
//       if (ctx.session.step !== "login_id") {
//         logger.warn(`[continue_to_login_id] Invalid session step (${ctx.session.step}), delaying reset`, { telegramId });
//         await new Promise((resolve) => setTimeout(resolve, 500));
//         ctx.session = await sessionManager.getSession(telegramId);
//         if (ctx.session.step !== "login_id") {
//           ctx.session = {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           };
//           await sessionManager.saveSession(telegramId, ctx.session);
//           await ctx.replyWithHTML(
//             `<b>⚠️ Error</b>\n\n` +
//               `🚫 Invalid step. Please start over with /start.`
//           );
//           return;
//         }
//       }

//       await ctx.replyWithHTML(
//         `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//           `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//           `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//           `📌 <b>Example:</b> <code>5677123456</code>`
//       );
//     } catch (error) {
//       logger.error("[continue_to_login_id] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   async function saveAndNotify(ctx: BotContext, session: SessionData) {
//     if (!ctx.from) {
//       logger.error("[saveAndNotify] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       if (!session.country) {
//         throw new Error("Country is missing in session data");
//       }
//       if (!session.excoTraderLoginId) {
//         throw new Error("Exco Trader Login ID is missing");
//       }

//       let user;
//       for (let attempt = 1; attempt <= 5; attempt++) {
//         try {
//           user = await ForexUserModel.findOneAndUpdate(
//             { telegramId, botType: session.botType },
//             {
//               telegramId,
//               username: ctx.from.username || "unknown",
//               fullName:
//                 `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() || "Unknown User",
//               botType: "forex",
//               country: session.country,
//               excoTraderLoginId: session.excoTraderLoginId,
//               status: "pending",
//             },
//             { upsert: true, new: true, maxTimeMS: 30000 }
//           );
//           logger.info(`[saveAndNotify] Saved user data for ${telegramId}:`, { user });
//           break;
//         } catch (error: any) {
//           logger.error(`[saveAndNotify] Attempt ${attempt} failed for user ${telegramId}:`, error);
//           if (attempt === 5) {
//             throw new Error(`Failed to save user data after 5 attempts: ${error.message || "Unknown error"}`);
//           }
//           await new Promise((resolve) => setTimeout(resolve, 1000));
//         }
//       }

//       await ctx.replyWithHTML(
//         `<b>✅ Submission Successful!</b>\n\n` +
//           `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
//           `📌 <i>You will receive a link to join the signal channel once approved.</i>\n\n`
//       );

//       if (user) {
//         await sendAdminAlertForex(user);
//       } else {
//         logger.error("[saveAndNotify] User document is undefined after save", { telegramId });
//       }
//     } catch (error) {
//       logger.error(`[saveAndNotify] Error for user ${telegramId}:`, error);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to submit your details. Please try again later or contact an admin.`
//       );
//     }
//   }

//   watchUserStatusChanges();

//   bot.catch((err, ctx) => {
//     console.error(`🚨 Forex Bot Error for update ${ctx.update.update_id}:`, err);
//     ctx.reply("❌ An error occurred. Please try again later.");
//   });
// }



























// deeepseeek

// import { Telegraf, Markup} from "telegraf"; 
// import { message } from "telegraf/filters";
// import { IFOREX_User, ForexUserModel } from "../models/forex_user.model";
// import { sendAdminAlertForex } from "../utils/services/notifier-forex";
// import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
// import { isValidLoginID } from "../utils/validate";
// import rateLimit from "telegraf-ratelimit";
// import { createLogger, transports, format } from "winston";
// import mongoose from "mongoose";
// import dotenv from "dotenv";
// import { MongoClient } from "mongodb";
// import { Context } from "telegraf";

// // Environment configuration
// dotenv.config({
//   path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
// });

// const GROUP_CHAT_ID = process.env.FOREX_GROUP_CHAT_ID;

// // Define BaseBotContext and BotContext
// export interface BaseBotContext extends Context {}

// export interface SessionData {
//   step: string;
//   botType: string;
//   telegramId?: string;
//   createdAt?: Date;
//   updatedAt?: Date;
//   captcha?: string;
//   country?: string;
//   excoTraderLoginId?: string;
//   derivLoginId?: string;
//   [key: string]: any;
// }

// export interface BotContext extends BaseBotContext {
//   session: SessionData;
//   saveSession?: () => Promise<void>;
// }

// // MongoDB connection function
// async function connectDB() {
//   const mongoUri = process.env.MONGODB_URI;
//   if (!mongoUri) {
//     throw new Error("MONGODB_URI is not defined in environment variables");
//   }

//   console.log("Connecting to MongoDB...");
//   try {
//     if (mongoose.connection.readyState !== 1) {
//       await mongoose.connect(mongoUri, {
//         retryWrites: true,
//         writeConcern: { w: "majority" },
//         connectTimeoutMS: 30000,
//         serverSelectionTimeoutMS: 20000,
//         socketTimeoutMS: 60000,
//         maxPoolSize: 10,
//       });
//       console.log("✅ MongoDB connected successfully");
//     }
//   } catch (err) {
//     console.error("❌ MongoDB connection error:", err);
//     throw err;
//   }
// }

// // Initialize MongoDB connection
// connectDB().catch((error) => {
//   console.error("[Startup] Failed to initialize MongoDB:", error);
// });

// // Custom session manager with locking and retry logic
// class SessionManager {
//   private collection: any;
//   private client: MongoClient;
//   private locks: Map<string, Promise<void>> = new Map();

//   constructor() {
//     const mongoUri = process.env.MONGODB_URI;
//     if (!mongoUri) throw new Error("MONGODB_URI not defined");
//     this.client = new MongoClient(mongoUri);
//     this.collection = null;
//   }

//   async init() {
//     await this.client.connect();
//     const db = this.client.db();
//     this.collection = db.collection("forex_sessions");
//     console.log("✅ Custom Forex session manager initialized");
//   }

//   async getSession(telegramId: string, retryCount = 3): Promise<SessionData> {
//     if (!this.collection) await this.init();
//     if (this.locks.has(telegramId)) {
//       await this.locks.get(telegramId);
//     }
//     for (let attempt = 1; attempt <= retryCount; attempt++) {
//       try {
//         const session = await this.collection.findOne({ telegramId }, { maxTimeMS: 15000 });
//         logger.info(`[getSession] Fetched session for ${telegramId}:`, session || { step: "welcome" });
//         return (
//           session || {
//             step: "welcome",
//             botType: "forex",
//             telegramId,
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           }
//         );
//       } catch (error) {
//         logger.error(`[getSession] Attempt ${attempt} failed for ${telegramId}:`, error);
//         if (attempt === retryCount) {
//           throw new Error(`Failed to fetch session for ${telegramId} after ${retryCount} attempts`);
//         }
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }
//     }
//     // Fallback
//     return {
//       step: "welcome",
//       botType: "forex",
//       telegramId,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     };
//   }

//   async saveSession(telegramId: string, sessionData: any, retryCount = 3): Promise<void> {
//     if (!this.collection) await this.init();
//     for (let attempt = 1; attempt <= retryCount; attempt++) {
//       try {
//         const savePromise = this.collection.updateOne(
//           { telegramId },
//           {
//             $set: {
//               ...sessionData,
//               telegramId,
//               updatedAt: new Date(),
//             },
//           },
//           { upsert: true, maxTimeMS: 15000 }
//         );
//         this.locks.set(telegramId, savePromise);
//         await savePromise;
//         this.locks.delete(telegramId);
//         logger.info(`[saveSession] Saved session for ${telegramId}`);
//         return;
//       } catch (error) {
//         logger.error(`[saveSession] Attempt ${attempt} failed for ${telegramId}:`, error);
//         this.locks.delete(telegramId);
//         if (attempt === retryCount) {
//           throw new Error(`Failed to save session for ${telegramId} after ${retryCount} attempts`);
//         }
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }
//     }
//   }
// }

// // Create session manager instance
// const sessionManager = new SessionManager();

// // Logger configuration
// const logger = createLogger({
//   level: "warn",
//   transports: [
//     new transports.Console({
//       format: format.combine(format.timestamp(), format.simple()),
//     }),
//   ],
// });

// // Rate limiters
// const actionLimiter = rateLimit({
//   window: 1500,
//   limit: 1,
//   onLimitExceeded: (ctx) =>
//     ctx.reply("🚫 Please wait a moment before trying again."),
// });

// const getLinkLimiter = rateLimit({
//   window: 60_000,
//   limit: 3,
//   onLimitExceeded: (ctx) =>
//     ctx.reply("🚫 Too many link requests! Try again later."),
// });

// export default function (bot: Telegraf<BotContext>) {
//   // Helper function to clear inline keyboards
//   async function clearInlineKeyboard(ctx: BotContext) {
//     try {
//       if (ctx.callbackQuery?.message && 'reply_markup' in ctx.callbackQuery.message && ctx.callbackQuery.message.reply_markup) {
//         await ctx.editMessageReplyMarkup(undefined);
//       }
//     } catch (error: any) {
//       if (error.message.includes('message is not modified')) {
//         logger.warn('Keyboard clear: Message not modified');
//       } else {
//         logger.error('Keyboard clear error', error);
//       }
//     }
//   }

//   // Session middleware
//   bot.use(async (ctx, next) => {
//     if (!ctx.from) {
//       logger.error("[Session Middleware] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     ctx.saveSession = async () => {};
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       ctx.session.telegramId = telegramId;
//       ctx.saveSession = async () => {
//         await sessionManager.saveSession(telegramId, ctx.session);
//       };
//       await next();
//       await ctx.saveSession();
//     } catch (error) {
//       logger.error("[Session Middleware] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Session initialization failed. Please try again.");
//     }
//   });

//   // Apply rate limiter for actions
//   bot.use(actionLimiter);

//   // Notify user on status change
//   async function notifyUserOnStatusChange(change: any) {
//     const user = change.fullDocument as IFOREX_User;
//     if (!user || !user.telegramId) return;

//     if (user.status === "approved") {
//       await bot.telegram.sendMessage(
//         user.telegramId,
//         `<b>🎉 Congratulations!</b> Your registration has been approved. ✅\n\n` +
//           `🔗 <b>Welcome to Afibie Fx Signals!</b> 🚀\n\n` +
//           `👉 Click the button below to receive your exclusive invite link.\n` +
//           `⚠️ <i>Note:</i> This link is time-sensitive and may expire soon.\n\n` +
//           `🔥 <i>Enjoy your journey and happy trading!</i> 📈`,
//         {
//           parse_mode: "HTML",
//           reply_markup: Markup.inlineKeyboard([
//             Markup.button.callback("🔗 Click to Get Link", "get_invite_link"),
//           ]).reply_markup,
//         }
//       );
//     } else if (user.status === "rejected") {
//       const reasonMessage =
//         user.rejectionReason === "no_affiliate_link"
//           ? "Your Exco Trader account was not registered using our affiliate link."
//           : user.rejectionReason === "insufficient_deposit"
//           ? "Your Exco Trader account does not have a minimum deposit of $100."
//           : "No specific reason provided.";

//       const nextSteps =
//         user.rejectionReason === "no_affiliate_link"
//           ? `To gain access to Afibie FX signals, register a new Exco Trader account using our affiliate link:\n\n` +
//             `👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//             `Once registered, click /start to begin again.`
//           : user.rejectionReason === "insufficient_deposit"
//           ? `To proceed, please deposit at least $100 into your Exco Trader account.\n\n` +
//             `Once deposited, click /start to begin again.`
//           : `Please contact an admin for assistance on next steps.`;

//       const rejectionMessage =
//         `<b>❌ Your registration was rejected.</b>\n\n` +
//         `👤 <b>Your Exco Trader Login ID:</b> <code>${user.excoTraderLoginId || "N/A"}</code>\n` +
//         `⚠️ <b>Reason:</b> ${reasonMessage}\n\n` +
//         `${nextSteps}\n\n`;

//       await bot.telegram.sendMessage(user.telegramId, rejectionMessage, {
//         parse_mode: "HTML",
//       });
//     }
//   }

//   // Watch for status changes in MongoDB
//   async function watchUserStatusChanges() {
//     try {
//       await connectDB();
//       const changeStream = ForexUserModel.watch([], {
//         fullDocument: "updateLookup",
//       });
//       changeStream.on("change", (change) => {
//         if (
//           change.operationType === "update" &&
//           change.updateDescription.updatedFields?.status
//         ) {
//           notifyUserOnStatusChange(change);
//         }
//       });
//     } catch (error) {
//       console.error("[watchUserStatusChanges] Error setting up change stream:", error);
//     }
//   }

//   bot.start(async (ctx) => {
//     if (!ctx.from) {
//       logger.error("[start] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = {
//         step: "welcome",
//         botType: "forex",
//         telegramId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       await sessionManager.saveSession(telegramId, ctx.session);
//       await ctx.replyWithHTML(
//         `<b>🛠 Welcome to <u>Afibie FX Signal</u>! 🚀</b>\n\n` +
//           `📈 <i>Home of <b>Exclusive FOREX signals</b></i>\n\n` +
//           `<b>To gain access, complete these steps 👇</b>\n\n` +
//           `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
//           `✅ <b>Step 2:</b> Register at Exco Trader, deposit <b>$100</b> or more, and provide your <b>Login ID</b> 💰\n` +
//           `✅ <b>Step 3:</b> Create Deriv account (Optional) 📊\n\n` +
//           `⏳ <b>Once all steps are completed, you will gain full access to Afibie FX Signals - where strategy meets profitability!</b> 💰📊\n\n` +
//           `<i>(If you have any issues during the process, message support 👉 @Francis_Nbtc)</i>\n\n` +
//           `👉 Click <b>CONTINUE</b> to start:`,
//         Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_captcha")])
//       );
//     } catch (error) {
//       logger.error("[start] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to initialize session. Please try again.");
//     }
//   });

//   bot.action("continue_to_captcha", async (ctx) => {
//     await ctx.answerCbQuery();
//     await clearInlineKeyboard(ctx); // Clear keyboard immediately
    
//     if (!ctx.from) {
//       logger.error("[continue_to_captcha] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
      
//       // Add strict step validation
//       if (ctx.session.step !== "welcome") {
//         logger.warn(`[continue_to_captcha] Invalid session step (${ctx.session.step})`, { telegramId });
//         await ctx.replyWithHTML(
//           `<b>⚠️ Error</b>\n\n` +
//             `🚫 Invalid step. Please start over with /start.`
//         );
//         return;
//       }

//       ctx.session.step = "captcha";
//       const captcha = generateCaptcha();
//       ctx.session.captcha = captcha;
//       await sessionManager.saveSession(telegramId, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
//           `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
//           `👉 <b>Type this number:</b> <code>${captcha}</code>`
//       );
//     } catch (error) {
//       logger.error("[continue_to_captcha] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("get_invite_link", getLinkLimiter, async (ctx) => {
//     await ctx.answerCbQuery();
//     await clearInlineKeyboard(ctx); // Clear keyboard immediately
    
//     if (!ctx.from) {
//       logger.error("[get_invite_link] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();

//     try {
//       await connectDB();
//       const user = await ForexUserModel.findOne({
//         telegramId,
//         botType: "forex",
//       });
//       if (!user || user.status !== "approved") {
//         logger.warn("Unauthorized get_invite_link attempt", { telegramId });
//         await ctx.replyWithHTML(
//           `⚠️ Your access link has expired or you are not yet approved.\n` +
//             `📩 Please contact an admin.`
//         );
//         return;
//       }

//       if (!GROUP_CHAT_ID) {
//         throw new Error("GROUP_CHAT_ID is not defined");
//       }

//       const inviteLink = await bot.telegram.createChatInviteLink(GROUP_CHAT_ID, {
//         expire_date: Math.floor(Date.now() / 1000) + 1800,
//         member_limit: 1,
//       });
//       await ctx.replyWithHTML(
//         `<b>🔗 Welcome to Afibie FX Signals! 🚀</b>\n\n` +
//           `Here's your exclusive access link: <a href="${inviteLink.invite_link}">${inviteLink.invite_link}</a>\n\n` +
//           `⚠️ <b>Note:</b> This link is time-sensitive and will expire in 30 minutes.\n` +
//           `Enjoy your journey & happy trading! 📈🔥`
//       );
//     } catch (error) {
//       logger.error("Error generating invite link", { telegramId, error });
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to generate invite link. Please try again later or contact an admin.`
//       );
//     }
//   });

//   bot.action("confirm_final", async (ctx) => {
//     await ctx.answerCbQuery();
//     await clearInlineKeyboard(ctx); // Clear keyboard immediately
    
//     if (!ctx.from) {
//       logger.error("[confirm_final] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
      
//       // Add strict step validation
//       if (ctx.session.step !== "final_confirmation") {
//         logger.warn(`[confirm_final] Invalid session step (${ctx.session.step})`, { telegramId });
//         await ctx.replyWithHTML(
//           `<b>⚠️ Error</b>\n\n` +
//             `🚫 Session expired or invalid. Please start over with /start.`
//         );
//         return;
//       }

//       await connectDB();
//       await saveAndNotify(ctx, ctx.session);
//       ctx.session = {
//         step: "completed",
//         botType: "forex",
//         telegramId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       await sessionManager.saveSession(telegramId, ctx.session);

//       // Remove keyboard safely
//       try {
//         if (ctx.callbackQuery?.message && "text" in ctx.callbackQuery.message && ctx.callbackQuery.message.reply_markup) {
//           await ctx.editMessageReplyMarkup(undefined);
//         }
//       } catch (error: any) {
//         if (!error.message.includes("message is not modified")) {
//           logger.warn("[confirm_final] Keyboard removal error", error);
//         }
//       }
//     } catch (error: any) {
//       logger.error(`[confirm_final] Error for user`, { telegramId, error });
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to submit details. Please try again.`
//       );
//     }
//   });

//   bot.action("cancel_final", async (ctx) => {
//     await ctx.answerCbQuery();
//     await clearInlineKeyboard(ctx); // Clear keyboard immediately
    
//     if (!ctx.from) {
//       logger.error("[cancel_final] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
      
//       // Add strict step validation
//       if (ctx.session.step !== "final_confirmation") {
//         logger.warn(`[cancel_final] Invalid session step (${ctx.session.step})`, { telegramId });
//         await ctx.replyWithHTML(
//           `<b>⚠️ Error</b>\n\n` +
//             `🚫 Invalid action. Please start over with /start.`
//         );
//         return;
//       }

//       // Proper session reset
//       ctx.session = {
//         step: "welcome",
//         botType: "forex",
//         telegramId,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       };
//       await sessionManager.saveSession(telegramId, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>🛠 Registration Cancelled</b>\n\n` +
//           `📌 You have cancelled the registration process.\n\n` +
//           `👉 Type <b>/start</b> to begin again.`
//       );
//     } catch (error) {
//       logger.error("[cancel_final] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.on(message("text"), async (ctx) => {
//     if (!ctx.from) {
//       logger.error("[text] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
//       const session = ctx.session;

//       switch (session.step) {
//         case "captcha": {
//           // Validate session step
//           if (session.step !== "captcha") {
//             logger.warn(`[text/captcha] Invalid session step (${session.step})`, { telegramId });
//             await ctx.reply("⚠️ Session expired. Please use /start to begin again");
//             return;
//           }
          
//           if (!session.captcha) {
//             logger.error("Captcha not found in session", { telegramId });
//             await ctx.reply("Session error. Please start over with /start");
//             return;
//           }

//           if (verifyCaptcha(ctx.message.text.trim(), session.captcha)) {
//             session.step = "captcha_confirmed";
//             await sessionManager.saveSession(telegramId, session);

//             await ctx.replyWithHTML(
//               `✅ <b>Correct!</b>\n\n` +
//                 `You've passed the captcha verification.\n\n` +
//                 `👉 Click <b>CONTINUE</b> to proceed to country selection.`,
//               Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_country")])
//             );
//           } else {
//             const newCaptcha = generateCaptcha();
//             session.captcha = newCaptcha;
//             await sessionManager.saveSession(telegramId, session);

//             await ctx.replyWithHTML(
//               `❌ <b>Incorrect Captcha</b>\n\n` +
//                 `🚫 Please try again:\n` +
//                 `👉 Type this number: <code>${newCaptcha}</code>`
//             );
//           }
//           break;
//         }

//         case "country": {
//           // Validate session step
//           if (session.step !== "country") {
//             logger.warn(`[text/country] Invalid session step (${session.step})`, { telegramId });
//             await ctx.reply("⚠️ Session expired. Please use /start to begin again");
//             return;
//           }
          
//           session.country = ctx.message.text.trim();
//           session.step = "waiting_for_done";
//           await sessionManager.saveSession(telegramId, session);

//           await ctx.replyWithHTML(
//             `<b>🌍 Step 2: Exco Trader Registration</b>\n\n` +
//               `📌 <b>Sign up here</b> 👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
//               `✅ Click <b>Done</b> after completing your registration!\n\n` +
//               `📌 <b>Deposit Requirement:</b>\n` +
//               `⚡ To gain access, deposit at least <b>$100</b> into your Exco Trader account.\n\n` +
//               `💬 <i>Note: The Exco team may contact you to assist with setting up your account.</i>\n\n` +
//               `📌 <b>Submit Exco Trader Login ID</b>\n` +
//               `🔹 Check your email for your Login ID.\n` +
//               `🔹 Enter your Login ID below after clicking Done.`,
//             Markup.inlineKeyboard([Markup.button.callback("✅ Done", "done_exco")])
//           );
//           break;
//         }

//         case "exco_login": {
//           // Validate session step
//           if (session.step !== "exco_login") {
//             logger.warn(`[text/exco_login] Invalid session step (${session.step})`, { telegramId });
//             await ctx.reply("⚠️ Session expired. Please use /start to begin again");
//             return;
//           }
          
//           const text = ctx.message.text.trim();
//           if (!isValidLoginID(text)) {
//             await ctx.replyWithHTML(
//               `❌ <b>Invalid Login ID</b>\n\n` +
//                 `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//                 `📌 <b>Example:</b> <code>123456565</code>`
//             );
//             return;
//           }
//           session.excoTraderLoginId = text;
//           session.step = "exco_confirmed";
//           await sessionManager.saveSession(telegramId, session);

//           await ctx.replyWithHTML(
//             `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//               `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_deriv")])
//           );
//           break;
//         }

//         case "deriv": {
//           // Validate session step
//           if (session.step !== "deriv") {
//             logger.warn(`[text/deriv] Invalid session step (${session.step})`, { telegramId });
//             await ctx.reply("⚠️ Session expired. Please use /start to begin again");
//             return;
//           }
          
//           const text = ctx.message.text.trim();
//           if (!isValidLoginID(text)) {
//             await ctx.replyWithHTML(
//               `❌ <b>Invalid Deriv Login ID</b>\n\n` +
//               `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//               `📌 <b>Example:</b> <code>DR123456</code>`
//             );
//             return;
//           }
//           session.derivLoginId = text;
//           session.step = "final_confirmation";
//           await sessionManager.saveSession(telegramId, session);

//           const details = [`Exco Trader Login ID: ${session.excoTraderLoginId || "Not provided"}`]
//             .filter(Boolean)
//             .join("\n");

//           await ctx.replyWithHTML(
//             `<b>Final Confirmation</b>\n\n` +
//               `📌 <b>Your Details:</b>\n` +
//               `${details}\n\n` +
//               `⚠️ <b>Not correct?</b> Type <b>/start</b> to restart the process.\n\n` +
//               `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//             Markup.inlineKeyboard([
//               Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//               Markup.button.callback("❌ CANCEL", "cancel_final"),
//             ])
//           );
//           break;
//         }

//         case "login_id": {
//           // Validate session step
//           if (session.step !== "login_id") {
//             logger.warn(`[text/login_id] Invalid session step (${session.step})`, { telegramId });
//             await ctx.reply("⚠️ Session expired. Please use /start to begin again");
//             return;
//           }
          
//           const text = ctx.message.text.trim();
//           if (!isValidLoginID(text)) {
//             await ctx.replyWithHTML(
//               `❌ <b>Invalid Login ID</b>\n\n` +
//                 `🚫 Please enter a valid alphanumeric Login ID (5-20 characters).\n` +
//                 `📌 <b>Example:</b> <code>EX123456</code>`
//             );
//             return;
//           }
//           session.excoTraderLoginId = text;
//           session.step = "exco_confirmed";
//           await sessionManager.saveSession(telegramId, session);

//           await ctx.replyWithHTML(
//             `<b>✅ You've provided your Exco Trader Login ID!</b>\n\n` +
//               `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
//             Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_deriv")])
//           );
//           break;
//         }
//       }
//     } catch (error) {
//       logger.error("[text] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process message. Please try again.");
//     }
//   });

//   bot.action("continue_to_country", async (ctx) => {
//     await ctx.answerCbQuery();
//     await clearInlineKeyboard(ctx); // Clear keyboard immediately
    
//     if (!ctx.from) {
//       logger.error("[continue_to_country] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
      
//       // Add strict step validation
//       if (ctx.session.step !== "captcha_confirmed") {
//         logger.warn(`[continue_to_country] Invalid session step (${ctx.session.step})`, { telegramId });
//         await ctx.replyWithHTML(
//           `<b>⚠️ Error</b>\n\n` +
//             `🚫 Invalid step. Please start over with /start.`
//         );
//         return;
//       }

//       ctx.session.step = "country";
//       await sessionManager.saveSession(telegramId, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>🌍 Country Selection</b>\n\n` + `What is your country of residence?`,
//         Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]]).oneTime().resize()
//       );
//     } catch (error) {
//       logger.error("[continue_to_country] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("done_exco", async (ctx) => {
//     await ctx.answerCbQuery();
//     await clearInlineKeyboard(ctx); // Clear keyboard immediately
    
//     if (!ctx.from) {
//       logger.error("[done_exco] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
      
//       // Add strict step validation
//       if (ctx.session.step !== "waiting_for_done") {
//         logger.warn(`[done_exco] Invalid session step (${ctx.session.step})`, { telegramId });
//         await ctx.replyWithHTML(
//           `<b>⚠️ Error</b>\n\n` +
//             `🚫 Invalid step. Please start over with /start.`
//         );
//         return;
//       }

//       ctx.session.step = "exco_login";
//       await sessionManager.saveSession(telegramId, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//           `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//           `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//           `📌 <b>Example:</b> <code>123456456</code>`
//       );
//     } catch (error) {
//       logger.error("[done_exco] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("continue_to_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     await clearInlineKeyboard(ctx); // Clear keyboard immediately
    
//     if (!ctx.from) {
//       logger.error("[continue_to_deriv] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
      
//       // Add strict step validation
//       if (ctx.session.step !== "exco_confirmed") {
//         logger.warn(`[continue_to_deriv] Invalid session step (${ctx.session.step})`, { telegramId });
//         await ctx.replyWithHTML(
//           `<b>⚠️ Error</b>\n\n` +
//             `🚫 Invalid step. Please start over with /start.`
//         );
//         return;
//       }

//       ctx.session.step = "deriv";
//       await sessionManager.saveSession(telegramId, ctx.session);

//       await ctx.replyWithHTML(
//         `<b>📌 Step 3: Deriv Registration (Optional)</b>\n\n` +
//           `We also give synthetic signals.\n` +
//           `Create a Deriv account to take Synthetic Trades 👉 <a href="${
//             process.env.DERIV_LINK || "https://fxht.short.gy/DeTGB"
//           }">Deriv Registration Link</a>\n\n` +
//           `✅ Click <b>Done</b> after registration, or <b>Skip</b> to proceed.`,
//         Markup.inlineKeyboard([
//           Markup.button.callback("✅ Done", "done_deriv"),
//           Markup.button.callback("⏭ Skip", "done_deriv"),
//         ])
//       );
//     } catch (error) {
//       logger.error("[continue_to_deriv] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("done_deriv", async (ctx) => {
//     await ctx.answerCbQuery();
//     await clearInlineKeyboard(ctx); // Clear keyboard immediately
    
//     if (!ctx.from) {
//       logger.error("[done_deriv] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
      
//       // Add strict step validation
//       if (ctx.session.step !== "deriv") {
//         logger.warn(`[done_deriv] Invalid session step (${ctx.session.step})`, { telegramId });
//         await ctx.replyWithHTML(
//           `<b>⚠️ Error</b>\n\n` +
//             `🚫 Invalid step. Please start over with /start.`
//         );
//         return;
//       }

//       ctx.session.step = "final_confirmation";
//       await sessionManager.saveSession(telegramId, ctx.session);

//       const details = [`Exco Trader Login ID: ${ctx.session.excoTraderLoginId || "Not provided"}`]
//         .filter(Boolean)
//         .join("\n");

//       await ctx.replyWithHTML(
//         `<b>Final Confirmation</b>\n\n` +
//           `📌 <b>Your Details:</b>\n` +
//           `${details}\n\n` +
//           `⚠️ <b>Not correct?</b> Type <b>/start</b> to restart the process.\n\n` +
//           `👉 Click <b>Confirm</b> to submit or <b>Cancel</b> to start over.`,
//         Markup.inlineKeyboard([
//           Markup.button.callback("🔵 CONFIRM", "confirm_final"),
//           Markup.button.callback("❌ CANCEL", "cancel_final"),
//         ])
//       );
//     } catch (error) {
//       logger.error("[done_deriv] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   bot.action("continue_to_login_id", async (ctx) => {
//     await ctx.answerCbQuery();
//     await clearInlineKeyboard(ctx); // Clear keyboard immediately
    
//     if (!ctx.from) {
//       logger.error("[continue_to_login_id] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       ctx.session = await sessionManager.getSession(telegramId);
      
//       // Add strict step validation
//       if (ctx.session.step !== "login_id") {
//         logger.warn(`[continue_to_login_id] Invalid session step (${ctx.session.step})`, { telegramId });
//         await ctx.replyWithHTML(
//           `<b>⚠️ Error</b>\n\n` +
//             `🚫 Invalid step. Please start over with /start.`
//         );
//         return;
//       }

//       await ctx.replyWithHTML(
//         `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
//           `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
//           `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
//           `📌 <b>Example:</b> <code>5677123456</code>`
//       );
//     } catch (error) {
//       logger.error("[continue_to_login_id] Error for user", { telegramId, error });
//       await ctx.reply("❌ Error: Failed to process action. Please try again.");
//     }
//   });

//   async function saveAndNotify(ctx: BotContext, session: SessionData) {
//     if (!ctx.from) {
//       logger.error("[saveAndNotify] No user ID found in ctx.from");
//       await ctx.reply("❌ Error: Unable to identify user. Please try again.");
//       return;
//     }
//     const telegramId = ctx.from.id.toString();
//     try {
//       if (!session.country) {
//         throw new Error("Country is missing in session data");
//       }
//       if (!session.excoTraderLoginId) {
//         throw new Error("Exco Trader Login ID is missing");
//       }

//       let user;
//       for (let attempt = 1; attempt <= 3; attempt++) {
//         try {
//           user = await ForexUserModel.findOneAndUpdate(
//             { telegramId, botType: session.botType },
//             {
//               telegramId,
//               username: ctx.from.username || "unknown",
//               fullName:
//                 `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim() || "Unknown User",
//               botType: "forex",
//               country: session.country,
//               excoTraderLoginId: session.excoTraderLoginId,
//               status: "pending",
//             },
//             { upsert: true, new: true, maxTimeMS: 20000 }
//           );
//           break;
//         } catch (error: any) { // Explicitly type as any
//           logger.error(`[saveAndNotify] Attempt ${attempt} failed for user ${telegramId}:`, error);
//           if (attempt === 3) {
//             throw new Error(`Failed to save user data after 3 attempts: ${error.message || "Unknown error"}`);
//           }
//           await new Promise((resolve) => setTimeout(resolve, 1000));
//         }
//       }

//       await ctx.replyWithHTML(
//         `<b>✅ Submission Successful!</b>\n\n` +
//           `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
//           `📌 <i>You will receive a link to join the signal channel once approved.</i>\n\n`
//       );

//       if (user) {
//         await sendAdminAlertForex(user);
//       } else {
//         logger.error("[saveAndNotify] User document is undefined after save", { telegramId });
//       }
//     } catch (error) {
//       logger.error(`[saveAndNotify] Error for user ${telegramId}:`, error);
//       await ctx.replyWithHTML(
//         `<b>⚠️ Error</b>\n\n` +
//           `🚫 Failed to submit your details. Please try again later or contact an admin.`
//       );
//     }
//   }

//   watchUserStatusChanges();

//   bot.catch((err, ctx) => {
//     console.error(`🚨 Forex Bot Error for update ${ctx.update.update_id}:`, err);
//     ctx.reply("❌ An error occurred. Please try again later.");
//   });
// }










import { Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import { createLogger, transports, format } from "winston";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import { Context } from "telegraf";
import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
import rateLimit from "telegraf-ratelimit";

// Environment configuration
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

// Define BaseBotContext and BotContext
export interface BaseBotContext extends Context {}

export interface SessionData {
  step: string;
  botType: string;
  telegramId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  captcha?: string;
  [key: string]: any;
}

export interface BotContext extends BaseBotContext {
  session: SessionData;
}

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
        connectTimeoutMS: 30000,
        serverSelectionTimeoutMS: 20000,
        socketTimeoutMS: 60000,
        maxPoolSize: 10,
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

// Custom session manager with stricter locking
class SessionManager {
  private collection: any;
  private client: MongoClient;
  private locks: Map<string, Promise<void>> = new Map();

  constructor() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI not defined");
    this.client = new MongoClient(mongoUri);
    this.collection = null;
  }

  async init() {
    await this.client.connect();
    const db = this.client.db();
    this.collection = db.collection("forex_sessions");
    console.log("✅ Custom Forex session manager initialized");
  }

  async getSession(telegramId: string, retryCount = 5): Promise<SessionData> {
    if (!this.collection) await this.init();
    if (this.locks.has(telegramId)) {
      await this.locks.get(telegramId); // Wait for any pending operations
    }
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const session = await this.collection.findOne({ telegramId }, { maxTimeMS: 20000 });
        logger.info(`[getSession] Fetched session for ${telegramId}:`, session || { step: "welcome" });
        return (
          session || {
            step: "welcome",
            botType: "forex",
            telegramId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        );
      } catch (error) {
        logger.error(`[getSession] Attempt ${attempt} failed for ${telegramId}:`, error);
        if (attempt === retryCount) {
          logger.warn(`[getSession] Resetting session for ${telegramId} due to repeated failures`);
          return {
            step: "welcome",
            botType: "forex",
            telegramId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    return {
      step: "welcome",
      botType: "forex",
      telegramId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async saveSession(telegramId: string, sessionData: any, retryCount = 5): Promise<void> {
    if (!this.collection) await this.init();
    const lockPromise = (async () => {
      try {
        const result = await this.collection.updateOne(
          { telegramId },
          {
            $set: {
              ...sessionData,
              telegramId,
              updatedAt: new Date(),
            },
          },
          { upsert: true, maxTimeMS: 20000 }
        );
        logger.info(`[saveSession] Saved session for ${telegramId}:`, sessionData);
      } catch (error) {
        logger.error(`[saveSession] Attempt failed for ${telegramId}:`, error);
        throw error;
      }
    })();
    this.locks.set(telegramId, lockPromise);
    try {
      await lockPromise;
    } finally {
      this.locks.delete(telegramId);
    }
  }
}

// Create session manager instance
const sessionManager = new SessionManager();

// Logger configuration
const logger = createLogger({
  level: "info",
  transports: [
    new transports.Console({
      format: format.combine(format.timestamp(), format.simple()),
    }),
  ],
});

// Rate limiter
const actionLimiter = rateLimit({
  window: 5000, // Increased to 5 seconds
  limit: 1,
  onLimitExceeded: (ctx) =>
    ctx.reply("🚫 Please wait a moment before trying again."),
});

export default function (bot: Telegraf<BotContext>) {
  // Session middleware
  bot.use(async (ctx, next) => {
    if (!ctx.from) {
      logger.error("[Session Middleware] No user ID found in ctx.from");
      await ctx.reply("❌ Error: Unable to identify user. Please try again.");
      return;
    }
    const telegramId = ctx.from.id.toString();
    try {
      ctx.session = await sessionManager.getSession(telegramId);
      ctx.session.telegramId = telegramId;
      logger.info(`[Middleware] Initialized session for ${telegramId}:`, ctx.session);
      await next();
    } catch (error) {
      logger.error("[Session Middleware] Error for user", { telegramId, error });
      await ctx.reply("❌ Error: Session initialization failed. Please try again.");
    }
  });

  // Apply rate limiter for actions
  bot.use(actionLimiter);

  bot.start(async (ctx) => {
    if (!ctx.from) {
      logger.error("[start] No user ID found in ctx.from");
      await ctx.reply("❌ Error: Unable to identify user. Please try again.");
      return;
    }
    const telegramId = ctx.from.id.toString();
    try {
      // Always reset session to a clean state
      ctx.session = {
        step: "welcome",
        botType: "forex",
        telegramId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await sessionManager.saveSession(telegramId, ctx.session);
      logger.info(`[start] Session reset to welcome for ${telegramId}:`, ctx.session);

      await ctx.replyWithHTML(
        `<b>🛠 Welcome to <u>Afibie FX Signal</u>! 🚀</b>\n\n` +
          `📈 <i>Home of <b>Exclusive FOREX signals</b></i>\n\n` +
          `<b>To gain access, complete these steps 👇</b>\n\n` +
          `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
          `✅ <b>Step 2:</b> Register at Exco Trader, deposit <b>$100</b> or more, and provide your <b>Login ID</b> 💰\n` +
          `✅ <b>Step 3:</b> Create Deriv account (Optional) 📊\n\n` +
          `⏳ <b>Once all steps are completed, you will gain full access to Afibie FX Signals - where strategy meets profitability!</b> 💰📊\n\n` +
          `<i>(If you have any issues during the process, message support 👉 @Francis_Nbtc)</i>\n\n` +
          `👉 Click <b>CONTINUE</b> to start:`,
        Markup.inlineKeyboard([Markup.button.callback("🔵 CONTINUE", "continue_to_captcha")])
      );
    } catch (error) {
      logger.error("[start] Error for user", { telegramId, error });
      await ctx.reply("❌ Error: Failed to initialize session. Please try again.");
    }
  });

  bot.action("continue_to_captcha", async (ctx) => {
    await ctx.answerCbQuery();
    if (!ctx.from) {
      logger.error("[continue_to_captcha] No user ID found in ctx.from");
      await ctx.reply("❌ Error: Unable to identify user. Please try again.");
      return;
    }
    const telegramId = ctx.from.id.toString();
    try {
      ctx.session = await sessionManager.getSession(telegramId);
      logger.info(`[continue_to_captcha] Session before check for ${telegramId}:`, ctx.session);
      if (ctx.session.step !== "welcome") {
        logger.warn(`[continue_to_captcha] Invalid session step (${ctx.session.step}), delaying reset`, { telegramId });
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay to allow pending saves
        ctx.session = await sessionManager.getSession(telegramId); // Re-fetch
        if (ctx.session.step !== "welcome") {
          ctx.session = {
            step: "welcome",
            botType: "forex",
            telegramId,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await sessionManager.saveSession(telegramId, ctx.session);
          logger.info(`[continue_to_captcha] Session reset to welcome for ${telegramId}:`, ctx.session);
          await ctx.replyWithHTML(
            `<b>⚠️ Error</b>\n\n` +
              `🚫 Invalid step. Please start over with /start.`
          );
          return;
        }
      }

      ctx.session.step = "captcha";
      ctx.session.captcha = generateCaptcha();
      delete ctx.session.country; // Clear stale data
      delete ctx.session.excoTraderLoginId; // Clear stale data
      await sessionManager.saveSession(telegramId, ctx.session);
      logger.info(`[continue_to_captcha] Session updated for ${telegramId}:`, ctx.session);

      await ctx.replyWithHTML(
        `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
          `To prevent bots, please <i>solve this Captcha</i>:\n\n` +
          `👉 <b>Type this number:</b> <code>${ctx.session.captcha}</code>`
      );
    } catch (error) {
      logger.error("[continue_to_captcha] Error for user", { telegramId, error });
      await ctx.reply("❌ Error: Failed to process action. Please try again.");
    }
  });

  bot.on(message("text"), async (ctx) => {
    if (!ctx.from) {
      logger.error("[text] No user ID found in ctx.from");
      await ctx.reply("❌ Error: Unable to identify user. Please try again.");
      return;
    }
    const telegramId = ctx.from.id.toString();
    const text = ctx.message.text.trim();
    try {
      ctx.session = await sessionManager.getSession(telegramId);
      logger.info(`[text] Session before processing for ${telegramId}:`, ctx.session);
      const session = ctx.session;

      if (session.step === "captcha") {
        if (!session.captcha) {
          logger.error("Captcha not found in session, resetting", { telegramId });
          session.step = "welcome";
          await sessionManager.saveSession(telegramId, session);
          await ctx.reply("Session error. Please start over with /start");
          return;
        }

        if (verifyCaptcha(text, session.captcha)) {
          session.step = "captcha_confirmed";
          await sessionManager.saveSession(telegramId, session);
          logger.info(`[text] Session updated to captcha_confirmed for ${telegramId}:`, session);

          await ctx.replyWithHTML(
            `✅ <b>Correct!</b>\n\n` +
              `You've passed the captcha verification.\n\n` +
              `👉 Registration complete for this test. Type /start to restart.`
          );
        } else {
          const newCaptcha = generateCaptcha();
          session.captcha = newCaptcha;
          await sessionManager.saveSession(telegramId, session);
          logger.info(`[text] Session updated with new captcha for ${telegramId}:`, session);

          await ctx.replyWithHTML(
            `❌ <b>Incorrect Captcha</b>\n\n` +
              `🚫 Please try again:\n` +
              `👉 Type this number: <code>${newCaptcha}</code>`
          );
        }
      } else {
        logger.warn(`[text] Invalid session step (${session.step}), delaying reset`, { telegramId });
        await new Promise((resolve) => setTimeout(resolve, 500));
        session.step = "welcome";
        await sessionManager.saveSession(telegramId, session);
        await ctx.replyWithHTML(
          `<b>⚠️ Error</b>\n\n` +
            `🚫 Invalid step. Please start over with /start.`
        );
      }
    } catch (error) {
      logger.error("[text] Error for user", { telegramId, error });
      await ctx.reply("❌ Error: Failed to process message. Please try again.");
    }
  });

  bot.catch((err, ctx) => {
    console.error(`🚨 Forex Bot Error for update ${ctx.update.update_id}:`, err);
    ctx.reply("❌ An error occurred. Please try again later.");
  });
}