"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

/**
 * Simple presence/heartbeat:
 * - upsert into presence_current (last_seen)
 * - insert into presence_events (history)
 *
 * This powers Grafana "online users now" + "online users over time".
 */
export function PresencePing() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const supabase = createSupabaseBrowserClient();
    let userId: string | null = null;
    let timer: number | null = null;
    const debug = new URLSearchParams(window.location.search).has("presenceDebug");

    async function init() {
      const { data, error } = await supabase.auth.getUser();
      if (error && debug) console.warn("[presence] getUser error", error);
      userId = data.user?.id ?? null;
      if (debug) console.log("[presence] userId", userId);
      if (!userId) return;
      await ping("init");
    }

    async function ping(_reason: string) {
      if (!userId) return;
      const now = new Date().toISOString();

      const [currentRes, eventsRes] = await Promise.all([
        supabase
          .from("presence_current")
          .upsert({ user_id: userId, last_seen: now }, { onConflict: "user_id" }),
        supabase.from("presence_events").insert({ user_id: userId, seen_at: now })
      ]);

      if (debug) {
        if (currentRes.error) console.warn("[presence] presence_current error", currentRes.error);
        if (eventsRes.error) console.warn("[presence] presence_events error", eventsRes.error);
        if (!currentRes.error && !eventsRes.error) console.log("[presence] ping ok", _reason, now);
      }
    }

    function startInterval() {
      if (timer) window.clearInterval(timer);
      // Your definition: if no heartbeat in last 30s => not "connected now".
      // So we send a heartbeat every 30 seconds.
      timer = window.setInterval(() => void ping("interval"), 30_000);
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void ping("visible");
      }
    }

    function onFocus() {
      void ping("focus");
    }

    void init().then(() => {
      startInterval();
      document.addEventListener("visibilitychange", onVisibilityChange);
      window.addEventListener("focus", onFocus);
    });

    return () => {
      if (timer) window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
}

