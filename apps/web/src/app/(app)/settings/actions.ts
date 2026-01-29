"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const salarySchema = z.object({
  monthly_salary: z.coerce.number().min(0).max(1_000_000)
});

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function makeCode() {
  // 10 chars, readable
  return crypto.randomBytes(8).toString("base64url").slice(0, 10).toUpperCase();
}

export async function updateSalaryAction(formData: FormData) {
  const parsed = salarySchema.safeParse({
    monthly_salary: formData.get("monthly_salary")
  });
  if (!parsed.success) return { ok: false as const, message: "שכר לא תקין." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "לא מחובר." };

  const { error } = await supabase
    .from("profiles")
    .update({ monthly_salary: parsed.data.monthly_salary })
    .eq("user_id", user.id);

  if (error) return { ok: false as const, message: "עדכון נכשל." };
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function generateTelegramSyncCodeAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "לא מחובר." };

  const code = makeCode();
  const code_hash = hashCode(code);
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

  // Optional: delete previous unclaimed codes for this user (best-effort)
  await supabase
    .from("telegram_link_codes")
    .delete()
    .eq("user_id", user.id)
    .is("claimed_at", null);

  const { error } = await supabase.from("telegram_link_codes").insert({
    code_hash,
    user_id: user.id,
    expires_at
  });

  if (error) return { ok: false as const, message: "יצירת קוד נכשלה." };
  revalidatePath("/settings");
  return { ok: true as const, code };
}

export async function disconnectTelegramAction() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "לא מחובר." };

  const { error } = await supabase.from("profiles").update({ telegram_chat_id: null }).eq("user_id", user.id);
  if (error) return { ok: false as const, message: "ניתוק נכשל." };

  await supabase.from("telegram_link_codes").delete().eq("user_id", user.id);

  revalidatePath("/settings");
  return { ok: true as const };
}

