"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MAX_VISIT_DURATION_MS } from "@/lib/usage";

export function UsageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const activityType = pathname === "/wordle" ? "WORDLE" : pathname === "/word-search" ? "WORD_SEARCH" : null;
    if (!activityType) return;
    const id = crypto.randomUUID();
    let durationMs = 0;
    let visibleSince: number | null = document.visibilityState === "visible" ? performance.now() : null;

    const send = () => {
      const now = performance.now();
      if (visibleSince !== null) durationMs = Math.min(MAX_VISIT_DURATION_MS, durationMs + now - visibleSince);
      visibleSince = document.visibilityState === "visible" ? now : null;
      void fetch("/api/usage", {
        method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
        body: JSON.stringify({ id, activityType, durationMs: Math.floor(durationMs) }),
      }).catch(() => { /* Usage collection must not interrupt the builder. */ });
    };
    const hide = () => { send(); visibleSince = null; };
    // Deferring also avoids duplicate visits during React's development effect check.
    const initial = window.setTimeout(send, 0);
    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") send();
    }, 15_000);
    document.addEventListener("visibilitychange", send);
    window.addEventListener("pagehide", hide);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", send);
      window.removeEventListener("pagehide", hide);
      // Ignore the immediate development-only setup/cleanup cycle.
      if (durationMs > 0 || (visibleSince !== null && performance.now() - visibleSince >= 100)) send();
    };
  }, [pathname]);

  return null;
}
