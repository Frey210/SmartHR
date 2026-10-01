import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = fileURLToPath(new URL("../prisma/schema.prisma", import.meta.url));
const target = fileURLToPath(new URL("../prisma/schema.postgresql.prisma", import.meta.url));
const schema = readFileSync(source, "utf8").replace('provider = "sqlite"', 'provider = "postgresql"');

if (schema === readFileSync(source, "utf8")) throw new Error("SQLite provider declaration not found");
writeFileSync(target, schema);
console.log(`PostgreSQL schema ready: ${target}`);
