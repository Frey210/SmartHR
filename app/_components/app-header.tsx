import Image from "next/image";
import Link from "next/link";
import { ClockCounterClockwise, ListMagnifyingGlass, ShieldCheck, SignOut, UserCircle } from "@phosphor-icons/react/dist/ssr";
import { logoutAction } from "@/app/actions";

type AppHeaderProps = {
  name: string;
  position: string;
  role: "ADMIN" | "EMPLOYEE";
};

export function AppHeader({ name, position, role }: AppHeaderProps) {
  const home = role === "ADMIN" ? "/admin" : "/employee";

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-20 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href={home} className="flex min-h-12 items-center gap-3 rounded-lg focus-visible:outline-offset-4">
          <Image src="/mtc-logo.jpg" width={44} height={44} alt="Logo MTC" className="rounded-lg" priority />
          <div>
            <p className="font-[family-name:var(--font-heading)] text-base font-bold text-[#2B3C5A]">MTC Attendance</p>
            <p className="text-xs text-slate-500">{role === "ADMIN" ? "Dashboard Admin" : "Aplikasi Karyawan"}</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold text-slate-800">{name}</p>
            <p className="text-xs text-slate-500">{position}</p>
          </div>
          {role === "ADMIN" ? <Link href="/admin/records" className="button-secondary px-3" aria-label="Buka rekap absensi">
            <ListMagnifyingGlass size={20} weight="bold" aria-hidden="true" />
            <span className="hidden md:inline">Rekap</span>
          </Link> : <Link href="/employee/history" className="button-secondary px-3" aria-label="Buka riwayat absensi">
            <ClockCounterClockwise size={20} weight="bold" aria-hidden="true" />
            <span className="hidden md:inline">Riwayat</span>
          </Link>}
          {role === "ADMIN" ? <Link href="/admin/audit" className="button-secondary px-3" aria-label="Buka audit log">
            <ShieldCheck size={20} weight="bold" aria-hidden="true" />
            <span className="hidden lg:inline">Audit</span>
          </Link> : null}
          <Link href="/profile" className="button-secondary px-3" aria-label="Buka profil dan ubah password">
            <UserCircle size={20} weight="bold" aria-hidden="true" />
            <span className="hidden sm:inline">Profil</span>
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="button-secondary px-3" aria-label="Keluar dari akun">
              <SignOut size={20} weight="bold" aria-hidden="true" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
