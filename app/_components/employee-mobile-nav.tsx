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

  return <nav className="employee-mobile-nav fixed inset-x-3 bottom-[max(0.625rem,env(safe-area-inset-bottom))] z-50 lg:hidden" aria-label="Navigasi utama karyawan">
    <div className="mx-auto grid max-w-md grid-cols-4">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/employee" ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} aria-current={active ? "page" : undefined} className="employee-mobile-nav__link flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-xs font-bold">
          <Icon size={23} weight={active ? "fill" : "regular"} aria-hidden="true" />
          {label}
        </Link>;
      })}
    </div>
  </nav>;
}
