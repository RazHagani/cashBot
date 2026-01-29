"use server";

import { redirect } from "next/navigation";

export async function signupAction(prevStateOrFormData: unknown, maybeFormData?: FormData) {
  // Password signup is intentionally disabled in this app.
  // Google OAuth creates the user automatically when needed.
  void prevStateOrFormData;
  void maybeFormData;
  redirect("/login");
}

