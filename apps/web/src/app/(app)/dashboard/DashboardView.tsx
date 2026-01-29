"use client";

import { Card, DonutChart, AreaChart } from "@tremor/react";
import { CATEGORIES, type TransactionType } from "@/lib/finance/types";
import { createTransactionAction, deleteTransactionAction, updateTransactionAction } from "./actions";
import { useMemo, useState } from "react";
import Link from "next/link";
import { RangePicker } from "./RangePicker";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type TxRow = {
  id: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  notes?: string | null;
  tags?: string[] | null;
  receipt_path?: string | null;
  created_at: string;
};

type Kpi = { label: string; value: number; delta: number | null };

const CATEGORY_LABELS_HE: Record<string, string> = {
  Food: "אוכל",
  Transport: "תחבורה",
  Bills: "חשבונות",
  Entertainment: "בילוי",
  Shopping: "קניות",
  Health: "בריאות",
  Salary: "משכורת",
  Other: "אחר"
};

const CATEGORY_STYLE: Record<
  string,
  { tremor: string; dot: string; bar: string }
> = {
  Food: { tremor: "amber", dot: "bg-amber-500", bar: "bg-amber-500" },
  Transport: { tremor: "cyan", dot: "bg-cyan-500", bar: "bg-cyan-500" },
  Bills: { tremor: "indigo", dot: "bg-indigo-500", bar: "bg-indigo-500" },
  Entertainment: { tremor: "fuchsia", dot: "bg-fuchsia-500", bar: "bg-fuchsia-500" },
  Shopping: { tremor: "violet", dot: "bg-violet-500", bar: "bg-violet-500" },
  Health: { tremor: "lime", dot: "bg-lime-500", bar: "bg-lime-500" },
  Salary: { tremor: "emerald", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  Other: { tremor: "slate", dot: "bg-slate-500", bar: "bg-slate-500" }
};

export function DashboardView(props: {
  monthLabel: string;
  summary: { income: number; expenses: number };
  plannedRecurring: { expenses: number; income: number };
  kpis: Kpi[];
  isTelegramLinked: boolean;
  userId: string;
  recurringRules: Array<{
    id: string;
    amount: number;
    description: string;
    category: string;
    type: "expense" | "income";
    frequency: "monthly" | "weekly";
    day_of_month: number | null;
    day_of_week: number | null;
    active: boolean;
  }>;
  byCategory: Array<{ category: string; total: number }>;
  byDay: Array<{ date: string; expenses: number; income: number }>;
  items: TxRow[];
}) {
  const currency = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" });
  const percent = new Intl.NumberFormat("he-IL", { style: "percent", maximumFractionDigits: 0 });
  const money = (n: number) => currency.format(n);
  const deltaTone = (d: number | null) =>
    d === null
      ? "text-zinc-700 bg-zinc-100/70 dark:text-zinc-200 dark:bg-zinc-900/60"
      : d > 0
        ? "text-emerald-800 bg-emerald-50 dark:text-emerald-200 dark:bg-emerald-950/40"
        : d < 0
          ? "text-rose-800 bg-rose-50 dark:text-rose-200 dark:bg-rose-950/40"
          : "text-zinc-700 bg-zinc-100/70 dark:text-zinc-200 dark:bg-zinc-900/60";
  const deltaArrow = (d: number | null) => (d === null ? "•" : d > 0 ? "▲" : d < 0 ? "▼" : "•");
  const catLabel = (c: string) => CATEGORY_LABELS_HE[c] ?? c;
  const categoryTable = props.byCategory
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const maxCat = categoryTable.reduce((m, x) => Math.max(m, x.total), 0) || 1;
  const totalExpense = props.summary.expenses || 0;

  const donutCategoryData = props.byCategory.map((x) => ({ ...x, category: catLabel(x.category) }));
  const donutCategoryColors = props.byCategory.map((x) => CATEGORY_STYLE[x.category]?.tremor ?? "slate");

  const incomeVsExpense = [
    { name: "הוצאות", total: props.summary.expenses },
    { name: "הכנסות", total: props.summary.income }
  ].filter((x) => x.total > 0);

  const dayChart = useMemo(
    () =>
      props.byDay.map((d) => ({
        date: d.date,
        הוצאות: d.expenses,
        הכנסות: d.income
      })),
    [props.byDay]
  );

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [editing, setEditing] = useState<TxRow | null>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptPath, setReceiptPath] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return props.items.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        catLabel(t.category).toLowerCase().includes(q)
      );
    });
  }, [props.items, query, typeFilter, categoryFilter]);

  const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:items-end">
        <div>
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">סקירה</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight dark:text-zinc-100">דשבורד</h1>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{props.monthLabel}</div>
        </div>
        <div className="flex flex-wrap items-center justify-start gap-3 md:justify-end">
          <RangePicker />
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            Telegram:{" "}
            <span
              className={
                props.isTelegramLinked
                  ? "font-medium text-emerald-700"
                  : "font-medium text-zinc-700 dark:text-zinc-200"
              }
            >
              {props.isTelegramLinked ? "מחובר" : "לא מחובר"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {props.kpis.map((k) => (
          <Card
            key={k.label}
            className="relative overflow-hidden rounded-2xl dark:border-zinc-800/60 dark:bg-zinc-950/60"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(400px_200px_at_0%_0%,rgba(99,102,241,0.12),transparent_55%),radial-gradient(400px_200px_at_100%_0%,rgba(16,185,129,0.10),transparent_55%)]" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-zinc-600 dark:text-zinc-300">{k.label}</div>
                <div className="mt-2 text-2xl font-semibold">{money(k.value)}</div>
              </div>
              <div className={`rounded-full px-2 py-1 text-xs font-medium ${deltaTone(k.delta)}`}>
                {k.delta === null ? (
                  <>
                    • אין נתון<span className="opacity-70"> (חודש קודם)</span>
                  </>
                ) : (
                  <>
                    {deltaArrow(k.delta)} {percent.format(k.delta)}
                    <span className="opacity-70"> מול חודש קודם</span>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {(props.plannedRecurring.expenses > 0 || props.plannedRecurring.income > 0) ? (
      <div className="rounded-2xl border border-zinc-200/70 bg-white/70 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800/60 dark:bg-zinc-950/60 dark:text-zinc-200">
          כולל הוראות קבע החודש:
          <span className="mx-2 tabular-nums text-rose-700 dark:text-rose-300">הוצאות {money(props.plannedRecurring.expenses)}</span>
          <span className="tabular-nums text-emerald-700 dark:text-emerald-300">הכנסות {money(props.plannedRecurring.income)}</span>
        </div>
      ) : null}

      {/* Analytics strip */}
      <div className="rounded-3xl border border-zinc-200/70 bg-[linear-gradient(135deg,rgba(99,102,241,0.10),rgba(16,185,129,0.06),rgba(244,63,94,0.06))] p-4 dark:border-zinc-800/60 dark:bg-[linear-gradient(135deg,rgba(99,102,241,0.14),rgba(16,185,129,0.08),rgba(244,63,94,0.08))] md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Analytics</div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">פיזור נתונים</div>
          </div>
          <div className="hidden flex-wrap items-center gap-2 md:flex">
            {CATEGORIES.map((c) => {
              const s = CATEGORY_STYLE[c] ?? CATEGORY_STYLE.Other;
              return (
                <span
                  key={c}
                  className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs text-zinc-700 dark:border-zinc-800/60 dark:bg-zinc-950/60 dark:text-zinc-200"
                >
                  <span className={`h-2 w-2 rounded-full ${s.dot}`} />
                  {catLabel(c)}
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="rounded-2xl dark:border-zinc-800/60 dark:bg-zinc-950/60">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">הוצאות לפי קטגוריה</div>
          <div className="relative mt-4">
            <DonutChart
              data={donutCategoryData}
              category="total"
              index="category"
              valueFormatter={money}
              colors={donutCategoryColors}
              className="h-56"
              showLabel={false}
            />
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">סה״כ הוצאות</div>
                <div className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{money(totalExpense)}</div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {categoryTable.length === 0 ? (
              <div className="rounded-xl border bg-white px-3 py-3 text-sm text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-400">אין נתונים עדיין.</div>
            ) : (
              categoryTable.map((c) => {
                const style = CATEGORY_STYLE[c.category] ?? CATEGORY_STYLE.Other;
                const pct = Math.max(0.06, c.total / maxCat);
                const share = totalExpense > 0 ? c.total / totalExpense : 0;
                return (
                  <div key={c.category} className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <div className="truncate font-medium text-zinc-800 dark:text-zinc-100">{catLabel(c.category)}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{percent.format(share)}</div>
                          <div className="tabular-nums text-zinc-700 dark:text-zinc-200">{money(c.total)}</div>
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900">
                        <div className={`h-full ${style.bar}`} style={{ width: `${pct * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
        <Card className="rounded-2xl dark:border-zinc-800/60 dark:bg-zinc-950/60">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">הכנסות מול הוצאות</div>
          <div className="mt-4">
            <DonutChart
              data={incomeVsExpense}
              category="total"
              index="name"
              valueFormatter={money}
              colors={["rose", "emerald"]}
              className="h-56"
              showLabel={false}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-white p-3 dark:border-zinc-800/60 dark:bg-zinc-950">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">הוצאות</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-rose-700 dark:text-rose-300">{money(props.summary.expenses)}</div>
            </div>
            <div className="rounded-xl border bg-white p-3 dark:border-zinc-800/60 dark:bg-zinc-950">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">הכנסות</div>
              <div className="mt-1 text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">{money(props.summary.income)}</div>
            </div>
          </div>
        </Card>
        <Card className="rounded-2xl md:col-span-3 dark:border-zinc-800/60 dark:bg-zinc-950/60">
          <div className="text-sm text-zinc-600 dark:text-zinc-300">טרנד יומי</div>
          <div className="mt-4">
            <AreaChart
              data={dayChart}
              index="date"
              categories={["הוצאות", "הכנסות"]}
              valueFormatter={money}
              colors={["rose", "emerald"]}
              className="h-72"
            />
          </div>
        </Card>
        </div>
      </div>

      {/* Recurring rules preview */}
      <Card className="rounded-2xl dark:border-zinc-800/60 dark:bg-zinc-950/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">הוראות קבע</div>
            <div className="mt-1 text-xs text-zinc-500">
              {props.recurringRules.length} אחרונות (לניהול מלא עברו למסך הוראות קבע)
            </div>
          </div>
          <Link
            href="/recurring"
            className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900/60"
          >
            ניהול
          </Link>
        </div>

        <div className="mt-4 divide-y rounded-xl border bg-white dark:divide-zinc-800/60 dark:border-zinc-800/60 dark:bg-zinc-950">
          {props.recurringRules.length === 0 ? (
            <div className="px-3 py-4 text-sm text-zinc-500 dark:text-zinc-400">אין הוראות קבע עדיין. הוסף אחת במסך “הוראות קבע”.</div>
          ) : (
            props.recurringRules.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{r.description}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                    <span className="rounded-full bg-zinc-50 px-2 py-1 dark:bg-zinc-900/60">{catLabel(r.category)}</span>
                    <span className="rounded-full bg-zinc-50 px-2 py-1 dark:bg-zinc-900/60">
                      {r.frequency === "monthly"
                        ? `חודשי (יום ${r.day_of_month ?? "?"})`
                        : `שבועי (${typeof r.day_of_week === "number" ? DAYS_HE[r.day_of_week] : "?"})`}
                    </span>
                    <span
                      className={
                        r.active
                          ? "rounded-full bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "rounded-full bg-zinc-100 px-2 py-1 text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200"
                      }
                    >
                      {r.active ? "פעיל" : "כבוי"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={
                      r.type === "expense"
                        ? "rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                        : "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                    }
                  >
                    {r.type === "expense" ? "הוצאה" : "הכנסה"}
                  </span>
                  <div className="tabular-nums text-sm font-semibold">{money(r.amount)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="rounded-2xl dark:border-zinc-800/60 dark:bg-zinc-950/60">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">הוספת טרנזקציה</div>
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              טיפ: כתוב בטלגרם “פיצה 20” או “משכורת 12000”
            </div>
          </div>
        </div>

        <form action={createTransactionAction} className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <input
            name="description"
            placeholder="תיאור"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-200 md:col-span-2"
            required
            maxLength={200}
          />
          <input
            name="amount"
            placeholder="סכום"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-200"
            required
            inputMode="decimal"
          />
          <select
            name="category"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200"
            defaultValue="Other"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {catLabel(c)}
              </option>
            ))}
          </select>
          <select
            name="type"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200"
            defaultValue="expense"
          >
            <option value="expense">הוצאה</option>
            <option value="income">הכנסה</option>
          </select>
          <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black md:col-span-5">
            שמור
          </button>
        </form>

        <div className="mt-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-medium">טרנזקציות החודש</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                מציג {filtered.length} מתוך {props.items.length}
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש (תיאור/קטגוריה)"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-200 md:w-56"
              />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200 md:w-36"
              >
                <option value="all">כל הסוגים</option>
                <option value="expense">הוצאות</option>
                <option value="income">הכנסות</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200 md:w-44"
              >
                <option value="all">כל הקטגוריות</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {catLabel(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-2 overflow-hidden rounded-lg border bg-white dark:border-zinc-800/60 dark:bg-zinc-950">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-right text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300">
                <tr>
                  <th className="px-3 py-2">תאריך</th>
                  <th className="px-3 py-2">תיאור</th>
                  <th className="px-3 py-2">קטגוריה</th>
                  <th className="px-3 py-2">סוג</th>
                  <th className="px-3 py-2 text-left">סכום</th>
                  <th className="px-3 py-2 text-left">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id} className="border-t dark:border-zinc-800/60">
                    <td className="px-3 py-2">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="px-3 py-2">{t.description}</td>
                    <td className="px-3 py-2">{catLabel(t.category)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={
                          t.type === "expense"
                            ? "rounded-full bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
                            : "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                        }
                      >
                        {t.type === "expense" ? "הוצאה" : "הכנסה"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-left tabular-nums">{money(t.amount)}</td>
                    <td className="px-3 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
                          onClick={() => {
                            setEditing(t);
                            setReceiptPath(t.receipt_path ?? null);
                            setReceiptError(null);
                          }}
                        >
                          ערוך
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-rose-300 dark:hover:bg-rose-950/30"
                          onClick={async () => {
                            if (!confirm("למחוק את הטרנזקציה?")) return;
                            await deleteTransactionAction(t.id);
                          }}
                        >
                          מחק
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-400" colSpan={6}>
                      אין תוצאות למסננים הנוכחיים.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border bg-white p-5 shadow-xl dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">עריכת טרנזקציה</div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  עדכן פרטים, הוסף תגיות/הערה והעלה קבלה.
                </div>
              </div>
              <button
                type="button"
                className="rounded-lg border bg-white px-2 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
                onClick={() => setEditing(null)}
              >
                סגור
              </button>
            </div>

            <form
              className="mt-4 grid grid-cols-1 gap-3"
              action={async (formData) => {
                formData.set("id", editing.id);
                if (receiptPath) formData.set("receipt_path", receiptPath);
                await updateTransactionAction(formData);
                setEditing(null);
              }}
            >
              <input type="hidden" name="id" value={editing.id} />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm">
                  תיאור
                  <input
                    name="description"
                    defaultValue={editing.description}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100"
                    maxLength={200}
                    required
                  />
                </label>
                <label className="text-sm">
                  סכום
                  <input
                    name="amount"
                    defaultValue={editing.amount}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100"
                    inputMode="decimal"
                    required
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm">
                  סוג
                  <select
                    name="type"
                    defaultValue={editing.type}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="expense">הוצאה</option>
                    <option value="income">הכנסה</option>
                  </select>
                </label>
                <label className="text-sm">
                  קטגוריה
                  <select
                    name="category"
                    defaultValue={editing.category}
                    className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {catLabel(c)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="text-sm">
                תגיות (מופרדות בפסיקים)
                <input
                  name="tags"
                  defaultValue={(editing.tags ?? []).join(", ")}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  placeholder="לדוגמה: אוכל, משפחה"
                />
              </label>

              <label className="text-sm">
                הערות
                <textarea
                  name="notes"
                  defaultValue={editing.notes ?? ""}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100"
                  rows={3}
                />
              </label>

              <div className="rounded-xl border bg-zinc-50 p-3 dark:border-zinc-800/60 dark:bg-zinc-900/30">
                <div className="text-sm font-medium">קבלה</div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setReceiptUploading(true);
                      setReceiptError(null);
                      try {
                        const supabase = createSupabaseBrowserClient();
                        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
                        const path = `${props.userId}/${crypto.randomUUID()}.${ext}`;
                        const { error } = await supabase.storage.from("receipts").upload(path, file, {
                          upsert: true
                        });
                        if (error) throw error;
                        setReceiptPath(path);
                      } catch (err: any) {
                        setReceiptError(err?.message ?? "Upload failed");
                      } finally {
                        setReceiptUploading(false);
                      }
                    }}
                  />

                  {receiptUploading ? <span className="text-xs text-zinc-600 dark:text-zinc-300">מעלה...</span> : null}
                  {receiptError ? <span className="text-xs text-rose-700">{receiptError}</span> : null}

                  {receiptPath ? (
                    <button
                      type="button"
                      className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
                      onClick={async () => {
                        const supabase = createSupabaseBrowserClient();
                        const { data, error } = await supabase.storage.from("receipts").createSignedUrl(receiptPath, 60);
                        if (error || !data?.signedUrl) return;
                        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
                      }}
                    >
                      פתח קבלה
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">לא הועלתה קבלה עדיין</span>
                  )}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="rounded-xl border bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
                  onClick={() => setEditing(null)}
                >
                  ביטול
                </button>
                <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
                  שמור
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

