import { Bot, GrammyError } from "grammy";
import http from "node:http";
import * as prom from "prom-client";
import { env } from "./lib/env.js";
import { claimTelegramCodeAndLinkChat, getUserIdByChatId } from "./lib/linking.js";
import { parseFinanceMessage } from "./lib/openai.js";
import { supabaseAdmin } from "./lib/supabase.js";

const bot = new Bot(env.TELEGRAM_BOT_TOKEN);
console.log(`[boot] OPENAI_API_KEY configured: ${env.OPENAI_API_KEY ? "yes" : "no"}`);

// -----------------------------
// Metrics (Prometheus)
// -----------------------------
const METRICS_TOKEN = process.env.METRICS_TOKEN?.trim();
const registry = new prom.Registry();
prom.collectDefaultMetrics({ register: registry });

const messagesTotal = new prom.Counter({
  name: "cashbot_telegram_messages_total",
  help: "Total Telegram text messages received",
  registers: [registry]
});

const linkAttemptsTotal = new prom.Counter({
  name: "cashbot_link_attempts_total",
  help: "Total Telegram sync code link attempts",
  registers: [registry]
});

const transactionsInsertTotal = new prom.Counter({
  name: "cashbot_transactions_insert_total",
  help: "Total transactions inserted into DB",
  registers: [registry]
});

const transactionsInsertErrorsTotal = new prom.Counter({
  name: "cashbot_transactions_insert_errors_total",
  help: "Total transaction insert errors",
  registers: [registry]
});

const parseDurationSeconds = new prom.Histogram({
  name: "cashbot_parse_duration_seconds",
  help: "Time spent parsing messages",
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry]
});

const dbInsertDurationSeconds = new prom.Histogram({
  name: "cashbot_db_insert_duration_seconds",
  help: "Time spent inserting transactions to Supabase",
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry]
});

function startMetricsServer() {
  const port = Number(process.env.PORT ?? 3000);

  const server = http.createServer(async (req, res) => {
    try {
      const url = (req.url ?? "/").split("?")[0];

      if (url === "/healthz") {
        res.statusCode = 200;
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end("ok");
        return;
      }

      if (url === "/metrics") {
        // Optional protection: if METRICS_TOKEN is set, require Bearer token.
        if (METRICS_TOKEN) {
          const auth = String(req.headers["authorization"] ?? "");
          const expected = `Bearer ${METRICS_TOKEN}`;
          if (auth !== expected) {
            res.statusCode = 401;
            res.setHeader("content-type", "text/plain; charset=utf-8");
            res.end("unauthorized");
            return;
          }
        }

        res.statusCode = 200;
        res.setHeader("content-type", registry.contentType);
        res.end(await registry.metrics());
        return;
      }

      res.statusCode = 404;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("not found");
    } catch (e) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end("error");
    }
  });

  server.listen(port, "0.0.0.0", () => {
    if (!METRICS_TOKEN) {
      console.warn("METRICS_TOKEN is not set; /metrics is not protected.");
    }
    console.log(`metrics server listening on :${port} (endpoints: /healthz, /metrics)`);
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

bot.command("start", async (ctx) => {
  await ctx.reply(
    "היי! אני cashBot.\n" +
      "כדי להתחיל, התחבר לדשבורד והפק קוד סנכרון (Telegram Sync Code), ואז שלח לי אותו כאן."
  );
});

bot.on("message:text", async (ctx) => {
  const chatId = ctx.chat.id;
  const text = ctx.message.text.trim();
  messagesTotal.inc();
  console.log(`[bot] msg chat=${chatId} text="${text.slice(0, 120)}"${text.length > 120 ? "…" : ""}`);

  // 1) Check linkage
  const userId = await getUserIdByChatId(chatId);

  if (!userId) {
    // Treat message as possible Sync Code
    if (text.length < 6 || text.length > 32) {
      await ctx.reply("לא נראה לי שזה קוד סנכרון. צור קוד מהדשבורד ושלח לי אותו כאן.");
      return;
    }

    linkAttemptsTotal.inc();
    const res = await claimTelegramCodeAndLinkChat({ code: text, telegram_chat_id: chatId });
    if (!res.ok) {
      await ctx.reply(res.message);
      return;
    }

    await ctx.reply("מצוין! קישרתי את הצ׳אט לחשבון שלך. עכשיו אפשר לשלוח הודעות כמו: \"Lunch 50\".");
    return;
  }

  // 2) Parse transaction
  console.log(`[bot] parsing via ${env.OPENAI_API_KEY ? "openai" : "basic"} (user linked)`);
  const parseEnd = parseDurationSeconds.startTimer();
  const parsed = await parseFinanceMessage(text);
  parseEnd();
  if (!parsed.ok) {
    await ctx.reply(parsed.question);
    return;
  }

  const { transaction } = parsed;

  // 3) Insert to DB
  const insertEnd = dbInsertDurationSeconds.startTimer();
  const { error } = await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    amount: transaction.amount,
    description: transaction.description,
    category: transaction.category,
    type: transaction.type
  });
  insertEnd();

  if (error) {
    transactionsInsertErrorsTotal.inc();
    await ctx.reply("שמירה נכשלה. נסה שוב בעוד רגע.");
    return;
  }

  transactionsInsertTotal.inc();
  await ctx.reply(
    `נשמר: ${transaction.type} ${transaction.amount} (${transaction.category}) – ${transaction.description}`
  );
});

bot.catch((err) => {
  console.error("Bot error", err);
});

async function main() {
  startMetricsServer();

  // Railway/always-on deploys should use long polling.
  // If a webhook was set in the past, polling can fail—so we delete it defensively.
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
  } catch (e) {
    console.warn("deleteWebhook failed (continuing)", e);
  }

  // Telegram allows only ONE polling instance per bot token.
  // If another instance is running (local dev / another service), Telegram returns 409.
  // We retry instead of crashing the whole service.
  while (true) {
    try {
      await bot.start();
      return;
    } catch (e: any) {
      const err = e as GrammyError;
      const msg = String((e as any)?.message ?? "");
      const is409 =
        (err instanceof GrammyError && (err as any).error_code === 409) ||
        msg.includes("409") ||
        msg.includes("terminated by other getUpdates request");

      if (is409) {
        console.warn("Telegram 409 conflict (another bot instance running). Retrying in 5s...");
        await sleep(5000);
        continue;
      }

      console.error("Bot start failed", e);
      throw e;
    }
  }
}

main();

