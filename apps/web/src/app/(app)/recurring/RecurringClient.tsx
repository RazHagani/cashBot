"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/finance/types";
import { createRecurringRuleAction, deleteRecurringRuleAction, toggleRecurringRuleAction } from "./actions";

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

function catLabel(c: string) {
  return CATEGORY_LABELS_HE[c] ?? c;
}

const DAYS_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"] as const;

export type RecurringRuleRow = {
  id: string;
  amount: number;
  description: string;
  category: string;
  type: "expense" | "income";
  frequency: "monthly" | "weekly";
  day_of_month: number | null;
  day_of_week: number | null;
  active: boolean;
  created_at: string;
};

export function RecurringClient({ rules }: { rules: RecurringRuleRow[] }) {
  const [message, setMessage] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<"monthly" | "weekly">("monthly");

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-6 dark:border-zinc-800/60 dark:bg-zinc-950/60">
        <h1 className="text-lg font-semibold">הוראות קבע</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          ניהול חיובים/הכנסות חוזרים (למשל שכירות, אינטרנט, משכורת).
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-6 dark:border-zinc-800/60 dark:bg-zinc-950/60">
        <div className="text-sm font-medium">הוספה</div>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          כרגע זה “ניהול הוראות קבע”. בשלב הבא נוסיף גם הפקה אוטומטית של טרנזקציות לפי תאריך.
        </p>

        {message ? <div className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">{message}</div> : null}

        <form
          action={async (formData) => {
            setMessage(null);
            const res = await createRecurringRuleAction(formData);
            setMessage(res.ok ? "נשמר." : res.message);
          }}
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <input
            name="description"
            placeholder="תיאור (למשל שכירות)"
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
            name="type"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200"
            defaultValue="expense"
          >
            <option value="expense">הוצאה</option>
            <option value="income">הכנסה</option>
          </select>
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
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200"
          >
            <option value="monthly">חודשי</option>
            <option value="weekly">שבועי</option>
          </select>

          {frequency === "monthly" ? (
            <select
              name="day_of_month"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200"
              defaultValue="1"
            >
              {Array.from({ length: 31 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  יום {i + 1}
                </option>
              ))}
            </select>
          ) : (
            <select
              name="day_of_week"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200"
              defaultValue="0"
            >
              {DAYS_HE.map((d, i) => (
                <option key={i} value={i}>
                  {d}
                </option>
              ))}
            </select>
          )}

          <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-black md:col-span-6">
            שמור הוראת קבע
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-6 dark:border-zinc-800/60 dark:bg-zinc-950/60">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">רשימה</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{rules.length} פריטים</div>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl border dark:border-zinc-800/60">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-right text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-300">
              <tr>
                <th className="px-3 py-2">תיאור</th>
                <th className="px-3 py-2">קטגוריה</th>
                <th className="px-3 py-2">סוג</th>
                <th className="px-3 py-2">תדירות</th>
                <th className="px-3 py-2 text-left">סכום</th>
                <th className="px-3 py-2 text-left">מצב</th>
                <th className="px-3 py-2 text-left">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-t dark:border-zinc-800/60">
                  <td className="px-3 py-2">{r.description}</td>
                  <td className="px-3 py-2">{catLabel(r.category)}</td>
                  <td className="px-3 py-2">{r.type === "expense" ? "הוצאה" : "הכנסה"}</td>
                  <td className="px-3 py-2">
                    {r.frequency === "monthly"
                      ? `חודשי (יום ${r.day_of_month ?? "?"})`
                      : `שבועי (${typeof r.day_of_week === "number" ? DAYS_HE[r.day_of_week] : "?"})`}
                  </td>
                  <td className="px-3 py-2 text-left tabular-nums">₪ {r.amount.toFixed(2)}</td>
                  <td className="px-3 py-2 text-left">
                    <span
                      className={
                        r.active
                          ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                          : "rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200"
                      }
                    >
                      {r.active ? "פעיל" : "כבוי"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-left">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
                        onClick={async () => {
                          await toggleRecurringRuleAction(r.id, !r.active);
                        }}
                      >
                        {r.active ? "כבה" : "הפעל"}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border bg-white px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-rose-300 dark:hover:bg-rose-950/30"
                        onClick={async () => {
                          await deleteRecurringRuleAction(r.id);
                        }}
                      >
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rules.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 text-center text-zinc-500 dark:text-zinc-400" colSpan={7}>
                    אין הוראות קבע עדיין.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

