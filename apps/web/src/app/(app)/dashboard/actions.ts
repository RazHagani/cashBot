"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/finance/types";

const createTxSchema = z.object({
  amount: z.coerce.number().positive(),
  description: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  type: z.enum(["expense", "income"])
});

export async function createTransactionAction(formData: FormData) {
  const parsed = createTxSchema.safeParse({
    amount: formData.get("amount"),
    description: formData.get("description"),
    category: formData.get("category"),
    type: formData.get("type")
  });

  if (!parsed.success) {
    return { ok: false as const, message: "נתונים לא תקינים." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, message: "לא מחובר." };
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    amount: parsed.data.amount,
    description: parsed.data.description,
    category: parsed.data.category,
    type: parsed.data.type
  });

  if (error) {
    return { ok: false as const, message: "שמירה נכשלה." };
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

const updateTxSchema = z.object({
  id: z.string().min(1),
  amount: z.coerce.number().positive(),
  description: z.string().min(1).max(200),
  category: z.enum(CATEGORIES),
  type: z.enum(["expense", "income"]),
  notes: z.string().max(2000).optional(),
  tags: z.string().max(500).optional(),
  receipt_path: z.string().max(500).optional()
});

export async function updateTransactionAction(formData: FormData) {
  const parsed = updateTxSchema.safeParse({
    id: formData.get("id"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    category: formData.get("category"),
    type: formData.get("type"),
    notes: formData.get("notes"),
    tags: formData.get("tags"),
    receipt_path: formData.get("receipt_path")
  });

  if (!parsed.success) return { ok: false as const, message: "נתונים לא תקינים." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "לא מחובר." };

  const tagsArr =
    parsed.data.tags
      ?.split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 20) ?? [];

  const { error } = await supabase
    .from("transactions")
    .update({
      amount: parsed.data.amount,
      description: parsed.data.description,
      category: parsed.data.category,
      type: parsed.data.type,
      notes: parsed.data.notes ?? null,
      tags: tagsArr,
      receipt_path: parsed.data.receipt_path ?? null
    })
    .eq("id", parsed.data.id)
    .eq("user_id", user.id);

  if (error) return { ok: false as const, message: "עדכון נכשל." };
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteTransactionAction(id: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "לא מחובר." };

  const { error } = await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { ok: false as const, message: "מחיקה נכשלה." };

  revalidatePath("/dashboard");
  return { ok: true as const };
}

