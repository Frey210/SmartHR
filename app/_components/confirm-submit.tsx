"use client";

import type { MouseEvent } from "react";

export function ConfirmSubmit({ children, message, className }: { children: React.ReactNode; message: string; className: string }) {
  function confirm(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }
  return <button type="submit" className={className} onClick={confirm}>{children}</button>;
}
