import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const databasePath = fileURLToPath(new URL("../prisma/dev.db", import.meta.url));
const migrationPath = fileURLToPath(new URL("../prisma/migrations/0001_init.sql", import.meta.url));
const database = new Database(databasePath);

database.pragma("foreign_keys = ON");
database.exec(readFileSync(migrationPath, "utf8"));
const requestColumns = new Set(database.prepare(`PRAGMA table_info("ClockOutRequest")`).all().map((column) => column.name));
if (!requestColumns.has("requestType")) database.exec(`ALTER TABLE "ClockOutRequest" ADD COLUMN "requestType" TEXT NOT NULL DEFAULT 'CLOCK_OUT'`);
if (!requestColumns.has("requestedClockInAt")) database.exec(`ALTER TABLE "ClockOutRequest" ADD COLUMN "requestedClockInAt" DATETIME`);
const settingColumns = new Set(database.prepare(`PRAGMA table_info("AppSetting")`).all().map((column) => column.name));
if (!settingColumns.has("correctionLimitDays")) database.exec(`ALTER TABLE "AppSetting" ADD COLUMN "correctionLimitDays" INTEGER CHECK ("correctionLimitDays" > 0)`);
database.close();
console.log(`Database ready: ${databasePath}`);
