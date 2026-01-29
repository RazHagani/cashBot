import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; next?: string; message?: string; details?: string }> | undefined;
}) {
  const sp = (await searchParams) ?? {};
  const params = new URLSearchParams();
  if (sp.next) params.set("next", sp.next);
  if (sp.error) params.set("error", sp.error);
  if (sp.details) params.set("details", sp.details);
  if (sp.message) params.set("message", sp.message);
  redirect(params.toString() ? `/?${params.toString()}` : "/");
}

