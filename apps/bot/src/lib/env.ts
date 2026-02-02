import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

// Ensure env is loaded before parsing.
// When running from repo root, the bot env file lives at apps/bot/.env.local.
dotenv.config({ path: path.resolve(process.cwd(), "apps/bot/.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "apps/bot/.env") });
dotenv.config();

function cleanEnv(v: unknown) {
  if (typeof v !== "string") return undefined;
  let s = v.trim();
  // Railway/CI UIs sometimes store secrets with surrounding quotes.
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s || undefined;
}

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  // Optional: bot can fall back to basic parsing if missing/quota issues.
  OPENAI_API_KEY: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

export const env = envSchema.parse({
  TELEGRAM_BOT_TOKEN: cleanEnv(process.env.TELEGRAM_BOT_TOKEN),
  OPENAI_API_KEY: cleanEnv(process.env.OPENAI_API_KEY),
  SUPABASE_URL: cleanEnv(process.env.SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY)
});

