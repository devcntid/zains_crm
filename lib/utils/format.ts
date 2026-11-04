import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export function fmtRp(n: number | string | bigint | null | undefined) {
  if (n == null || n === "") return "—";
  return "Rp " + Number(n).toLocaleString("id-ID");
}

export function fmtDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? parseISO(value.slice(0, 10)) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return format(d, "d MMM yyyy", { locale: id });
}

export function toNum(v: unknown) {
  if (v == null) return 0;
  if (typeof v === "bigint") return Number(v);
  return Number(v);
}
