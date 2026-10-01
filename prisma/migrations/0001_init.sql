CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'EMPLOYEE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "AuthSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tokenHash" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AttendanceLocation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "latitude" REAL NOT NULL,
  "longitude" REAL NOT NULL,
  "radiusM" INTEGER NOT NULL DEFAULT 50,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "AttendanceSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "locationId" TEXT,
  "businessDate" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "clockInAt" DATETIME NOT NULL,
  "clockOutAt" DATETIME,
  "clockInLatitude" REAL NOT NULL,
  "clockInLongitude" REAL NOT NULL,
  "clockInAccuracyM" REAL,
  "clockInDistanceM" REAL NOT NULL,
  "clockOutLatitude" REAL,
  "clockOutLongitude" REAL,
  "clockOutAccuracyM" REAL,
  "clockOutDistanceM" REAL,
  "clockOutSource" TEXT,
  "durationMinutes" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AttendanceSession_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AttendanceSession_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "AttendanceLocation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WorkEvidence" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attendanceSessionId" TEXT NOT NULL,
  "objectKey" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "description" TEXT NOT NULL,
  "deletedAt" DATETIME,
  "deletedBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkEvidence_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "AttendanceSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ClockOutRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "attendanceSessionId" TEXT NOT NULL,
  "requestedClockOutAt" DATETIME NOT NULL,
  "requestLocationLatitude" REAL,
  "requestLocationLongitude" REAL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewedAt" DATETIME,
  "reviewNote" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "ClockOutRequest_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "AttendanceSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AppSetting" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Singapore',
  "updatedBy" TEXT,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "details" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX IF NOT EXISTS "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");
CREATE INDEX IF NOT EXISTS "AuthSession_userId_idx" ON "AuthSession"("userId");
CREATE INDEX IF NOT EXISTS "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
CREATE INDEX IF NOT EXISTS "AttendanceSession_employeeId_businessDate_idx" ON "AttendanceSession"("employeeId", "businessDate");
CREATE INDEX IF NOT EXISTS "AttendanceSession_status_idx" ON "AttendanceSession"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "one_open_attendance_per_employee" ON "AttendanceSession"("employeeId") WHERE "status" = 'OPEN';
CREATE INDEX IF NOT EXISTS "WorkEvidence_attendanceSessionId_idx" ON "WorkEvidence"("attendanceSessionId");
CREATE INDEX IF NOT EXISTS "ClockOutRequest_status_idx" ON "ClockOutRequest"("status");
CREATE INDEX IF NOT EXISTS "ClockOutRequest_attendanceSessionId_idx" ON "ClockOutRequest"("attendanceSessionId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
