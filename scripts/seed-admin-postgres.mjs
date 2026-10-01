import { randomBytes, randomUUID, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";

const connectionString = process.env.MTC_DATABASE_URL;
const password = process.env.MTC_SEED_ADMIN_PASSWORD;
if (!connectionString?.startsWith("postgres")) throw new Error("MTC_DATABASE_URL PostgreSQL wajib diisi");
if (!password || password.length < 12) throw new Error("MTC_SEED_ADMIN_PASSWORD minimal 12 karakter");

const salt = randomBytes(16).toString("hex");
const derived = await promisify(scryptCallback)(password, salt, 64);
const passwordHash = `${salt}:${derived.toString("hex")}`;
const client = new pg.Client({ connectionString });
await client.connect();
try {
  const result = await client.query(
    `INSERT INTO "User" ("id", "username", "passwordHash", "name", "position", "role", "isActive", "createdAt", "updatedAt")
     VALUES ($1, 'admin', $2, 'Administrator MTC', 'Administrator', 'ADMIN', true, NOW(), NOW())
     ON CONFLICT ("username") DO NOTHING`,
    [randomUUID(), passwordHash],
  );
  await client.query(`INSERT INTO "AppSetting" ("id", "timezone", "updatedAt") VALUES (1, 'Asia/Singapore', NOW()) ON CONFLICT ("id") DO NOTHING`);
  console.log(result.rowCount ? "Initial admin created" : "Admin already exists");
} finally {
  await client.end();
}
