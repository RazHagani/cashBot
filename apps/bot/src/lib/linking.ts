import crypto from "node:crypto";
import { supabaseAdmin } from "./supabase";

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export async function claimTelegramCodeAndLinkChat(params: {
  code: string;
  telegram_chat_id: number;
}) {
  const code_hash = hashCode(params.code);

  // Claim atomically (best-effort) by setting claimed_at and returning user_id
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from("telegram_link_codes")
    .update({ claimed_at: new Date().toISOString() })
    .eq("code_hash", code_hash)
    .is("claimed_at", null)
    .gt("expires_at", new Date().toISOString())
    .select("user_id")
    .maybeSingle();

  if (claimErr || !claimed?.user_id) {
    return { ok: false as const, message: "קוד לא תקין או פג תוקף. צור קוד חדש מהדשבורד." };
  }

  // Ensure unique mapping: only allow setting telegram_chat_id if not taken
  const { error: linkErr } = await supabaseAdmin
    .from("profiles")
    .update({ telegram_chat_id: params.telegram_chat_id })
    .eq("user_id", claimed.user_id);

  if (linkErr) {
    return { ok: false as const, message: "הקישור נכשל (אולי הצ׳אט כבר מקושר למשתמש אחר)." };
  }

  return { ok: true as const, user_id: claimed.user_id };
}

export async function getUserIdByChatId(telegram_chat_id: number) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("telegram_chat_id", telegram_chat_id)
    .maybeSingle();

  if (error || !data?.user_id) return null;
  return data.user_id as string;
}

