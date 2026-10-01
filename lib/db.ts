import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

const databaseUrl = process.env.MTC_DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://")
  ? new PrismaPg({ connectionString: databaseUrl })
  : new PrismaBetterSqlite3({ url: databaseUrl });

const globalForDb = globalThis as unknown as { mtcDb?: PrismaClient };

export const db = globalForDb.mtcDb ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForDb.mtcDb = db;
