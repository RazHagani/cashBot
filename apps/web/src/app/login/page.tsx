import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; next?: string; message?: string; details?: string }> | undefined;
}) {
  const sp = (await searchParams) ?? {};
  return (
    <AuthShell
      title="התחברות"
      subtitle="התחבר באמצעות Google כדי להמשיך לדשבורד."
      footer={{ text: "אין לך משתמש?", href: "/login", cta: "המשך עם Google" }}
    >
      <LoginForm
        checkEmail={sp.message === "check_email"}
        oauthError={sp.error ? { error: sp.error, details: sp.details } : undefined}
      />
    </AuthShell>
  );
}

