import Link from "next/link";
import { signupAction } from "./actions";

export default function SignupPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-10">
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-xl font-semibold">הרשמה</h1>

        <a
          href="/auth/google"
          className="mt-6 block w-full rounded-lg border bg-white px-4 py-2 text-center text-sm font-medium"
        >
          הרשמה עם Google
        </a>

        <div className="my-4 flex items-center gap-3 text-xs text-zinc-500">
          <div className="h-px flex-1 bg-zinc-200" />
          או
          <div className="h-px flex-1 bg-zinc-200" />
        </div>

        <form action={signupAction} className="mt-6 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            אימייל
            <input
              name="email"
              type="email"
              required
              className="rounded-lg border px-3 py-2"
              autoComplete="email"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            סיסמה
            <input
              name="password"
              type="password"
              required
              className="rounded-lg border px-3 py-2"
              autoComplete="new-password"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            וידוא סיסמה
            <input
              name="confirm_password"
              type="password"
              required
              className="rounded-lg border px-3 py-2"
              autoComplete="new-password"
            />
          </label>
          <button
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            type="submit"
          >
            צור משתמש
          </button>
        </form>

        <p className="mt-4 text-sm text-zinc-600">
          כבר יש לך משתמש? <Link href="/login" className="underline">התחברות</Link>
        </p>
      </div>
    </main>
  );
}

