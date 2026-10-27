import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/app/_components/app-header";
import { PayslipDocument } from "@/app/_components/payslip-document";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canReviewAttendance, type UserRole } from "@/lib/roles";
import { PrintPayslipButton } from "../print-button";

export default async function PayslipPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const reviewer = canReviewAttendance(user.role);
  const slip = await db.payslip.findFirst({ where: { id, ...(reviewer ? {} : { employeeId: user.id, status: "PUBLISHED" }) }, include: { period: true } });
  if (!slip) notFound();
  return <div className="payslip-print-page"><div className="no-print"><AppHeader name={user.name} position={user.position} role={user.role as UserRole} /></div><main id="main-content" className="mx-auto grid max-w-5xl gap-5 px-4 py-6 pb-28 sm:px-6 lg:py-10"><div className="no-print flex flex-wrap items-center justify-between gap-3"><Link href={reviewer ? `/payroll/${id}` : "/payslips"} className="inline-flex min-h-11 items-center text-sm font-bold text-blue-700 hover:underline">Kembali</Link><PrintPayslipButton /></div><PayslipDocument slip={slip} /></main></div>;
}
