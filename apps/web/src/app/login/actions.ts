"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(prevStateOrFormData: unknown, maybeFormData?: FormData) {
  // Password auth is intentionally disabled in this app.
  // Keep this action as a server-side safety net if someone crafts a POST.
  void prevStateOrFormData;
  void maybeFormData;
  return { ok: false as const, message: "התחברות עם אימייל/סיסמה לא זמינה. השתמש ב‑Google." };
}

export async function loginWithGoogleAction() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`
    }
  });

  if (error || !data.url) {
    return { ok: false as const, message: "Google OAuth נכשל." };
  }

  redirect(data.url);
}

