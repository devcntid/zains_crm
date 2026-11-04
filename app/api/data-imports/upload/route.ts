import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { createDonor, getDonorByPhone } from "@/lib/db/queries/donors";
import { getDb } from "@/lib/db";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { normalizePhone } from "@/lib/utils/phone";

export async function POST(req: Request) {
  const g = await guard("data_imports", "import");
  if (g.error) return g.error;
  const body = await req.json();
  const rows: Array<{ nama: string; phone: string; email?: string }> = body.rows ?? [];
  let nNew = 0;
  let nMerge = 0;
  for (const r of rows) {
    const phone = normalizePhone(r.phone);
    if (!phone) continue;
    const existing = await getDonorByPhone(phone);
    if (existing) nMerge += 1;
    else {
      await createDonor({ noHpCanonical: phone, namaLengkap: r.nama, email: r.email ?? null });
      nNew += 1;
    }
  }
  const sql = getDb();
  await sql`
    INSERT INTO data_imports (entity_type, file_name, row_count_total, row_count_new, row_count_merge, status, diupload_oleh, completed_at)
    VALUES ('donors', ${body.fileName ?? "upload.json"}, ${rows.length}, ${nNew}, ${nMerge}, 'done', ${g.session!.user.id}, now())
  `;
  await logAudit({ userId: g.session!.user.id, action: "import", entityType: "donor", valueAfter: { nNew, nMerge } });
  return NextResponse.json({ nNew, nMerge, total: rows.length });
}
