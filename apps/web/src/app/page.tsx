import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="rounded-2xl border bg-white p-6">
        <h1 className="text-2xl font-semibold">cashBot</h1>
        <p className="mt-2 text-sm text-zinc-600">
          מעקב הוצאות/הכנסות עם סנכרון ל־Telegram.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            התחברות
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            הרשמה
          </Link>
        </div>
      </div>
    </main>
  );
}

