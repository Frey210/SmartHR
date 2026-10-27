import Image from "next/image";
import Link from "next/link";
import { CheckSquareOffset, ClockCounterClockwise, ListMagnifyingGlass, Receipt, ShieldCheck, SignOut, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { logoutAction } from "@/app/actions";
import { EmployeeMobileNav } from "@/app/_components/employee-mobile-nav";
import { canReviewAttendance, roleHome, type UserRole } from "@/lib/roles";

type AppHeaderProps = {
  name: string;
  position: string;
  role: UserRole;
};

export function AppHeader({ name, position, role }: AppHeaderProps) {
  const home = roleHome(role);

  return <>
    <header className={`sticky top-0 z-40 border-b backdrop-blur-sm ${role === "EMPLOYEE" ? "employee-app-header border-transparent pt-[env(safe-area-inset-top)] lg:border-slate-200/80 lg:bg-white lg:pt-0 lg:shadow-none" : "border-slate-200/80 bg-white/95"}`}>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-4 sm:px-6 lg:flex-nowrap lg:px-8 lg:py-3">
        <Link href={home} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-offset-4">
          <Image src="/mtc-logo.jpg" width={42} height={42} alt="Logo MTC" className="shrink-0 rounded-lg ring-1 ring-white/20" />
          <div>
            <p className={`truncate font-[family-name:var(--font-heading)] text-sm font-bold sm:text-base ${role === "EMPLOYEE" ? "text-white lg:text-[#2B3C5A]" : "text-[#2B3C5A]"}`}>MTC Attendance</p>
            <p className={`text-xs ${role === "EMPLOYEE" ? "text-blue-100 lg:text-slate-500" : "text-slate-500"}`}>{role === "ADMIN" ? "Dashboard Admin" : role === "HR" ? "Verifikasi HR" : "Aplikasi Karyawan"}</p>
          </div>
        </Link>

        <div className="hidden text-right xl:block">
            <p className="text-sm font-bold text-slate-800">{name}</p>
            <p className="text-xs text-slate-500">{position}</p>
        </div>
        {role === "EMPLOYEE" ? <form action={logoutAction} className="lg:hidden">
          <button type="submit" className="employee-header-action flex size-11 cursor-pointer items-center justify-center rounded-xl text-white" aria-label="Keluar dari akun">
            <SignOut size={22} weight="bold" aria-hidden="true" />
          </button>
        </form> : null}
        <nav className={`order-3 w-full gap-2 lg:order-none lg:flex lg:w-auto ${role === "ADMIN" ? "grid grid-cols-3 sm:grid-cols-4" : role === "HR" ? "grid grid-cols-3" : "hidden"}`} aria-label="Navigasi akun">
          {canReviewAttendance(role) ? <Link href="/payroll" className="button-secondary px-3"><Receipt size={20} aria-hidden="true" /><span className="text-xs sm:text-sm">Payroll</span></Link> : null}
          <Link href="/payslips" className="button-secondary px-3"><Receipt size={20} aria-hidden="true" /><span className="text-xs sm:text-sm">Slip saya</span></Link>
          {role === "ADMIN" ? <Link href="/admin/records" className="button-secondary px-3" aria-label="Buka rekap absensi">
            <ListMagnifyingGlass size={20} weight="bold" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Rekap</span>
          </Link> : role === "EMPLOYEE" ? <Link href="/employee/history" className="button-secondary px-3" aria-label="Buka riwayat absensi">
            <ClockCounterClockwise size={20} weight="bold" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Riwayat</span>
          </Link> : null}
          {role === "ADMIN" ? <Link href="/admin/audit" className="button-secondary px-3" aria-label="Buka audit log">
            <ShieldCheck size={20} weight="bold" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Audit</span>
          </Link> : null}
          {canReviewAttendance(role) ? <Link href={role === "HR" ? "/hr" : "/admin#attendance-approvals"} className="button-secondary px-3" aria-label="Buka persetujuan koreksi absensi">
            <CheckSquareOffset size={20} weight="bold" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Koreksi</span>
          </Link> : null}
          <Link href="/profile" className="button-secondary px-3" aria-label="Buka profil dan ubah password">
            <UserCircle size={20} weight="bold" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Profil</span>
          </Link>
          <form action={logoutAction} className="min-w-0">
            <button type="submit" className="button-secondary w-full px-3" aria-label="Keluar dari akun">
              <SignOut size={20} weight="bold" aria-hidden="true" />
              <span className="text-xs sm:text-sm">Keluar</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
    {role === "EMPLOYEE" ? <EmployeeMobileNav /> : null}
  </>;
}
