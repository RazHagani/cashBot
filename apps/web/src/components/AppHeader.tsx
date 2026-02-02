"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { ThemeToggle } from "./ThemeToggle";
import { RefreshButton } from "./RefreshButton";

function NavLink(props: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === props.href || pathname.startsWith(props.href + "/");

  return (
    <Link
      href={props.href}
      className={clsx(
        "rounded-full px-3 py-1.5 text-sm font-medium transition",
        active
          ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
      )}
      aria-current={active ? "page" : undefined}
    >
      {props.children}
    </Link>
  );
}

export function AppHeader(props: { email?: string | null }) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/60 bg-white/70 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-3 md:px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white shadow-sm">
              cb
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold dark:text-zinc-100">cashBot</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Personal finance tracker</div>
            </div>
          </Link>
        </div>

        <nav
          className={[
            "flex items-center gap-1.5",
            "overflow-x-auto whitespace-nowrap pb-1",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "md:pb-0"
          ].join(" ")}
        >
          <NavLink href="/dashboard">דשבורד</NavLink>
          <NavLink href="/recurring">הוראות קבע</NavLink>
          <NavLink href="/settings">הגדרות</NavLink>
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border bg-white px-3 py-1.5 text-xs text-zinc-600 dark:border-zinc-700/60 dark:bg-zinc-900 dark:text-zinc-200 md:block">
            {props.email ?? "מחובר"}
          </div>
          <RefreshButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

