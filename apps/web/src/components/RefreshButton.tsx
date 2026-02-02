"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshButton(props: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          setPending(true);
          router.refresh();
          // Small delay so the UI shows feedback even on fast refresh.
          await new Promise((r) => setTimeout(r, 350));
        } finally {
          setPending(false);
        }
      }}
      className={[
        "rounded-full border bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50",
        "dark:border-zinc-700/60 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
        pending ? "opacity-70" : "",
        props.className ?? ""
      ].join(" ")}
      aria-label="רענון"
      title="רענון"
      disabled={pending}
    >
      {pending ? "מרענן..." : "רענון"}
    </button>
  );
}

