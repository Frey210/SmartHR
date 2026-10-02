CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY, "username" TEXT NOT NULL UNIQUE, "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL, "position" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
  "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "AuthSession" (
  "id" TEXT PRIMARY KEY, "tokenHash" TEXT NOT NULL UNIQUE, "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AttendanceLocation" (
  "id" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL, "radiusM" INTEGER NOT NULL DEFAULT 50,
  "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "AttendanceSession" (
  "id" TEXT PRIMARY KEY, "employeeId" TEXT NOT NULL, "locationId" TEXT, "businessDate" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN', "clockInAt" TIMESTAMP(3) NOT NULL, "clockOutAt" TIMESTAMP(3),
  "clockInLatitude" DOUBLE PRECISION NOT NULL, "clockInLongitude" DOUBLE PRECISION NOT NULL,
  "clockInAccuracyM" DOUBLE PRECISION, "clockInDistanceM" DOUBLE PRECISION NOT NULL,
  "clockOutLatitude" DOUBLE PRECISION, "clockOutLongitude" DOUBLE PRECISION,
  "clockOutAccuracyM" DOUBLE PRECISION, "clockOutDistanceM" DOUBLE PRECISION,
  "clockOutSource" TEXT, "durationMinutes" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AttendanceSession_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AttendanceSession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "AttendanceLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "WorkEvidence" (
  "id" TEXT PRIMARY KEY, "attendanceSessionId" TEXT NOT NULL, "objectKey" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL, "mimeType" TEXT NOT NULL, "sizeBytes" INTEGER NOT NULL,
  "description" TEXT NOT NULL, "deletedAt" TIMESTAMP(3), "deletedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkEvidence_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ClockOutRequest" (
  "id" TEXT PRIMARY KEY, "attendanceSessionId" TEXT NOT NULL, "requestType" TEXT NOT NULL DEFAULT 'CLOCK_OUT',
  "requestedClockInAt" TIMESTAMP(3), "requestedClockOutAt" TIMESTAMP(3) NOT NULL,
  "requestLocationLatitude" DOUBLE PRECISION, "requestLocationLongitude" DOUBLE PRECISION,
  "reason" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'PENDING', "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3), "reviewNote" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ClockOutRequest_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AppSetting" (
  "id" INTEGER PRIMARY KEY DEFAULT 1, "timezone" TEXT NOT NULL DEFAULT 'Asia/Singapore',
  "updatedBy" TEXT, "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY, "actorId" TEXT, "action" TEXT NOT NULL, "entityType" TEXT NOT NULL,
  "entityId" TEXT, "details" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
CREATE INDEX "AttendanceSession_employeeId_businessDate_idx" ON "AttendanceSession"("employeeId", "businessDate");
CREATE INDEX "AttendanceSession_status_idx" ON "AttendanceSession"("status");
CREATE UNIQUE INDEX "one_open_attendance_per_employee" ON "AttendanceSession"("employeeId") WHERE "status" = 'OPEN';
CREATE INDEX "WorkEvidence_attendanceSessionId_idx" ON "WorkEvidence"("attendanceSessionId");
CREATE INDEX "ClockOutRequest_status_idx" ON "ClockOutRequest"("status");
CREATE INDEX "ClockOutRequest_attendanceSessionId_idx" ON "ClockOutRequest"("attendanceSessionId");
CREATE UNIQUE INDEX "one_pending_correction_per_session" ON "ClockOutRequest"("attendanceSessionId") WHERE "status" = 'PENDING';
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
