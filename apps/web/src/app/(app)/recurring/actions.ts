"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/finance/types";

const frequencySchema = z.enum(["monthly", "weekly"]);

const createRuleSchema = z
  .object({
    amount: z.coerce.number().positive(),
    description: z.string().min(1).max(200),
    category: z.enum(CATEGORIES),
    type: z.enum(["expense", "income"]),
    frequency: frequencySchema,
    day_of_month: z.coerce.number().int().min(1).max(31).optional(),
    day_of_week: z.coerce.number().int().min(0).max(6).optional()
  })
  .superRefine((v, ctx) => {
    if (v.frequency === "monthly" && !v.day_of_month) {
      ctx.addIssue({ code: "custom", path: ["day_of_month"], message: "בחר יום בחודש." });
    }
    if (v.frequency === "weekly" && v.day_of_week === undefined) {
      ctx.addIssue({ code: "custom", path: ["day_of_week"], message: "בחר יום בשבוע." });
    }
  });

export async function createRecurringRuleAction(formData: FormData) {
  const parsed = createRuleSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description"),
    category: formData.get("category"),
    type: formData.get("type"),
    frequency: formData.get("frequency"),
    day_of_month: formData.get("day_of_month"),
    day_of_week: formData.get("day_of_week")
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "נתונים לא תקינים.";
    return { ok: false as const, message: msg };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "לא מחובר." };

  const { error } = await supabase.from("recurring_rules").insert({
    user_id: user.id,
    amount: parsed.data.amount,
    description: parsed.data.description,
    category: parsed.data.category,
    type: parsed.data.type,
    frequency: parsed.data.frequency,
    day_of_month: parsed.data.frequency === "monthly" ? parsed.data.day_of_month : null,
    day_of_week: parsed.data.frequency === "weekly" ? parsed.data.day_of_week : null
  });

  if (error) return { ok: false as const, message: "שמירה נכשלה." };

  revalidatePath("/recurring");
  return { ok: true as const };
}

export async function toggleRecurringRuleAction(id: string, active: boolean) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "לא מחובר." };

  const { error } = await supabase.from("recurring_rules").update({ active }).eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false as const, message: "עדכון נכשל." };

  revalidatePath("/recurring");
  return { ok: true as const };
}

export async function deleteRecurringRuleAction(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "לא מחובר." };

  const { error } = await supabase.from("recurring_rules").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false as const, message: "מחיקה נכשלה." };

  revalidatePath("/recurring");
  return { ok: true as const };
}

