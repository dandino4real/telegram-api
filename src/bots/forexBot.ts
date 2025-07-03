
import { Context, Telegraf, Markup } from "telegraf";
import { message } from "telegraf/filters";
import { IFOREX_User, ForexUserModel } from "../models/forex_user.model";
import { sendAdminAlertForex } from "../utils/services/notifier-forex";
import { generateCaptcha, verifyCaptcha } from "../utils/captcha";
import { isValidLoginID } from "../utils/validate";
import rateLimit from "telegraf-ratelimit";
import { createLogger, transports, format } from "winston";
import { session } from 'telegraf-session-mongodb';
import mongoose from "mongoose";
import dotenv from 'dotenv';
dotenv.config();

// Add this validation before creating the bot
if (!process.env.BOT_TOKEN_FOREX) {
  throw new Error("BOT_TOKEN_CRYPTO is not defined");
}

const logger = createLogger({
  level: "warn",
  transports: [
    new transports.Console({
      format: format.combine(format.timestamp(), format.simple()),
    }),
  ],
});

const getLinkLimiter = rateLimit({
  window: 60_000,
  limit: 3,
  onLimitExceeded: (ctx) =>
    ctx.reply("🚫 Too many link requests! Try again later."),
});


// Define session context
export interface SessionContext extends Context {
  session: {
    step?: string;
    captcha?: string;
    country?: string;
    excoTraderLoginId?: string;
    derivLoginId?: string;
    botType?: string;
    retryCount?: number;
  };
}


// const bot = new Telegraf(process.env.BOT_TOKEN_FOREX!);
const bot = new Telegraf<SessionContext>(process.env.BOT_TOKEN_FOREX!);


if (mongoose.connection.readyState === 1) {
  const db = mongoose.connection.db;
  if (db) {
    bot.use(session(db, { 
      sessionName: 'session', 
      collectionName: 'forex_sessions'  // forex_sessions for forex bot
    }));
    console.log("✅ MongoDB session middleware initialized");
  } else {
    console.error("❌ Mongoose connected but db is undefined. Session middleware skipped");
  }
} else {
  console.error("❌ Mongoose not connected. Session middleware skipped");
}

// Add session initialization middleware
bot.use(async (ctx, next) => {
  ctx.session ??= {};
  return next();
});

const userSession: Record<string, any> = {};

// Notify user on status change
async function notifyUserOnStatusChange(change: any) {
  const user = change.fullDocument as IFOREX_User;
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
    const session = userSession[user.telegramId] || {
      botType: "forex",
      retryCount: 0,
    };
    if (session.retryCount >= 1) {
      await bot.telegram.sendMessage(
        user.telegramId,
        `<b>❌ Sorry, your registration was rejected.</b>\n\n` +
          `🚫 You have exceeded the maximum retry attempts.\n` +
          `📩 Please contact an admin for assistance.`,
        { parse_mode: "HTML" }
      );
      return;
    }
    session.step = "login_id";
    session.retryCount = (session.retryCount || 0) + 1;
    userSession[user.telegramId] = session;

    let rejectionMessage =
      `<b>❌ Sorry, your registration was rejected due to an invalid Exco Trader Login ID.</b>\n\n` +
      `📌 <b>This is your last trial.</b>\n` +
      `📌 <b>Sign up here</b> 👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n` +
      `⚡ Make a <b>$100 deposit</b>.\n` +
      `🔹 Click <b>CONTINUE</b> to enter your Login ID.`;

    await bot.telegram.sendMessage(user.telegramId, rejectionMessage, {
      parse_mode: "HTML",
      reply_markup: Markup.inlineKeyboard([
        Markup.button.callback("🔵 CONTINUE", "continue_to_login_id"),
      ]).reply_markup,
    });
  }
}

