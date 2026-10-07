"use client";

import { useEffect, useRef, useState } from "react";

const seenKey = "mtc-attendance-splash-seen";

export function AppSplash() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    if (!standalone) {
      const removeTimer = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(removeTimer);
    }

    if (sessionStorage.getItem(seenKey)) {
      const removeTimer = window.setTimeout(() => setVisible(false), 0);
      return () => window.clearTimeout(removeTimer);
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (videoRef.current) videoRef.current.playbackRate = reduceMotion ? 1 : 4;
    if (reduceMotion) videoRef.current?.pause();

    const closeTimer = window.setTimeout(() => {
      sessionStorage.setItem(seenKey, "1");
      setClosing(true);
    }, reduceMotion ? 350 : 2300);
    const removeTimer = window.setTimeout(() => setVisible(false), reduceMotion ? 500 : 2550);
    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return <div className={`app-splash ${closing ? "app-splash--closing" : ""}`} aria-hidden="true">
    <video ref={videoRef} autoPlay muted playsInline preload="auto">
      <source src="/splash_screen.mp4" type="video/mp4" />
    </video>
  </div>;
}
