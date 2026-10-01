export function monthRange(value: string | undefined, fallback: string) {
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(value ?? "") ? value! : fallback;
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return { month, start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, "0")}` };
}
