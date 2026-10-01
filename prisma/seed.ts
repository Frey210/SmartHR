import { db } from "../lib/db.ts";
import { hashPassword } from "../lib/password.ts";

const adminPassword = process.env.MTC_SEED_ADMIN_PASSWORD ?? "Admin123!";
const employeePassword = process.env.MTC_SEED_EMPLOYEE_PASSWORD ?? "Karyawan123!";

await db.user.upsert({
  where: { username: "admin" },
  update: {},
  create: {
    username: "admin",
    passwordHash: await hashPassword(adminPassword),
    name: "Administrator MTC",
    position: "Administrator",
    role: "ADMIN",
  },
});

await db.user.upsert({
  where: { username: "fariz" },
  update: {},
  create: {
    username: "fariz",
    passwordHash: await hashPassword(employeePassword),
    name: "Fariz Achmad Faizal",
    position: "Technician",
    role: "EMPLOYEE",
  },
});

await db.appSetting.upsert({
  where: { id: 1 },
  update: {},
  create: { id: 1, timezone: "Asia/Singapore" },
});

await db.$disconnect();
console.log("Seed complete. Development users: admin and fariz.");
