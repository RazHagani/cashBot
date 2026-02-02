import OpenAI from "openai";
import { env } from "./env.js";
import { ParsedResultSchema, type ParsedResult } from "./finance.js";

function getClient() {
  if (!env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

let warnedNoKey = false;

function basicParse(text: string): ParsedResult | null {
  // Extract last number as amount (supports "20", "20.5", "20,5")
  const m = text.match(/(-?\d+(?:[.,]\d+)?)(?!.*\d)/);
  if (!m) return null;
  const amount = Number(m[1].replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const desc = text.replace(m[0], "").trim().replace(/^[-–—:]+/, "").trim();
  if (!desc) return null;

  const lower = desc.toLowerCase();
  const isSalary = /משכורת|שכר|salary/.test(desc) || /salary/.test(lower);
  const isTransport = /uber|אובר|מונית|אוטובוס|רכבת|דלק/.test(lower) || /אובר|מונית|אוטובוס|רכבת|דלק/.test(desc);
  const isBills = /חשמל|מים|ארנונה|שכירות|אינטרנט|גז/.test(desc);
  const isFood = /pizza|pasta|lunch|dinner|coffee|cafe|restaurant/.test(lower) || /פיצה|אוכל|מסעדה|קפה|ארוחה/.test(desc);
  const isShopping = /amazon|shopping|supermarket|groceries/.test(lower) || /קניות|סופר/.test(desc);
  const isHealth = /doctor|pharmacy|medicine/.test(lower) || /רופא|בית מרקחת|תרופה/.test(desc);
  const isEntertainment = /movie|netflix|spotify|game/.test(lower) || /סרט|נטפליקס|ספוטיפיי|בילוי/.test(desc);

  const type = isSalary ? "income" : "expense";
  const category = isSalary
    ? "Salary"
    : isFood
      ? "Food"
      : isTransport
        ? "Transport"
        : isBills
          ? "Bills"
          : isShopping
            ? "Shopping"
            : isHealth
              ? "Health"
              : isEntertainment
                ? "Entertainment"
                : "Other";

  return {
    ok: true,
    transaction: {
      amount,
      description: desc.slice(0, 200),
      category,
      type
    }
  };
}

const jsonSchema = {
  name: "CashBotTransactionParse",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      ok: { type: "boolean" },
      transaction: {
        type: "object",
        additionalProperties: false,
        properties: {
          amount: { type: "number", minimum: 0.01 },
          description: { type: "string", minLength: 1, maxLength: 200 },
          category: {
            type: "string",
            enum: ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Health", "Salary", "Other"]
          },
          type: { type: "string", enum: ["expense", "income"] }
        },
        required: ["amount", "description", "category", "type"]
      },
      reason: { type: "string" },
      question: { type: "string" }
    },
    // NOTE: OpenAI's json_schema doesn't allow all JSON Schema keywords.
    // In particular, "allOf/if/then" are rejected. We validate conditionals in Zod instead.
    required: ["ok"]
  }
} as const;

export async function parseFinanceMessage(text: string): Promise<ParsedResult> {
  try {
    const client = getClient();
    if (!client) {
      if (!warnedNoKey) {
        warnedNoKey = true;
        console.warn("[openai] OPENAI_API_KEY is missing; using basicParse fallback.");
      }
      return (
        basicParse(text) ?? {
          ok: false,
          reason: "openai_not_configured",
          question: 'חסר OPENAI_API_KEY בשרת. בינתיים שלח בפורמט: "תיאור סכום" (למשל: "פיצה 20").'
        }
      );
    }

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You parse short personal finance messages into a single transaction. " +
            "If you cannot confidently parse, return ok=false with a short question for clarification."
        },
        {
          role: "user",
          content:
            `Message: ${text}\n\n` +
            "Examples:\n" +
            "- Lunch 50 -> expense, category Food\n" +
            "- Salary 12000 -> income, category Salary\n" +
            "- Uber 32 -> expense, category Transport\n"
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema
      }
    });

    const content = res.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return (
        basicParse(text) ?? {
          ok: false,
          reason: "JSON parse failed",
          question: "לא הצלחתי להבין. אפשר לנסח כמו: \"פיצה 20\" או \"משכורת 12000\"?"
        }
      );
    }

    const validated = ParsedResultSchema.safeParse(parsed);
    if (!validated.success) {
      return (
        basicParse(text) ?? {
          ok: false,
          reason: "Validation failed",
          question: "אפשר לשלוח בפורמט קצר כמו: \"תיאור סכום\"? לדוגמה: \"פיצה 20\"."
        }
      );
    }

    return validated.data;
  } catch (e: any) {
    const msg = String(e?.message ?? "");
    const code = e?.code ?? e?.error?.code;
    const status = e?.status ?? e?.response?.status;
    const isQuota = status === 429 || code === "insufficient_quota" || msg.includes("exceeded your current quota");

    // Log useful info for debugging (without leaking secrets).
    console.warn(
      "[openai] request failed; falling back.",
      JSON.stringify({
        status: status ?? null,
        code: code ?? null,
        message: msg.slice(0, 200)
      })
    );

    // Fallback if OpenAI is unavailable/quota exceeded
    const fallback = basicParse(text);
    if (fallback) return fallback;

    return {
      ok: false,
      reason: isQuota ? "insufficient_quota" : "openai_error",
      question: isQuota
        ? "ל־OpenAI אין כרגע מכסה/חיוב פעיל (quota). בינתיים שלח בפורמט: \"תיאור סכום\" (למשל: \"פיצה 20\")."
        : "יש בעיה זמנית בפענוח. נסה לשלוח בפורמט: \"תיאור סכום\" (למשל: \"פיצה 20\")."
    };
  }
}

