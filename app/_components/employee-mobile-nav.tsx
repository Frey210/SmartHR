"use client";

import { ClockCounterClockwise, House, MapPin, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/employee", label: "Beranda", icon: House },
  { href: "/employee/attendance", label: "Absensi", icon: MapPin },
  { href: "/employee/history", label: "Riwayat", icon: ClockCounterClockwise },
  { href: "/profile", label: "Profil", icon: UserCircle },
];

export function EmployeeMobileNav() {
  const pathname = usePathname();

  return <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(43,60,90,0.12)] backdrop-blur-xl lg:hidden" aria-label="Navigasi utama karyawan">
    <div className="mx-auto grid max-w-md grid-cols-4">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/employee" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-bold transition-colors ${active ? "bg-blue-50 text-[#0868D7]" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
          <Icon size={23} weight={active ? "fill" : "regular"} aria-hidden="true" />
          {label}
        </Link>;
      })}
    </div>
  </nav>;
}
