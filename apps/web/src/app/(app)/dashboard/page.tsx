import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/finance/types";
import { DashboardView } from "./DashboardView";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

function daysInMonth(year: number, monthIndex0: number) {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}

function countMonthsOverlappingRange(rangeStart: Date, rangeEndExclusive: Date) {
  const s = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const end = new Date(rangeEndExclusive);
  let count = 0;
  const cur = new Date(s);
  while (cur < end) {
    count += 1;
    cur.setMonth(cur.getMonth() + 1);
  }
  return count;
}

type RecurringAgg = {
  totals: { expenses: number; income: number };
  expenseByCategory: Map<string, number>;
  byDay: Map<string, { expenses: number; income: number }>;
  byMonth: Map<string, { expenses: number; income: number }>;
};

function aggregateRecurringForRange(
  rules: any[],
  rangeStart: Date,
  rangeEndExclusive: Date
): RecurringAgg {
  const expenseByCategory = new Map<string, number>();
  const byDay = new Map<string, { expenses: number; income: number }>();
  const byMonth = new Map<string, { expenses: number; income: number }>();
  const totals = { expenses: 0, income: 0 };

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const dateKeyLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const monthKeyLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;

  const addToDay = (dateKey: string, type: "expense" | "income", amount: number) => {
    const cur = byDay.get(dateKey) ?? { expenses: 0, income: 0 };
    if (type === "expense") cur.expenses += amount;
    else cur.income += amount;
    byDay.set(dateKey, cur);
  };

  const addToMonth = (monthKey: string, type: "expense" | "income", amount: number) => {
    const cur = byMonth.get(monthKey) ?? { expenses: 0, income: 0 };
    if (type === "expense") cur.expenses += amount;
    else cur.income += amount;
    byMonth.set(monthKey, cur);
  };

  const addExpenseCategory = (category: string, amount: number) => {
    expenseByCategory.set(category, (expenseByCategory.get(category) ?? 0) + amount);
  };

  // Normalize to local day boundaries:
  // - start: floor to start-of-day
  // - end: ceil to start-of-next-day if there's any time component
  // This avoids dropping "today" when end is set to "now".
  const start = new Date(rangeStart);
  start.setHours(0, 0, 0, 0);
  const endRaw = new Date(rangeEndExclusive);
  const end = new Date(endRaw);
  end.setHours(0, 0, 0, 0);
  if (endRaw.getTime() > end.getTime()) {
    end.setDate(end.getDate() + 1);
  }

  const countWeekdayInRange = (s: Date, eInclusive: Date, day: number) => {
    const s0 = new Date(s);
    s0.setHours(0, 0, 0, 0);
    const e0 = new Date(eInclusive);
    e0.setHours(0, 0, 0, 0);
    if (e0 < s0) return 0;
    const offset = (day - s0.getDay() + 7) % 7;
    const first = new Date(s0);
    first.setDate(s0.getDate() + offset);
    if (first > e0) return 0;
    const diffDays = Math.floor((e0.getTime() - first.getTime()) / (24 * 60 * 60 * 1000));
    return 1 + Math.floor(diffDays / 7);
  };

  const endInclusive = new Date(end.getTime() - 1);

  for (const r of rules) {
    if (!r || !r.active) continue;
    const amount = Number(r.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const type = r.type === "income" ? ("income" as const) : ("expense" as const);
    const category = typeof r.category === "string" ? r.category : "Other";
    const ruleStart = r.start_date ? new Date(r.start_date) : null;
    if (ruleStart && ruleStart > endInclusive) continue;

    if (r.frequency === "monthly") {
      const domRaw = typeof r.day_of_month === "number" ? r.day_of_month : 1;
      const dom = Math.min(Math.max(1, domRaw), 31);

      // iterate months in range; count ONCE per month that overlaps the range.
      // If the rule was created mid‑month, still count it for that month (planned recurring).
      const m = new Date(startOfMonth(start));
      while (m < end) {
        const y = m.getFullYear();
        const mo = m.getMonth();
        const monthStart = new Date(y, mo, 1);
        const monthEnd = new Date(y, mo, daysInMonth(y, mo), 23, 59, 59, 999);
        // skip months outside selected range
        if (monthEnd < start || monthStart >= end) {
          m.setMonth(m.getMonth() + 1);
          continue;
        }
        // skip months before rule starts
        if (ruleStart && ruleStart > monthEnd) {
          m.setMonth(m.getMonth() + 1);
          continue;
        }

        // Pick a representative day for the chart (day_of_month clamped).
        // If ruleStart is within the same month and after the scheduled day, place it on ruleStart day.
        const scheduledDay = Math.min(dom, daysInMonth(y, mo));
        let occ = new Date(y, mo, scheduledDay);
        if (ruleStart && ruleStart.getFullYear() === y && ruleStart.getMonth() === mo) {
          const rsDay = new Date(y, mo, ruleStart.getDate());
          if (occ < rsDay) occ = rsDay;
        }
        // Clamp to the selected range so it always appears in chart
        if (occ < start) occ = new Date(start);
        if (occ >= end) occ = new Date(endInclusive);

        const key = dateKeyLocal(occ);
        addToDay(key, type, amount);
        addToMonth(monthKeyLocal(occ), type, amount);
        if (type === "expense") addExpenseCategory(category, amount);
        if (type === "expense") totals.expenses += amount;
        else totals.income += amount;

        m.setMonth(m.getMonth() + 1);
      }
    } else if (r.frequency === "weekly") {
      if (typeof r.day_of_week !== "number") continue;
      const dow = r.day_of_week;

      // Find first occurrence date >= start
      const s0 = new Date(start);
      const offset = (dow - s0.getDay() + 7) % 7;
      const first = new Date(s0);
      first.setDate(s0.getDate() + offset);

      // If ruleStart is after first, shift forward to next matching weekday on/after ruleStart
      let cursor = first;
      if (ruleStart && cursor < ruleStart) {
        const rs = new Date(ruleStart);
        rs.setHours(0, 0, 0, 0);
        const off2 = (dow - rs.getDay() + 7) % 7;
        cursor = new Date(rs);
        cursor.setDate(rs.getDate() + off2);
      }

      // Safety: also compute occurrences count for totals quickly if needed
      // (we still loop dates to fill byDay)
      const _occ = countWeekdayInRange(cursor, endInclusive, dow);
      if (_occ <= 0) continue;

      while (cursor < end) {
        if (cursor >= start) {
          const key = dateKeyLocal(cursor);
          addToDay(key, type, amount);
          addToMonth(monthKeyLocal(cursor), type, amount);
          if (type === "expense") addExpenseCategory(category, amount);
          if (type === "expense") totals.expenses += amount;
          else totals.income += amount;
        }
        cursor = new Date(cursor);
        cursor.setDate(cursor.getDate() + 7);
      }
    }
  }

  return { totals, expenseByCategory, byDay, byMonth };
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ range?: string; from?: string; to?: string; toNow?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const range = sp.range === "prev_month" ? "month" : (sp.range ?? "month");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const now = new Date();
  const thisMonth = startOfMonth(now);

  const parseMonth = (s?: string) => {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})$/.exec(s);
    if (!m) return null;
    const y = Number(m[1]);
    const mo1 = Number(m[2]);
    if (!Number.isFinite(y) || !Number.isFinite(mo1) || mo1 < 1 || mo1 > 12) return null;
    return new Date(y, mo1 - 1, 1);
  };

  let curStart: Date;
  let curEnd: Date;

  if (range === "custom") {
    const from = parseMonth(sp.from) ?? thisMonth;
    const toNow = sp.toNow === "1";
    if (toNow) {
      curStart = from;
      curEnd = now;
    } else {
      const to = parseMonth(sp.to) ?? thisMonth;
      curStart = from;
      curEnd = addMonths(to, 1);
    }
    if (curEnd <= curStart) {
      curEnd = addMonths(curStart, 1);
    }
  } else {
    curStart =
      range === "3m"
          ? addMonths(thisMonth, -2)
          : range === "year"
            ? addMonths(thisMonth, -11) // rolling 12 months (incl. current)
            : thisMonth;

    curEnd =
      // For predefined ranges, end at "now" (to-date), not end-of-month/year.
      // This prevents counting future planned items and keeps 3m/year intuitive.
      now;
  }

  // Previous comparison period (same length immediately before curStart)
  const prevStart =
    range === "custom"
      ? new Date(curStart.getTime() - (curEnd.getTime() - curStart.getTime()))
      : new Date(curStart.getTime() - (curEnd.getTime() - curStart.getTime()));

  const curStartIso = curStart.toISOString();
  const prevStartIso = prevStart.toISOString();
  const curEndIso = curEnd.toISOString();

  const [{ data: profile }, { data: txs }, { data: recurring }] = await Promise.all([
    supabase.from("profiles").select("monthly_salary, telegram_chat_id").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("transactions")
      .select("id, user_id, amount, description, category, type, notes, tags, receipt_path, created_at")
      .eq("user_id", user.id)
      .gte("created_at", prevStartIso)
      .lt("created_at", curEndIso)
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
  const salaryCur = monthlySalary > 0 ? monthlySalary * countMonthsOverlappingRange(curStart, curEnd) : 0;
  const salaryPrev = monthlySalary > 0 ? monthlySalary * countMonthsOverlappingRange(prevStart, curStart) : 0;
  const all = (txs ?? []).map((t) => ({
    ...t,
    amount: Number(t.amount)
  }));

  const curItems = all.filter((t) => t.created_at >= curStartIso && t.created_at < curEndIso);
  const prevItems = all.filter((t) => t.created_at >= prevStartIso && t.created_at < curStartIso);

  const curIncome = curItems.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const curExpenses = curItems.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const curBalance = salaryCur + curIncome - curExpenses;

  const prevIncome = prevItems.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const prevExpenses = prevItems.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const prevBalance = salaryPrev + prevIncome - prevExpenses;

  const activeRecurring = (recurring ?? []).filter((r: any) => Boolean(r.active));

  // Expand recurring rules into the selected range and also the previous comparison range.
  const recurringCur = aggregateRecurringForRange(activeRecurring, curStart, curEnd);
  const recurringPrev = aggregateRecurringForRange(activeRecurring, prevStart, curStart);

  // Salary (from Settings) is used for balance; also show it explicitly as a "fixed income" helper.
  // We treat it as a monthly amount counted once per month within the selected range.
  const salaryPlannedIncomeCur = salaryCur;

  const curIncomeProjected = curIncome + recurringCur.totals.income;
  const curExpensesProjected = curExpenses + recurringCur.totals.expenses;
  const curBalanceProjected = salaryCur + curIncomeProjected - curExpensesProjected;

  const delta = (cur: number, prev: number) => {
    if (prev === 0) return cur === 0 ? 0 : null;
    return (cur - prev) / Math.abs(prev);
  };

  // Category chart: show actual expenses by category, plus a separate "Recurring" slice.
  const byCategory = [
    ...CATEGORIES.map((c) => ({
      category: c,
      total: curItems.filter((t) => t.type === "expense" && t.category === c).reduce((s, t) => s + t.amount, 0)
    })),
    { category: "Recurring", total: recurringCur.totals.expenses }
  ].filter((x) => x.total > 0);

  const byDay = (() => {
    const map = new Map<string, { date: string; expenses: number; income: number }>();
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const dateKeyLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    for (const t of curItems) {
      const date = dateKeyLocal(new Date(t.created_at));
      const cur = map.get(date) ?? { date, expenses: 0, income: 0 };
      if (t.type === "expense") cur.expenses += t.amount;
      else cur.income += t.amount;
      map.set(date, cur);
    }
    for (const [date, v] of recurringCur.byDay.entries()) {
      const cur = map.get(date) ?? { date, expenses: 0, income: 0 };
      cur.expenses += v.expenses;
      cur.income += v.income;
      map.set(date, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const byMonth = (() => {
    const pad2 = (n: number) => String(n).padStart(2, "0");
    const monthKeyLocal = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
    const map = new Map<string, { month: string; expenses: number; income: number }>();

    // Initialize months for the range so chart stays consistent.
    const m = new Date(curStart.getFullYear(), curStart.getMonth(), 1);
    const end = new Date(curEnd);
    while (m < end) {
      const k = monthKeyLocal(m);
      map.set(k, { month: k, expenses: 0, income: 0 });
      m.setMonth(m.getMonth() + 1);
    }

    // Actual transactions
    for (const t of curItems) {
      const k = monthKeyLocal(new Date(t.created_at));
      const cur = map.get(k) ?? { month: k, expenses: 0, income: 0 };
      if (t.type === "expense") cur.expenses += t.amount;
      else cur.income += t.amount;
      map.set(k, cur);
    }

    // Recurring (expanded)
    for (const [k, v] of recurringCur.byMonth.entries()) {
      const cur = map.get(k) ?? { month: k, expenses: 0, income: 0 };
      cur.expenses += v.expenses;
      cur.income += v.income;
      map.set(k, cur);
    }

    // Salary from settings: add per overlapping month
    if (monthlySalary > 0) {
      const m2 = new Date(curStart.getFullYear(), curStart.getMonth(), 1);
      while (m2 < end) {
        const k = monthKeyLocal(m2);
        const cur = map.get(k) ?? { month: k, expenses: 0, income: 0 };
        cur.income += monthlySalary;
        map.set(k, cur);
        m2.setMonth(m2.getMonth() + 1);
      }
    }

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  })();

  const prevIncomeProjected = prevIncome + recurringPrev.totals.income;
  const prevExpensesProjected = prevExpenses + recurringPrev.totals.expenses;
  const prevBalanceProjected = salaryPrev + prevIncomeProjected - prevExpensesProjected;

  return (
    <DashboardView
      monthLabel={
        range === "custom"
          ? (() => {
              const fmt = (d: Date) => d.toLocaleDateString("he-IL", { year: "numeric", month: "long" });
              const toNow = sp.toNow === "1";
              if (toNow) return `מ־${fmt(curStart)} עד היום`;
              const endMonth = new Date(curEnd);
              endMonth.setDate(1);
              endMonth.setMonth(endMonth.getMonth() - 1);
              return `מ־${fmt(curStart)} עד ${fmt(endMonth)}`;
            })()
          : range === "year"
            ? "12 חודשים אחרונים"
            : range === "3m"
              ? "3 חודשים אחרונים"
              : thisMonth.toLocaleDateString("he-IL", { year: "numeric", month: "long" })
      }
      summary={{ income: curIncomeProjected, expenses: curExpensesProjected }}
      plannedRecurring={recurringCur.totals}
      salaryPlannedIncome={salaryPlannedIncomeCur}
      kpis={[
        { label: "הכנסות", value: curIncomeProjected, delta: delta(curIncomeProjected, prevIncomeProjected) },
        { label: "הוצאות", value: curExpensesProjected, delta: delta(curExpensesProjected, prevExpensesProjected) },
        { label: "יתרה (כולל שכר)", value: curBalanceProjected, delta: delta(curBalanceProjected, prevBalanceProjected) }
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
      byMonth={byMonth}
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

