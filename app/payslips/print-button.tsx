"use client";

export function PrintPayslipButton() {
  return <button type="button" onClick={() => window.print()} className="button-secondary">Cetak / simpan PDF</button>;
}
