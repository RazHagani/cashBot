"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { id: "month", label: "חודש נוכחי" },
  { id: "prev_month", label: "חודש קודם" },
  { id: "3m", label: "3 חודשים" },
  { id: "year", label: "שנה" }
] as const;

export function RangePicker() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = sp.get("range") ?? "month";

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
                router.replace(`${pathname}?${next.toString()}`);
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
    </div>
  );
}

