import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen">
      <AppHeader email={user?.email} />

      <main className="mx-auto max-w-6xl px-4 py-5 md:px-6 md:py-8">
        <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80 md:p-6">
          <div className="flex items-center justify-end">
            <form
              action={async () => {
                "use server";
                const supabase = await createSupabaseServerClient();
                await supabase.auth.signOut();
                redirect("/");
              }}
            >
              <button
                className="rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700/60 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                type="submit"
              >
                התנתקות
              </button>
            </form>
          </div>

          <div className="mt-4">{children}</div>
        </div>
      </main>
    </div>
  );
}