// Watch for status changes in MongoDB
async function watchUserStatusChanges() {
  const changeStream = ForexUserModel.watch([], {
    fullDocument: "updateLookup",
  });
  changeStream.on("change", (change) => {
    if (
      change.operationType === "update" &&
      change.updateDescription.updatedFields?.status
    ) {
      notifyUserOnStatusChange(change);
    }
  });
}

bot.start(async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;

  userSession[userId] = { step: "welcome", botType: "forex", retryCount: 0 };

  await ctx.replyWithHTML(
    `<b>🛠 Welcome to <u>Afibie FX Signal</u>! 🚀</b>\n\n` +
      `📈 Afibie FX is an exclusive trading community where members gain access to high-quality trading signals, market insights, and expert strategies to maximize their profits.\n\n` +
      `<b>To gain access to Afibie FX Signals, please complete these steps:</b>\n\n` +
      `✅ <b>Step 1:</b> Solve the Captcha 🔢\n` +
      `✅ <b>Step 2:</b> Register at Exco Trader, deposit $100 or more, and provide your Login ID 💰\n` +
      `✅ <b>Step 3:</b> Create Deriv account (Optional) 📊\n\n` +
      `⏳ <b>Once all steps are completed, you will gain full access to Afibie FX Signals – where strategy meets profitability!</b> 💰📊\n\n` +
      `👉 Click <b>CONTINUE</b> to start:`,
    Markup.inlineKeyboard([
      Markup.button.callback("🔵 CONTINUE", "continue_to_captcha"),
    ])
  );
});

bot.action("continue_to_captcha", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id.toString();
  const session = userSession[userId];
  if (!session || session.step !== "welcome") return;

  session.step = "captcha";
  const captcha = generateCaptcha();
  session.captcha = captcha;

  await ctx.replyWithHTML(
    `<b>🔐 Step 1: Captcha Verification</b>\n\n` +
      `To prevent bots, please solve this Captcha to continue:\n\n` +
      `👉 <b>Type this number:</b> <code>${captcha}</code>`
  );
});

bot.command("getlink", getLinkLimiter, async (ctx) => {
  const telegramId = ctx.from?.id?.toString();
  if (!telegramId) return;

  const user = await ForexUserModel.findOne({ telegramId, botType: "forex" });
  if (!user || user.status !== "approved") {
    logger.warn("Unauthorized /getlink attempt", { telegramId });
    await ctx.replyWithHTML(
      `⚠️ Your access link has expired or you are not yet approved.\n` +
        `📩 Please contact an admin.`
    );
    return;
  }

  try {
    const inviteLink = await bot.telegram.createChatInviteLink(
      process.env.GROUP_CHAT_ID!,
      {
        expire_date: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
        member_limit: 1,
      }
    );
    await ctx.replyWithHTML(
      `<b>🔗 Welcome to Afibie FX Signals! 🚀</b>\n\n` +
        `Here’s your exclusive access link: <a href="${inviteLink.invite_link}">${inviteLink.invite_link}</a>\n\n` +
        `⚠️ <b>Note:</b> This link is time-sensitive and will expire in 30 minutes.\n` +
        `Enjoy your journey & happy trading! 📈🔥`
    );
  } catch (error) {
    logger.error("Error generating invite link", { telegramId, error });
    await ctx.replyWithHTML(
      `<b>⚠️ Error</b>\n\n` +
        `🚫 Failed to generate invite link. Please try again later or contact an admin.`
    );
  }
});

