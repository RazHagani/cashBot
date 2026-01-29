"use client";

import { useState } from "react";
import { generateTelegramSyncCodeAction, disconnectTelegramAction } from "./actions";

export function TelegramSyncBox({ isLinked }: { isLinked: boolean }) {
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white/70 p-6 dark:border-zinc-800/60 dark:bg-zinc-950/60">
      <h2 className="text-lg font-semibold">Telegram</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        {isLinked
          ? "הבוט מחובר לחשבון שלך. אפשר לנתק בכל רגע."
          : "כדי לחבר, צור קוד וסיים אותו לבוט ב־Telegram."}
      </p>

      {code ? (
        <div className="mt-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900/30">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Telegram Sync Code (תוקף 10 דקות)</div>
          <div className="mt-1 font-mono text-2xl tracking-wider">{code}</div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            שלח את הקוד לבוט. לאחר קישור, הודעות כמו “Lunch 50” יישמרו כטרנזקציות.
          </div>
        </div>
      ) : null}

      {status ? (
        <p className="mt-3 text-sm text-zinc-700 dark:text-zinc-200">{status}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          onClick={async () => {
            setStatus(null);
            const res = await generateTelegramSyncCodeAction();
            if (res.ok) {
              setCode(res.code);
              setStatus("נוצר קוד. שלח אותו לבוט.");
            } else {
              setStatus(res.message);
            }
          }}
          type="button"
        >
          צור קוד סנכרון
        </button>
        <button
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800/60 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
          onClick={async () => {
            setStatus(null);
            const res = await disconnectTelegramAction();
            if (res.ok) {
              setCode(null);
              setStatus("Telegram נותק.");
            } else {
              setStatus(res.message);
            }
          }}
          type="button"
          disabled={!isLinked}
        >
          נתק Telegram
        </button>
      </div>
    </div>
  );
}

