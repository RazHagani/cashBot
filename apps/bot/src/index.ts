import { Bot } from "grammy";
import { env } from "./lib/env.js";
import { claimTelegramCodeAndLinkChat, getUserIdByChatId } from "./lib/linking.js";
import { parseFinanceMessage } from "./lib/openai.js";
import { supabaseAdmin } from "./lib/supabase.js";

const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

bot.command("start", async (ctx) => {
  await ctx.reply(
    "היי! אני cashBot.\n" +
      "כדי להתחיל, התחבר לדשבורד והפק קוד סנכרון (Telegram Sync Code), ואז שלח לי אותו כאן."
  );
});

bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text.trim();

  // 1) Check linkage
  const userId = await getUserIdByChatId(chatId);

  if (!userId) {
    // Treat message as possible Sync Code
    if (text.length < 6 || text.length > 32) {
      await ctx.reply("לא נראה לי שזה קוד סנכרון. צור קוד מהדשבורד ושלח לי אותו כאן.");
      return;
    }

    const res = await claimTelegramCodeAndLinkChat({ code: text, telegram_chat_id: chatId });
    if (!res.ok) {
      await ctx.reply(res.message);
      return;
    }

    await ctx.reply("מצוין! קישרתי את הצ׳אט לחשבון שלך. עכשיו אפשר לשלוח הודעות כמו: \"Lunch 50\".");
    return;
  }

  // 2) Parse transaction
  const parsed = await parseFinanceMessage(text);
  if (!parsed.ok) {
    await ctx.reply(parsed.question);
    return;
  }

  const { transaction } = parsed;

  // 3) Insert to DB
  const { error } = await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    amount: transaction.amount,
    description: transaction.description,
    category: transaction.category,
    type: transaction.type
  });

  if (error) {
    await ctx.reply("שמירה נכשלה. נסה שוב בעוד רגע.");
    return;
  }

  await ctx.reply(
    `נשמר: ${transaction.type} ${transaction.amount} (${transaction.category}) – ${transaction.description}`
  );
});

bot.catch((err) => {
  console.error("Bot error", err);
});

async function main() {
  // Railway/always-on deploys should use long polling.
  // If a webhook was set in the past, polling can fail—so we delete it defensively.
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
  } catch (e) {
    console.warn("deleteWebhook failed (continuing)", e);
  }

  bot.start();
}

main();

