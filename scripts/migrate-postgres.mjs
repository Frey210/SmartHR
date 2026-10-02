import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const connectionString = process.env.MTC_DATABASE_URL;
if (!connectionString?.startsWith("postgres")) throw new Error("MTC_DATABASE_URL PostgreSQL wajib diisi");

const client = new pg.Client({ connectionString });
await client.connect();
try {
  const existing = await client.query(`SELECT to_regclass('public."User"') AS table_name`);
  if (!existing.rows[0]?.table_name) {
    const sql = readFileSync(fileURLToPath(new URL("../prisma/postgresql/0001_init.sql", import.meta.url)), "utf8");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("PostgreSQL schema initialized");
  }
  const corrections = readFileSync(fileURLToPath(new URL("../prisma/postgresql/0002_attendance_corrections.sql", import.meta.url)), "utf8");
  await client.query(corrections);
  console.log("PostgreSQL schema ready");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}
