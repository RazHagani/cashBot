import Link from "next/link";
import { loginAction } from "./actions";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ error?: string; next?: string; message?: string; details?: string }> | undefined;
}) {
  const sp = (await searchParams) ?? {};
  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-10">
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-xl font-semibold">התחברות</h1>

        {sp.message === "check_email" ? (
          <p className="mt-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
            שלחנו לך אימייל לאימות. אחרי אישור—תחזור לכאן ותתחבר.
          </p>
        ) : null}

        {sp.error ? (
          <p className="mt-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            שגיאה: {sp.error}
            {sp.details ? <span className="block mt-1 text-xs opacity-80">{sp.details}</span> : null}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 flex flex-col gap-3">
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
              autoComplete="current-password"
            />
          </label>
          <button
            className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            type="submit"
          >
            התחבר
          </button>
        </form>

        <a
          href="/auth/google"
          className="mt-3 block w-full rounded-lg border bg-white px-4 py-2 text-center text-sm font-medium"
        >
          התחבר עם Google
        </a>

        <p className="mt-4 text-sm text-zinc-600">
          אין לך משתמש? <Link href="/signup" className="underline">הרשמה</Link>
        </p>
      </div>
    </main>
  );
}

