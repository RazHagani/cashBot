"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirm_password: z.string().min(6)
}).refine((v) => v.password === v.confirm_password, {
  message: "הסיסמאות לא תואמות."
});

export async function signupAction(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirm_password: formData.get("confirm_password")
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "אימייל/סיסמה לא תקינים.";
    return { ok: false as const, message: msg };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return { ok: false as const, message: "הרשמה נכשלה." };
  }

  // If email confirmations are enabled in Supabase, session may be null.
  if (!data.session) {
    redirect("/login?message=check_email");
  }

  redirect("/dashboard");
}

