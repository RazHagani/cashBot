"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { id: "month", label: "חודש נוכחי" },
  { id: "3m", label: "3 חודשים" },
  { id: "year", label: "12 חודשים" },
  { id: "custom", label: "מותאם" }
] as const;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function RangePicker() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = sp.get("range") === "prev_month" ? "month" : (sp.get("range") ?? "month");

  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-01`;
  const defaultTo = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  const from = sp.get("from") ?? defaultFrom;
  const to = sp.get("to") ?? defaultTo;
  const toNow = sp.get("toNow") === "1";

  const replace = (next: URLSearchParams) => router.replace(`${pathname}?${next.toString()}`);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">טווח</div>
      <div className="inline-flex rounded-full border bg-white/70 p-1 dark:border-zinc-700/60 dark:bg-zinc-900/60">
        {OPTIONS.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                const next = new URLSearchParams(sp.toString());
                next.set("range", o.id);
                if (o.id !== "custom") {
                  next.delete("from");
                  next.delete("to");
                  next.delete("toNow");
                } else {
                  if (!next.get("from")) next.set("from", defaultFrom);
                  if (!next.get("to")) next.set("to", defaultTo);
                }
                replace(next);
              }}
              className={
                "rounded-full px-3 py-1.5 text-xs font-medium transition " +
                (active
                  ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800")
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {value === "custom" ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-white/60 px-3 py-2 text-xs shadow-sm backdrop-blur-xl dark:border-zinc-700/60 dark:bg-zinc-950/40 dark:text-zinc-200">
          <span className="text-zinc-500 dark:text-zinc-400">מ:</span>
          <input
            type="month"
            value={from}
            onChange={(e) => {
              const next = new URLSearchParams(sp.toString());
              next.set("range", "custom");
              next.set("from", e.target.value);
              replace(next);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <span className="text-zinc-500 dark:text-zinc-400">עד:</span>
          <input
            type="month"
            value={to}
            disabled={toNow}
            onChange={(e) => {
              const next = new URLSearchParams(sp.toString());
              next.set("range", "custom");
              next.set("to", e.target.value);
              next.delete("toNow");
              replace(next);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 disabled:opacity-60 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={toNow}
              onChange={(e) => {
                const next = new URLSearchParams(sp.toString());
                next.set("range", "custom");
                if (e.target.checked) next.set("toNow", "1");
                else next.delete("toNow");
                replace(next);
              }}
            />
            עד היום
          </label>
        </div>
      ) : null}
    </div>
  );
}

