import "server-only";

import { db } from "@/lib/db";
import { businessDate } from "@/lib/date";

export async function expireAttendanceSessions(timezone: string, now = new Date()) {
  return db.attendanceSession.updateMany({
    where: { status: "OPEN", businessDate: { lt: businessDate(timezone, now) } },
    data: { status: "INCOMPLETE", durationMinutes: null },
  });
}
