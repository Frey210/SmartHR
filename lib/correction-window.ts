import { businessDate } from "./date.ts";

export function isCorrectionWithinWindow(clockInAt: Date, limitDays: number | null, timezone: string, now = new Date()) {
  const ageDays = (Date.parse(businessDate(timezone, now)) - Date.parse(businessDate(timezone, clockInAt))) / 86_400_000;
  return ageDays >= 0 && (limitDays === null || ageDays <= limitDays);
}
