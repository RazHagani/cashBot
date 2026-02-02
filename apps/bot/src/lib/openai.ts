import OpenAI from "openai";
import { env } from "./env.js";
import { ParsedResultSchema, type ParsedResult } from "./finance.js";

function getClient() {
  if (!env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

let warnedNoKey = false;

function cleanDescription(input: string) {
  let s = input.trim();
  // Remove common Hebrew "purchase verbs"/fillers from the beginning.
  // Keep it conservative to avoid over-stripping real product names.
  s = s.replace(
    /^(?:היום\s+)?(?:קניתי|קנינו|קנית|קנה|קנו|שילמתי|שילמנו|קניתי היום)\s+/,
    ""
  );
  s = s.replace(/^(?:ב|על)\s+/, ""); // e.g., "על חצילים" -> "חצילים"
  s = s.replace(/^[-–—:]+/, "").trim();

  // Strip trailing price/currency fragments if they leaked into description.
  // Examples: "6 חצילים ב-100", "6 חצילים ב100₪", "6 חצילים במאה שקל"
  s = s.replace(/\s*(?:ב(?:-| )?)?\d+(?:[.,]\d+)?\s*(?:₪|ש\"?ח|שח|שקל(?:ים)?)?\s*$/i, "");
  s = s.replace(/\s*ב(?:-| )?(?:מאה|מאתיים|אלף)\s*(?:₪|ש\"?ח|שח|שקל(?:ים)?)\s*$/i, "");
  // If currency words appear at the end with no number (rare), strip them.
  s = s.replace(/\s*(?:₪|ש\"?ח|שח|שקל(?:ים)?)\s*$/i, "");

  // Remove leftover punctuation
  s = s.replace(/[()]/g, "").trim();
  s = s.replace(/\s{2,}/g, " ").trim();
  return s || input.trim();
}

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
      description: cleanDescription(desc).slice(0, 200),
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
        // In OpenAI strict mode, all top-level properties must be required.
        // We allow null here and enforce conditional requirements in Zod.
        type: ["object", "null"],
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
      reason: { type: ["string", "null"] },
      question: { type: ["string", "null"] }
    },
    // NOTE: OpenAI's json_schema doesn't allow all JSON Schema keywords.
    // In particular, "allOf/if/then" are rejected. We validate conditionals in Zod instead.
    // OpenAI strict mode requires `required` include every key in `properties`.
    required: ["ok", "transaction", "reason", "question"]
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
            "Return a clean, short item/merchant description (2-6 words). " +
            "Do NOT include filler verbs like 'I bought', 'paid', dates like 'today', or any price/currency words in the description. " +
            "If the user mentions quantity/items, keep it (e.g., '6 eggplants'). " +
            "If ok=true, transaction must be an object. If ok=false, transaction should be null. " +
            "If you cannot confidently parse, return ok=false with a short question for clarification."
        },
        {
          role: "user",
          content:
            `Message: ${text}\n\n` +
            "Examples:\n" +
            "- Lunch 50 -> expense, category Food\n" +
            "- Salary 12000 -> income, category Salary\n" +
            "- Uber 32 -> expense, category Transport\n" +
            "- קניתי היום 6 חצילים ב-100 -> expense, description should be \"6 חצילים\" (not \"קניתי 6 חצילים\" and not include the price)\n" +
            "- קניתי היום 6 חצילים במאה שקל -> expense, amount 100, description \"6 חצילים\"\n"
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema
      }
    });

    // Helpful confirmation (no secrets).
    console.log(
      "[openai] success",
      JSON.stringify({
        model: (res as any)?.model ?? "unknown",
        prompt_tokens: (res as any)?.usage?.prompt_tokens ?? null,
        completion_tokens: (res as any)?.usage?.completion_tokens ?? null,
        total_tokens: (res as any)?.usage?.total_tokens ?? null
      })
    );

    const content = res.choices[0]?.message?.content ?? "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.warn(
        "[openai] response not valid JSON; falling back.",
        JSON.stringify({ sample: content.slice(0, 200) })
      );
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
      console.warn(
        "[openai] response failed Zod validation; falling back.",
        JSON.stringify({ issues: validated.error.issues.slice(0, 3) })
      );
      return (
        basicParse(text) ?? {
          ok: false,
          reason: "Validation failed",
          question: "אפשר לשלוח בפורמט קצר כמו: \"תיאור סכום\"? לדוגמה: \"פיצה 20\"."
        }
      );
    }

    // Post-clean description (Hebrew/English fillers) to keep UX consistent.
    if (validated.data.ok) {
      const cleaned = {
        ...validated.data,
        transaction: {
          ...validated.data.transaction,
          description: cleanDescription(validated.data.transaction.description).slice(0, 200)
        }
      };

      // Safety net:
      // Sometimes the model returns a placeholder amount (e.g. 0.01) even when the message clearly contains a price.
      // If our basic parser can confidently extract a real amount (>= 1), prefer it.
      const fallback = basicParse(text);
      if (fallback?.ok) {
        const modelAmount = Number(cleaned.transaction.amount);
        const basicAmount = Number(fallback.transaction.amount);

        const modelLooksPlaceholder = modelAmount === 0.01 || modelAmount < 0.5;
        const basicLooksReal = basicAmount >= 1;

        if (modelLooksPlaceholder && basicLooksReal) {
          console.warn(
            "[openai] suspicious amount from model; using basicParse amount/description instead.",
            JSON.stringify({ modelAmount, basicAmount })
          );
          return {
            ...cleaned,
            transaction: {
              ...cleaned.transaction,
              amount: basicAmount,
              description: cleanDescription(fallback.transaction.description).slice(0, 200)
            }
          };
        }
      }

      return cleaned;
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

