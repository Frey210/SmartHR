export type AttendanceReportSession = {
  employeeId: string;
  businessDate: string;
  status: string;
  durationMinutes: number | null;
  clockInAt: Date;
  clockOutAt: Date | null;
  employee: { name: string; username: string; position: string };
};

export function employeeAttendanceStats(sessions: AttendanceReportSession[]) {
  const grouped = new Map<string, {
    employeeId: string;
    name: string;
    username: string;
    position: string;
    workDates: Set<string>;
    sessionCount: number;
    completedSessions: number;
    incompleteSessions: number;
    totalMinutes: number;
    firstClockInAt: Date;
    lastClockOutAt: Date | null;
  }>();

  for (const session of sessions) {
    const current = grouped.get(session.employeeId) ?? {
      employeeId: session.employeeId,
      name: session.employee.name,
      username: session.employee.username,
      position: session.employee.position,
      workDates: new Set<string>(),
      sessionCount: 0,
      completedSessions: 0,
      incompleteSessions: 0,
      totalMinutes: 0,
      firstClockInAt: session.clockInAt,
      lastClockOutAt: null,
    };
    current.sessionCount += 1;
    current.totalMinutes += session.durationMinutes ?? 0;
    if (session.durationMinutes === null) current.incompleteSessions += 1;
    else {
      current.completedSessions += 1;
      current.workDates.add(session.businessDate);
    }
    if (session.clockInAt < current.firstClockInAt) current.firstClockInAt = session.clockInAt;
    if (session.clockOutAt && (!current.lastClockOutAt || session.clockOutAt > current.lastClockOutAt)) current.lastClockOutAt = session.clockOutAt;
    grouped.set(session.employeeId, current);
  }

  return [...grouped.values()].map(({ workDates, ...employee }) => ({
    ...employee,
    workDays: workDates.size,
    averageMinutesPerDay: workDates.size ? Math.round(employee.totalMinutes / workDates.size) : 0,
  })).sort((a, b) => a.name.localeCompare(b.name, "id"));
}
