import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? (user.role === "ADMIN" ? "/admin" : "/employee") : "/login");
}
