import Link from "next/link";

export function AuthShell(props: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: { text: string; href: string; cta: string };
}) {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-10 md:px-6">
      {/* Background polish */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/15 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute -top-24 left-10 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/16" />
        <div className="absolute bottom-0 right-0 h-[520px] w-[520px] rounded-full bg-rose-500/10 blur-3xl dark:bg-rose-500/16" />
        <div className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(24,24,27,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(24,24,27,0.06)_1px,transparent_1px)] [background-size:72px_72px] dark:opacity-[0.25] dark:[background-image:linear-gradient(rgba(244,244,245,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(244,244,245,0.08)_1px,transparent_1px)]" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl">
        {/* Mobile brand header */}
        <div className="mx-auto mb-6 flex max-w-md items-center justify-between md:hidden">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-zinc-900">
              cb
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">cashBot</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Personal finance tracker</div>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-3xl border border-zinc-200/70 bg-white/60 p-7 shadow-sm backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/40 md:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_500px_at_0%_0%,rgba(99,102,241,0.20),transparent_55%),radial-gradient(700px_450px_at_100%_0%,rgba(16,185,129,0.14),transparent_60%),radial-gradient(700px_450px_at_60%_100%,rgba(244,63,94,0.12),transparent_60%)]" />
            <div className="relative">
              <div className="hidden md:block">
                <Link href="/" className="inline-flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white shadow-sm dark:bg-white dark:text-zinc-900">
                    cb
                  </span>
                  <div className="leading-tight">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">cashBot</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Personal finance tracker</div>
                  </div>
                </Link>
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 md:mt-8 md:text-3xl">
                שליטה בהוצאות. בלי כאב ראש.
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                דשבורד ברור, קטגוריות, הוראות קבע, וסנכרון לטלגרם—כדי שתדע בדיוק לאן הכסף הולך.
              </p>

              <div className="mt-7 grid gap-3">
                {[
                  { title: "דשבורד חכם", desc: "גרפים ו‑KPIs עם השוואה לחודש קודם." },
                  { title: "Telegram Sync", desc: "שלח “פיצה 20” והטרנזקציה נשמרת." },
                  { title: "הוראות קבע", desc: "תכנון חודשי והוצאות מתוכננות." }
                ].map((f) => (
                  <div
                    key={f.title}
                    className="rounded-2xl border border-zinc-200/70 bg-white/60 p-4 text-sm shadow-sm dark:border-zinc-800/60 dark:bg-zinc-950/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{f.title}</div>
                      <div className="h-6 w-6 rounded-full border border-zinc-200/70 bg-white/70 dark:border-zinc-800/60 dark:bg-zinc-950/60" />
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Card with gradient border */}
          <section className="rounded-3xl bg-gradient-to-b from-zinc-900/10 to-zinc-900/0 p-[1px] dark:from-white/10 dark:to-white/0">
            <div className="rounded-3xl border border-zinc-200/70 bg-white/75 p-6 shadow-sm backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/55 md:p-8">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{props.title}</h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{props.subtitle}</p>
              </div>

              <div className="mt-6">{props.children}</div>

              <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
                {props.footer.text}{" "}
                <Link
                  href={props.footer.href}
                  className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                >
                  {props.footer.cta}
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

