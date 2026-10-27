CREATE TABLE IF NOT EXISTS "PayrollSetting" (
  "id" INTEGER PRIMARY KEY DEFAULT 1,
  "periodStartDay" INTEGER NOT NULL DEFAULT 25 CHECK ("periodStartDay" BETWEEN 1 AND 31),
  "payday" INTEGER NOT NULL DEFAULT 25 CHECK ("payday" BETWEEN 1 AND 31),
  "minutesPerDay" INTEGER NOT NULL DEFAULT 300 CHECK ("minutesPerDay" > 0),
  "signerName" TEXT NOT NULL DEFAULT '', "signerPosition" TEXT NOT NULL DEFAULT '', "city" TEXT NOT NULL DEFAULT 'Makassar',
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "PayrollProfile" (
  "employeeId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE RESTRICT,
  "baseSalary" INTEGER NOT NULL CHECK ("baseSalary" >= 0),
  "communicationAllowance" INTEGER NOT NULL CHECK ("communicationAllowance" >= 0),
  "transportRate" INTEGER NOT NULL CHECK ("transportRate" >= 0),
  "maxPaidDays" INTEGER NOT NULL CHECK ("maxPaidDays" >= 0),
  "nationalId" TEXT NOT NULL DEFAULT '', "taxStatus" TEXT NOT NULL DEFAULT 'TK/0',
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE IF NOT EXISTS "PayrollPeriod" (
  "id" TEXT PRIMARY KEY, "key" TEXT NOT NULL UNIQUE,
  "startDate" TEXT NOT NULL, "endDate" TEXT NOT NULL, "payDate" TEXT NOT NULL,
  "timezone" TEXT NOT NULL, "minutesPerDay" INTEGER NOT NULL CHECK ("minutesPerDay" > 0),
  "signerName" TEXT NOT NULL, "signerPosition" TEXT NOT NULL, "city" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "Payslip" (
  "id" TEXT PRIMARY KEY,
  "periodId" TEXT NOT NULL REFERENCES "PayrollPeriod"("id") ON DELETE RESTRICT,
  "employeeId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "profileSnapshot" TEXT NOT NULL, "attendanceSnapshot" TEXT NOT NULL, "adjustments" TEXT NOT NULL,
  "totalMinutes" INTEGER NOT NULL, "earnedDays" INTEGER NOT NULL, "paidDays" INTEGER NOT NULL,
  "remainderMinutes" INTEGER NOT NULL, "excludedCount" INTEGER NOT NULL,
  "grossPay" INTEGER NOT NULL CHECK ("grossPay" >= 0), "netPay" INTEGER NOT NULL CHECK ("netPay" >= 0),
  "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'PUBLISHED')),
  "version" INTEGER NOT NULL DEFAULT 1, "publishedBy" TEXT, "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Payslip_periodId_employeeId_key" ON "Payslip"("periodId", "employeeId");
CREATE INDEX IF NOT EXISTS "Payslip_employeeId_status_idx" ON "Payslip"("employeeId", "status");
