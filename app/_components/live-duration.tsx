"use client";

import { useEffect, useRef, useState } from "react";
import { formatElapsedDuration } from "@/lib/attendance";

export function LiveDuration({ startedAt, serverNow, baseMinutes = 0 }: { startedAt: number; serverNow: number; baseMinutes?: number }) {
  const [now, setNow] = useState(serverNow);
  const origin = useRef({ serverNow, performanceMs: 0 });

  useEffect(() => {
    origin.current = { serverNow, performanceMs: performance.now() };
    // ponytail: one timer per visible active row; share a clock only if this table grows large.
    const interval = window.setInterval(() => {
      setNow(origin.current.serverNow + performance.now() - origin.current.performanceMs);
    }, 1_000);
    return () => window.clearInterval(interval);
  }, [serverNow]);

  const duration = formatElapsedDuration(startedAt, now, baseMinutes);
  return <span className="number inline-block min-w-[8ch] tabular-nums" role="timer" aria-label={`Durasi berjalan ${duration}`}>
    {duration}
  </span>;
}
