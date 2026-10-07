"use client";

import type { MouseEvent } from "react";

export function ConfirmSubmit({ children, message, className, disabled = false }: { children: React.ReactNode; message: string; className: string; disabled?: boolean }) {
  function confirm(event: MouseEvent<HTMLButtonElement>) {
    if (!window.confirm(message)) event.preventDefault();
  }
  return <button type="submit" className={className} onClick={confirm} disabled={disabled}>{children}</button>;
}
