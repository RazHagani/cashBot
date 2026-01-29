"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction } from "./actions";

type FormState = { ok: true } | { ok: false; message: string } | null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="mt-2 inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-zinc-900/10 hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20 disabled:opacity-60 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:focus-visible:ring-white/20"
      type="submit"
      disabled={pending}
    >
      {pending ? "מתחבר..." : "התחבר"}
    </button>
  );
}

function inputClassName() {
  return "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 ps-10 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/5 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-zinc-200 dark:focus:ring-white/10";
}

export function LoginForm(props: { oauthError?: { error?: string; details?: string }; checkEmail?: boolean }) {
  const [state, action] = useActionState<FormState, FormData>(loginAction as any, null);

  return (
    <div className="flex flex-col gap-4">
      {props.checkEmail ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          שלחנו לך אימייל לאימות. אחרי אישור—תחזור לכאן ותתחבר.
        </div>
      ) : null}

      {props.oauthError?.error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          שגיאה: {props.oauthError.error}
          {props.oauthError.details ? (
            <div className="mt-1 text-xs opacity-80">{props.oauthError.details}</div>
          ) : null}
        </div>
      ) : null}

      {state && state.ok === false ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-100">
          {state.message}
        </div>
      ) : null}

      <a
        href="/auth/google"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 shadow-sm shadow-zinc-900/5 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/10 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/60 dark:focus-visible:ring-white/10"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#FFC107"
            d="M43.611 20.083H42V20H24v8h11.303C33.688 32.657 29.27 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.774 6.053 29.621 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
          />
          <path
            fill="#FF3D00"
            d="M6.306 14.691l6.571 4.819C14.655 16.108 18.97 12 24 12c3.059 0 5.842 1.154 7.957 3.043l5.657-5.657C34.774 6.053 29.621 4 24 4c-7.682 0-14.35 4.327-17.694 10.691z"
          />
          <path
            fill="#4CAF50"
            d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.141 35.091 26.715 36 24 36c-5.248 0-9.654-3.326-11.282-7.946l-6.52 5.02C9.505 39.556 16.227 44 24 44z"
          />
          <path
            fill="#1976D2"
            d="M43.611 20.083H42V20H24v8h11.303c-.793 2.207-2.255 4.084-4.084 5.57l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
          />
        </svg>
        התחבר עם Google
      </a>

      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800/60" />
        או
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800/60" />
      </div>

      <form action={action} className="flex flex-col gap-3">
        <label className="text-sm text-zinc-700 dark:text-zinc-200">
          אימייל
          <div className="relative mt-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6h16v12H4z" />
              <path d="m4 7 8 6 8-6" />
            </svg>
            <input
              name="email"
              type="email"
              required
              className={inputClassName()}
              autoComplete="email"
              placeholder="name@email.com"
            />
          </div>
        </label>
        <label className="text-sm text-zinc-700 dark:text-zinc-200">
          סיסמה
          <div className="relative mt-1">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <path d="M6 11h12v10H6z" />
            </svg>
            <input
              name="password"
              type="password"
              required
              className={inputClassName()}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
        </label>

        <SubmitButton />
      </form>
    </div>
  );
}

