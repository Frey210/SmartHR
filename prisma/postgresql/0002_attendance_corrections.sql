ALTER TABLE "ClockOutRequest"
  ADD COLUMN IF NOT EXISTS "requestType" TEXT NOT NULL DEFAULT 'CLOCK_OUT',
  ADD COLUMN IF NOT EXISTS "requestedClockInAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "one_pending_correction_per_session"
  ON "ClockOutRequest"("attendanceSessionId") WHERE "status" = 'PENDING';