bot.on(message("text"), async (ctx) => {
  const userId = ctx.from?.id.toString();
  if (!userId) return;
  const session = userSession[userId];
  const text = ctx.message.text.trim();
  if (!session) return;

  switch (session.step) {
    case "captcha": {
      if (verifyCaptcha(text, session.captcha)) {
        session.step = "captcha_confirmed";
        await ctx.replyWithHTML(
          `✅ <b>Correct!</b>\n\n` +
            `You’ve passed the captcha verification.\n\n` +
            `👉 Click <b>CONTINUE</b> to proceed to country selection.`,
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
            `👉 Type this number: <code>${newCaptcha}</code>`
        );
      }
      break;
    }

    case "country": {
      session.country = text;
      session.step = "waiting_for_done";
      await ctx.replyWithHTML(
        `<b>🌍 Step 2: Exco Trader Registration</b>\n\n` +
          `📌 <b>Sign up here</b> 👉 <a href="${process.env.EXCO_LINK}">Exco Trader Registration Link</a>\n\n` +
          `✅ Click <b>Done</b> after completing your registration!\n\n` +
          `📌 <b>Deposit Requirement:</b>\n` +
          `⚡ To gain access, deposit at least <b>$100</b> into your Exco Trader account.\n` +
          `💬 <i>Note: The Exco team may contact you to assist with setting up your account.</i>\n\n` +
          `📌 <b>Submit Exco Trader Login ID</b>\n` +
          `🔹 Check your email for your Login ID.\n` +
          `🔹 Enter your Login ID below after clicking Done.`,
        Markup.inlineKeyboard([Markup.button.callback("✅ Done", "done_exco")])
      );
      break;
    }

    case "exco_login": {
      if (!isValidLoginID(text)) {
        await ctx.replyWithHTML(
          `❌ <b>Invalid Login ID</b>\n\n` +
            `🚫 Please enter a valid alphanumeric Login ID (5–20 characters).\n` +
            `📌 <b>Example:</b> <code>EX123456</code>`
        );
        return;
      }
      session.excoTraderLoginId = text;
      session.step = "exco_confirmed";
      await ctx.replyWithHTML(
        `<b>✅ Exco Trader Login ID Accepted!</b>\n\n` +
          `👉 Click <b>CONTINUE</b> to proceed to Deriv registration (optional).`,
        Markup.inlineKeyboard([
          Markup.button.callback("🔵 CONTINUE", "continue_to_deriv"),
        ])
      );
      break;
    }

    case "deriv": {
      if (!isValidLoginID(text)) {
        await ctx.replyWithHTML(
          `❌ <b>Invalid Deriv Login ID</b>\n\n` +
            `🚫 Please enter a valid alphanumeric Login ID (5–20 characters).\n` +
            `📌 <b>Example:</b> <code>DR123456</code>`
        );
        return;
      }
      session.derivLoginId = text;
      session.step = "final_confirmation";
      const details = [
        `Exco Trader Login ID: ${session.excoTraderLoginId || "Not provided"}`,
        session.derivLoginId ? `Deriv Login ID: ${session.derivLoginId}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      await ctx.replyWithHTML(
        `<b>Final Confirmation</b>\n\n` +
          `🎉 All information has been accepted and stored successfully!\n\n` +
          `📌 <b>Your Details:</b>\n` +
          `${details}\n\n` +
          `👉 Click <b>CONFIRM</b> to submit your details for review.`,
        Markup.inlineKeyboard([
          Markup.button.callback("🔵 CONFIRM", "confirm_final"),
        ])
      );
      break;
    }
  }
});

bot.action("continue_to_country", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id.toString();
  const session = userSession[userId];
  if (!session || session.step !== "captcha_confirmed") return;

  session.step = "country";
  await ctx.replyWithHTML(
    `<b>🌍 Country Selection</b>\n\n` +
      `What is your country of residence?`,
    Markup.keyboard([["USA", "Canada", "UK"], ["Rest of the world"]])
      .oneTime()
      .resize()
  );
});

bot.action("done_exco", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id.toString();
  const session = userSession[userId];
  if (!session || session.step !== "waiting_for_done") return;

  session.step = "exco_login";
  await ctx.replyWithHTML(
    `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
      `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
      `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
      `📌 <b>Example:</b> <code>EX123456</code>`
  );
});

bot.action("continue_to_deriv", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id.toString();
  const session = userSession[userId];
  if (!session || session.step !== "exco_confirmed") return;

  session.step = "deriv";
  await ctx.replyWithHTML(
    `<b>📌 Step 3: Deriv Registration (Optional)</b>\n\n` +
      `We also give synthetic signals.\n` +
      `Create a Deriv account to take Synthetic Trades 👉 <a href="${
        process.env.DERIV_LINK || "https://fxht.short.gy/DeTGB"
      }">Deriv Registration Link</a>\n\n` +
      `✅ Click <b>Done</b> after registration to submit your Deriv Login ID, or <b>Skip</b> to proceed.`,
    Markup.inlineKeyboard([
      Markup.button.callback("✅ Done", "done_deriv"),
      Markup.button.callback("⏭ Skip", "skip_deriv"),
    ])
  );
});

bot.action("done_deriv", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id.toString();
  const session = userSession[userId];
  if (!session || session.step !== "deriv") return;

  await ctx.replyWithHTML(
    `<b>🔹 Submit Your Deriv Login ID</b>\n\n` +
      `Please enter your <b>Deriv Login ID</b> below.\n\n` +
      `💡 <i>You can find it in the welcome email from Deriv.</i>\n` +
      `📌 <b>Example:</b> <code>DR123456</code>`
  );
});

