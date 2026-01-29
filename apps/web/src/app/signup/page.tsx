import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "./SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      title="הרשמה"
      subtitle="צור משתמש כדי להתחיל לעקוב אחרי ההוצאות וההכנסות."
      footer={{ text: "כבר יש לך משתמש?", href: "/login", cta: "התחברות" }}
    >
      <SignupForm />
    </AuthShell>
  );
}

