"use client";

export function SignupForm() {
  return (
    <div className="flex flex-col gap-4">
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
        המשך עם Google
      </a>

      <div className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
        ההרשמה באפליקציה זמינה באמצעות Google בלבד. אם זו פעם ראשונה שלך—המערכת תיצור משתמש אוטומטית.
      </div>
    </div>
  );
}

