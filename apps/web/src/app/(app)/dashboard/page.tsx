import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/finance/types";
import { DashboardView } from "./DashboardView";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const range = sp.range ?? "month";
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date();
  const thisMonth = startOfMonth(now);

  const curStart =
    range === "prev_month"
      ? addMonths(thisMonth, -1)
      : range === "3m"
        ? addMonths(thisMonth, -2)
        : range === "year"
          ? new Date(now.getFullYear(), 0, 1)
          : thisMonth;

  const nextStart =
    range === "year"
      ? new Date(now.getFullYear() + 1, 0, 1)
      : addMonths(thisMonth, 1);

  // Previous comparison period (same length immediately before curStart)
  const prevStart =
    range === "year"
      ? new Date(now.getFullYear() - 1, 0, 1)
      : range === "3m"
        ? addMonths(thisMonth, -5)
        : addMonths(thisMonth, -1);

  const curStartIso = curStart.toISOString();
  const prevStartIso = prevStart.toISOString();
  const nextStartIso = nextStart.toISOString();

  const [{ data: profile }, { data: txs }, { data: recurring }] = await Promise.all([
    supabase.from("profiles").select("monthly_salary, telegram_chat_id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("transactions")
      .select("id, user_id, amount, description, category, type, notes, tags, receipt_path, created_at")
      .eq("user_id", user.id)
      .gte("created_at", prevStartIso)
      .lt("created_at", nextStartIso)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase
      .from("recurring_rules")
      .select("id, amount, description, category, type, frequency, day_of_month, day_of_week, active, start_date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200)
  ]);

  const monthlySalary = Number(profile?.monthly_salary ?? 0);
  const all = (txs ?? []).map((t) => ({
    ...t,
    amount: Number(t.amount)
  }));

  const curItems = all.filter((t) => t.created_at >= curStartIso && t.created_at < nextStartIso);
  const prevItems = all.filter((t) => t.created_at >= prevStartIso && t.created_at < curStartIso);

  const curIncome = curItems.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const curExpenses = curItems.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const curBalance = monthlySalary + curIncome - curExpenses;

  const prevIncome = prevItems.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevExpenses = prevItems.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const prevBalance = monthlySalary + prevIncome - prevExpenses;

  // Include active recurring rules in current month totals (planned spend/income).
  const monthEnd = new Date(nextStart.getTime() - 1);
  const monthStartDate = new Date(curStart);

  const activeRecurring = (recurring ?? []).filter((r: any) => Boolean(r.active));

  const countWeekdayInRange = (start: Date, end: Date, day: number) => {
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(0, 0, 0, 0);
    if (e < s) return 0;
    const offset = (day - s.getDay() + 7) % 7;
    const first = new Date(s);
    first.setDate(s.getDate() + offset);
    if (first > e) return 0;
    const diffDays = Math.floor((e.getTime() - first.getTime()) / (24 * 60 * 60 * 1000));
    return 1 + Math.floor(diffDays / 7);
  };

  // For "monthly" recurring rules, we treat them as a fixed monthly cost:
  // if the rule is active and started on/before this month end, count it once for the month.
  const countsMonthlyForMonth = (startDate: Date | null) => {
    if (!startDate) return true;
    return startDate <= monthEnd;
  };

  const planned = activeRecurring.reduce(
    (acc: { expenses: number; income: number }, r: any) => {
      const amount = Number(r.amount);
      if (!Number.isFinite(amount) || amount <= 0) return acc;

      const start = r.start_date ? new Date(r.start_date) : null;
      if (start && start > monthEnd) return acc;

      let occurrences = 0;
      if (r.frequency === "monthly") {
        occurrences = countsMonthlyForMonth(start) ? 1 : 0;
      } else if (r.frequency === "weekly") {
        if (typeof r.day_of_week === "number") {
          // Weekly is counted for the full month once the rule is active.
          occurrences = countWeekdayInRange(monthStartDate, monthEnd, r.day_of_week);
        }
      }

      const total = occurrences * amount;
      if (r.type === "expense") acc.expenses += total;
      else if (r.type === "income") acc.income += total;
      return acc;
    },
    { expenses: 0, income: 0 }
  );

  const curIncomeProjected = curIncome + planned.income;
  const curExpensesProjected = curExpenses + planned.expenses;
  const curBalanceProjected = monthlySalary + curIncomeProjected - curExpensesProjected;

  const delta = (cur: number, prev: number) => {
    if (prev === 0) return cur === 0 ? 0 : null;
    return (cur - prev) / Math.abs(prev);
  };

  const byCategory = CATEGORIES.map((c) => ({
    category: c,
    total: curItems.filter((t) => t.type === "expense" && t.category === c).reduce((s, t) => s + t.amount, 0)
  })).filter((x) => x.total > 0);

  const byDay = (() => {
    const map = new Map<string, { date: string; expenses: number; income: number }>();
    for (const t of curItems) {
      const date = new Date(t.created_at).toISOString().slice(0, 10);
      const cur = map.get(date) ?? { date, expenses: 0, income: 0 };
      if (t.type === "expense") cur.expenses += t.amount;
      else cur.income += t.amount;
      map.set(date, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  return (
    <DashboardView
      monthLabel={
        range === "year"
          ? `${now.getFullYear()} (שנתי)`
          : range === "3m"
            ? "3 חודשים אחרונים"
            : range === "prev_month"
              ? addMonths(thisMonth, -1).toLocaleDateString("he-IL", { year: "numeric", month: "long" })
              : thisMonth.toLocaleDateString("he-IL", { year: "numeric", month: "long" })
      }
      summary={{ income: curIncomeProjected, expenses: curExpensesProjected }}
      plannedRecurring={planned}
      kpis={[
        { label: "הכנסות החודש", value: curIncomeProjected, delta: delta(curIncomeProjected, prevIncome) },
        { label: "הוצאות החודש", value: curExpensesProjected, delta: delta(curExpensesProjected, prevExpenses) },
        { label: "יתרה (כולל שכר)", value: curBalanceProjected, delta: delta(curBalanceProjected, prevBalance) }
      ]}
      isTelegramLinked={Boolean(profile?.telegram_chat_id)}
      recurringRules={activeRecurring.slice(0, 5).map((r: any) => ({
        id: r.id,
        amount: Number(r.amount),
        description: r.description,
        category: r.category,
        type: r.type,
        frequency: r.frequency,
        day_of_month: r.day_of_month,
        day_of_week: r.day_of_week,
        active: Boolean(r.active)
      }))}
      byCategory={byCategory}
      byDay={byDay}
      userId={user.id}
      items={curItems.map((t) => ({
        id: t.id,
        description: t.description,
        category: t.category,
        type: t.type,
        amount: t.amount,
        notes: (t as any).notes ?? null,
        tags: (t as any).tags ?? [],
        receipt_path: (t as any).receipt_path ?? null,
        created_at: t.created_at
      }))}
    />
  );
}

