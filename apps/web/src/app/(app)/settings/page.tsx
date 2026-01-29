import { Card } from "@tremor/react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TelegramSyncBox } from "./TelegramSyncBox";
import { updateSalaryAction } from "./actions";

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("monthly_salary, telegram_chat_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const salary = Number(profile?.monthly_salary ?? 0);
  const isLinked = Boolean(profile?.telegram_chat_id);

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-2xl dark:border-zinc-800/60 dark:bg-zinc-950/60">
        <h1 className="text-lg font-semibold">הגדרות</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">ניהול שכר חודשי וחיבור Telegram.</p>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-6 dark:border-zinc-800/60 dark:bg-zinc-950/60">
          <h2 className="text-lg font-semibold">שכר חודשי</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            משמש לחישוב יתרה (שכר + הכנסות - הוצאות).
          </p>

          <form
            action={async (formData) => {
              "use server";
              await updateSalaryAction(formData);
            }}
            className="mt-4 flex items-end gap-3"
          >
            <label className="flex flex-1 flex-col gap-1 text-sm">
              סכום
              <input
                name="monthly_salary"
                defaultValue={salary}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-200"
                inputMode="decimal"
              />
            </label>
            <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
              שמור
            </button>
          </form>
        </div>

        <TelegramSyncBox isLinked={isLinked} />
      </div>
    </div>
  );
}

