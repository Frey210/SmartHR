import { AppHeader } from "@/app/_components/app-header";
import { requireUser } from "@/lib/auth";

export default async function EmployeeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser("EMPLOYEE");
  return <div className="min-h-[100dvh]">
    <AppHeader name={user.name} position={user.position} role="EMPLOYEE" />
    {children}
  </div>;
}
