import Image from "next/image";
import Link from "next/link";
import { CheckSquareOffset, ClockCounterClockwise, ListMagnifyingGlass, ShieldCheck, SignOut, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { logoutAction } from "@/app/actions";

type AppHeaderProps = {
  name: string;
  position: string;
  role: "ADMIN" | "EMPLOYEE";
};

export function AppHeader({ name, position, role }: AppHeaderProps) {
  const home = role === "ADMIN" ? "/admin" : "/employee";

  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
        <Link href={home} className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-offset-4">
          <Image src="/mtc-logo.jpg" width={42} height={42} alt="Logo MTC" className="shrink-0 rounded-lg" />
          <div>
            <p className="truncate font-[family-name:var(--font-heading)] text-sm font-bold text-[#2B3C5A] sm:text-base">MTC Attendance</p>
            <p className="text-xs text-slate-500">{role === "ADMIN" ? "Dashboard Admin" : "Aplikasi Karyawan"}</p>
          </div>
        </Link>

        <div className="hidden text-right xl:block">
            <p className="text-sm font-bold text-slate-800">{name}</p>
            <p className="text-xs text-slate-500">{position}</p>
        </div>
        <nav className={`order-3 grid w-full gap-2 lg:order-none lg:flex lg:w-auto ${role === "ADMIN" ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-3"}`} aria-label="Navigasi akun">
          {role === "ADMIN" ? <Link href="/admin/records" className="button-secondary px-3" aria-label="Buka rekap absensi">
            <ListMagnifyingGlass size={20} weight="bold" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Rekap</span>
          </Link> : <Link href="/employee/history" className="button-secondary px-3" aria-label="Buka riwayat absensi">
            <ClockCounterClockwise size={20} weight="bold" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Riwayat</span>
          </Link>}
          {role === "ADMIN" ? <Link href="/admin/audit" className="button-secondary px-3" aria-label="Buka audit log">
            <ShieldCheck size={20} weight="bold" aria-hidden="true" />
            <span className="text-xs sm:text-sm">Audit</span>
          </Link> : null}
          {role === "ADMIN" ? <Link href="/admin#attendance-approvals" className="button-secondary px-3" aria-label="Buka persetujuan koreksi absensi">
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
  );
}
