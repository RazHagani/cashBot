import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RecurringClient, type RecurringRuleRow } from "./RecurringClient";

export default async function RecurringPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("recurring_rules")
    .select("id, amount, description, category, type, frequency, day_of_month, day_of_week, active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rules: RecurringRuleRow[] = (data ?? []).map((r: any) => ({
    id: r.id,
    amount: Number(r.amount),
    description: r.description,
    category: r.category,
    type: r.type,
    frequency: r.frequency,
    day_of_month: r.day_of_month,
    day_of_week: r.day_of_week,
    active: Boolean(r.active),
    created_at: r.created_at
  }));

  return <RecurringClient rules={rules} />;
}

