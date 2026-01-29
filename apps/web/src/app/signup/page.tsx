import { AuthShell } from "@/components/auth/AuthShell";
import { redirect } from "next/navigation";

export default function SignupPage() {
  // Google OAuth creates the user automatically when needed.
  // Keep /signup as a friendly entry point, but route everyone to /login.
  redirect("/login");
}

