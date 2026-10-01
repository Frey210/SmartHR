import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const databasePath = fileURLToPath(new URL("../prisma/dev.db", import.meta.url));
const migrationPath = fileURLToPath(new URL("../prisma/migrations/0001_init.sql", import.meta.url));
const database = new Database(databasePath);

database.pragma("foreign_keys = ON");
database.exec(readFileSync(migrationPath, "utf8"));
database.close();
console.log(`Database ready: ${databasePath}`);
