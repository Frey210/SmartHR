"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export function LiveServerClock({ serverNow, timeZone }: { serverNow: number; timeZone: string }) {
  const [now, setNow] = useState(serverNow);
  const baseRef = useRef({ serverMs: serverNow, performanceMs: 0 });
  const formatters = useMemo(() => ({
    time: new Intl.DateTimeFormat("id-ID", { timeZone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }),
    date: new Intl.DateTimeFormat("id-ID", { timeZone, weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }),
  }), [timeZone]);

  useEffect(() => {
    baseRef.current = { serverMs: serverNow, performanceMs: performance.now() };
    const tick = () => setNow(baseRef.current.serverMs + performance.now() - baseRef.current.performanceMs);
    tick();
    const interval = window.setInterval(tick, 1_000);

    const started = performance.now();
    void fetch("/api/health", { cache: "no-store" }).then((response) => {
      const header = response.headers.get("date");
      if (!header) return;
      const finished = performance.now();
      baseRef.current = { serverMs: Date.parse(header) + (finished - started) / 2, performanceMs: finished };
      tick();
    }).catch(() => undefined);

    return () => window.clearInterval(interval);
  }, [serverNow]);

  return (
    <div className="min-w-fit sm:text-right" aria-label="Jam server WITA" role="timer">
      <p className="number font-[family-name:var(--font-heading)] text-4xl font-bold leading-none tracking-[-0.045em] text-white sm:text-5xl">
        {formatters.time.format(now).replaceAll(".", ":")}
      </p>
      <p className="number mt-2 text-sm font-semibold capitalize text-blue-100">
        {formatters.date.format(now).replaceAll("/", "-")} <span aria-hidden="true">·</span> WITA
      </p>
    </div>
  );
}
