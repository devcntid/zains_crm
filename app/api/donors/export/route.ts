import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { listDonors } from "@/lib/db/queries/donors";

export async function POST() {
  const g = await guard("donors", "export");
  if (g.error) return g.error;
  const { rows } = await listDonors({ limit: 10000 });
  const header = "id,nama,no_hp,email,segmen,status,total\n";
  const body = rows
    .map((r) =>
      [r.id, r.nama_lengkap, r.no_hp_canonical, r.email, r.segmen_rfm, r.status_kontak, r.total_donation_lifetime]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  return new NextResponse(header + body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=donors.csv",
    },
  });
}
