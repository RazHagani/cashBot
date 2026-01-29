import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function Icon(props: { name: "spark" | "chat" | "repeat" | "chart" }) {
  const cls = "h-5 w-5";
  if (props.name === "chat") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </svg>
    );
  }
  if (props.name === "repeat") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    );
  }
  if (props.name === "chart") {
    return (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 3 3 5-6" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2l1.5 5 5 .5-4 3 1.5 5-4-3-4 3 1.5-5-4-3 5-.5z" />
    </svg>
  );
}

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<{ next?: string; error?: string; details?: string; message?: string }> | undefined;
}) {
  // If already logged in, go straight to the app.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const sp = (await searchParams) ?? {};
  const next = sp.next ?? "/dashboard";
  const googleHref = `/auth/google?next=${encodeURIComponent(next)}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(99,102,241,0.22),transparent_60%),radial-gradient(900px_600px_at_5%_5%,rgba(16,185,129,0.18),transparent_55%),radial-gradient(900px_600px_at_95%_5%,rgba(244,63,94,0.18),transparent_55%),linear-gradient(180deg,rgba(244,244,245,0.92),rgba(244,244,245,0.78))] text-zinc-900 dark:bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(99,102,241,0.20),transparent_60%),radial-gradient(900px_600px_at_5%_5%,rgba(16,185,129,0.16),transparent_55%),radial-gradient(900px_600px_at_95%_5%,rgba(244,63,94,0.16),transparent_55%),linear-gradient(180deg,rgba(9,9,11,1),rgba(9,9,11,0.92))] dark:text-zinc-100">
      {/* extra background polish (keeps it feeling like a product landing) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-indigo-500/22 blur-3xl dark:bg-indigo-500/22" />
        <div className="absolute -top-24 left-6 h-[520px] w-[520px] rounded-full bg-emerald-500/16 blur-3xl dark:bg-emerald-500/18" />
        <div className="absolute -bottom-40 right-0 h-[680px] w-[680px] rounded-full bg-rose-500/16 blur-3xl dark:bg-rose-500/18" />
      </div>

      {/* Top nav */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-5 md:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-zinc-900">
            cb
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">cashBot</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">Finance + Telegram</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href={googleHref}
            className="inline-flex rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-white dark:border-zinc-800/60 dark:bg-zinc-950/60 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
          >
            כניסה עם Google
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pb-14 pt-6 md:grid-cols-2 md:px-6 md:pb-20 md:pt-12">
        <div className="text-right">
          {sp.error ? (
            <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 shadow-sm dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
              שגיאה בהתחברות: {sp.error}
              {sp.details ? <div className="mt-1 text-xs opacity-80">{sp.details}</div> : null}
            </div>
          ) : null}

          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs text-zinc-700 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-950/60 dark:text-zinc-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            דשבורד חכם · Telegram · פרטיות מלאה
          </div>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:text-5xl">
            ניהול כסף חכם,
            <span className="bg-gradient-to-l from-indigo-600 via-emerald-600 to-rose-600 bg-clip-text text-transparent">
              {" "}
              בלי אקסלים
            </span>
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-300">
            הזן הוצאות/הכנסות בצורה טבעית, קבל תמונה חודשית ברורה עם גרפים ותובנות, וסנכרן דרך Telegram תוך שמירה על פרטיות לכל משתמש.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-end gap-3">
            <Link
              href={googleHref}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-l from-indigo-600 via-indigo-600 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-500/15 hover:brightness-[1.03]"
            >
              התחל עם Google
            </Link>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { t: "דשבורד + גרפים", d: "פיזור לפי קטגוריות וטרנדים", icon: "chart" as const },
              { t: "Telegram", d: "“פיצה 20” → נשמר", icon: "chat" as const },
              { t: "הוראות קבע", d: "תכנון הוצאות חודשיות", icon: "repeat" as const }
            ].map((f) => (
              <div
                key={f.t}
                className="rounded-2xl border border-zinc-200/70 bg-white/45 p-4 shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/45"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{f.t}</div>
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200/70 bg-white/55 text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950/55 dark:text-zinc-100">
                    <Icon name={f.icon} />
                  </div>
                </div>
                <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">{f.d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Product preview mock (visual “finished product” vibe) */}
        <div className="relative">
          <div className="rounded-3xl bg-gradient-to-l from-indigo-500/25 via-emerald-500/18 to-rose-500/18 p-[1px] shadow-sm">
            <div className="rounded-3xl border border-zinc-200/70 bg-white/55 p-5 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/45 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">דשבורד</div>
                  <div className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">סקירה חודשית</div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800/60 dark:bg-zinc-950/60 dark:text-zinc-200">
                  <Icon name="spark" /> Live
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  { label: "הכנסות", value: "₪ 12,400", tone: "text-emerald-700 dark:text-emerald-300" },
                  { label: "הוצאות", value: "₪ 6,920", tone: "text-rose-700 dark:text-rose-300" },
                  { label: "נטו", value: "₪ 5,480", tone: "text-zinc-900 dark:text-zinc-100" }
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-zinc-200/70 bg-white/55 p-3 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-950/55"
                  >
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{k.label}</div>
                    <div className={"mt-1 text-sm font-semibold tabular-nums " + k.tone}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-zinc-200/70 bg-white/55 p-4 dark:border-zinc-800/60 dark:bg-zinc-950/55">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">טרנד יומי</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">30 ימים</div>
                </div>
                <div className="mt-3 h-24 rounded-xl bg-[linear-gradient(90deg,rgba(99,102,241,0.15),rgba(16,185,129,0.10),rgba(244,63,94,0.10))] dark:bg-[linear-gradient(90deg,rgba(99,102,241,0.20),rgba(16,185,129,0.14),rgba(244,63,94,0.14))]">
                  <div className="h-full w-full opacity-70 [background-image:linear-gradient(rgba(24,24,27,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.10)_1px,transparent_1px)] [background-size:24px_24px] dark:[background-image:linear-gradient(rgba(244,244,245,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(244,244,245,0.12)_1px,transparent_1px)]" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-200/70 bg-white/55 p-4 dark:border-zinc-800/60 dark:bg-zinc-950/55">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">Telegram</div>
                  <div className="mt-2 rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950/60 dark:text-zinc-100">
                    פיצה 20
                  </div>
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">נשמר כ־הוצאה · אוכל</div>
                </div>
                <div className="rounded-2xl border border-zinc-200/70 bg-white/55 p-4 dark:border-zinc-800/60 dark:bg-zinc-950/55">
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">הוראות קבע</div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-sm">
                    <span className="text-zinc-900 dark:text-zinc-100">שכירות</span>
                    <span className="tabular-nums text-rose-700 dark:text-rose-300">₪ 3,600</span>
                  </div>
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">חודשי · יום 1</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute -bottom-6 left-6 hidden rounded-2xl border border-zinc-200/70 bg-white/55 px-4 py-2 text-xs text-zinc-700 shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/45 dark:text-zinc-200 md:block">
            <span className="font-medium">פרטיות מלאה</span> · כל משתמש רואה רק את הנתונים שלו
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <div className="rounded-3xl border border-zinc-200/70 bg-white/45 p-6 shadow-sm backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/35 md:p-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">איך זה עובד</div>
              <div className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">3 צעדים ואתה בפנים</div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { n: "01", t: "נכנסים", d: "Google בלבד (יוצר משתמש אוטומטית)." },
              { n: "02", t: "מגדירים", d: "שכר חודשי + חיבור Telegram." },
              { n: "03", t: "עוקבים", d: "דשבורד, גרפים, תגים, קבלות." }
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-zinc-200/70 bg-white/55 p-5 shadow-sm dark:border-zinc-800/60 dark:bg-zinc-950/45"
              >
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{s.n}</div>
                <div className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">{s.t}</div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="relative mx-auto max-w-6xl px-4 pb-10 md:px-6">
        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-200/60 pt-6 text-sm text-zinc-600 dark:border-zinc-800/60 dark:text-zinc-300 md:flex-row">
          <div>© {new Date().getFullYear()} cashBot</div>
        </div>
      </footer>
    </main>
  );
}