bot.action("skip_deriv", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id.toString();
  const session = userSession[userId];
  if (!session || session.step !== "deriv") return;

  session.step = "final_confirmation";
  const details = [
    `Exco Trader Login ID: ${session.excoTraderLoginId || "Not provided"}`,
    session.derivLoginId ? `Deriv Login ID: ${session.derivLoginId}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await ctx.replyWithHTML(
    `<b>Final Confirmation</b>\n\n` +
      `🎉 All information has been accepted and stored successfully!\n\n` +
      `📌 <b>Your Details:</b>\n` +
      `${details}\n\n` +
      `👉 Click <b>CONFIRM</b> to submit your details for review.`,
    Markup.inlineKeyboard([
      Markup.button.callback("🔵 CONFIRM", "confirm_final"),
    ])
  );
});

bot.action("confirm_final", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id.toString();
  const session = userSession[userId];
  if (!session || session.step !== "final_confirmation") return;

  session.step = "final";
  await saveAndNotify(ctx, session);
});

bot.action("continue_to_login_id", async (ctx) => {
  await ctx.answerCbQuery();
  const userId = ctx.from?.id.toString();
  const session = userSession[userId];
  if (!session || session.step !== "login_id") return;

  await ctx.replyWithHTML(
    `<b>🔹 Submit Your Exco Trader Login ID</b>\n\n` +
      `Please enter your <b>Exco Trader Login ID</b> below.\n\n` +
      `💡 <i>You can find it in the welcome email from Exco Trader.</i>\n` +
      `📌 <b>Example:</b> <code>EX123456</code>`
  );
});

async function saveAndNotify(ctx: any, session: any) {
  const telegramId = ctx.from.id.toString();
  const user = await ForexUserModel.findOneAndUpdate(
    { telegramId, botType: session.botType },
    {
      telegramId,
      username: ctx.from.username,
      fullName: `${ctx.from.first_name || ""} ${
        ctx.from.last_name || ""
      }`.trim(),
      botType: "forex",
      country: session.country,
      excoTraderLoginId: session.excoTraderLoginId,
      derivLoginId: session.derivLoginId,
      status: "pending",
    },
    { upsert: true, new: true }
  );

  await ctx.replyWithHTML(
   `<b>✅ Submission Successful!</b>\n\n` +
      `⏳ <b>Please wait</b> while your details are being reviewed (Allow 24 hours).\n\n` +
      `📌 <i>you will receive a link to join the signal channel once approved.</i>\n\n`
  );

  await sendAdminAlertForex(user);
}

// Start watching for status changes
watchUserStatusChanges();


export default bot;
