import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

// Ensure env is loaded before parsing.
// When running from repo root, the bot env file lives at apps/bot/.env.local.
dotenv.config({ path: path.resolve(process.cwd(), "apps/bot/.env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "apps/bot/.env") });
dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1)
});

export const env = envSchema.parse({
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN?.trim(),
  OPENAI_API_KEY: process.env.OPENAI_API_KEY?.trim(),
  SUPABASE_URL: process.env.SUPABASE_URL?.trim(),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
});

