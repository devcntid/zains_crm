import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { getDb } from "@/lib/db";
import { assignDonors } from "@/lib/db/queries/donors";
import { logAudit } from "@/lib/db/queries/audit-logs";

export async function POST(req: Request) {
  const g = await guard("donors", "assign");
  if (g.error) return g.error;
  const { donorIds, picIds } = (await req.json()) as { donorIds: string[]; picIds: string[] };
  if (!donorIds?.length || !picIds?.length) {
    return NextResponse.json({ error: "donorIds and picIds required" }, { status: 400 });
  }
  const sql = getDb();
  const batch = await sql`
    INSERT INTO distribute_batches (total_donors, pic_count, config_json, status, dijalankan_oleh, completed_at)
    VALUES (${donorIds.length}, ${picIds.length}, ${JSON.stringify({ picIds })}::jsonb, 'done', ${g.session!.user.id}, now())
    RETURNING id
  `;
  for (let i = 0; i < donorIds.length; i++) {
    await assignDonors([donorIds[i]], picIds[i % picIds.length], g.session!.user.id);
  }
  await logAudit({ userId: g.session!.user.id, action: "assign", entityType: "distribute_batch", entityId: String((batch[0] as { id: string }).id) });
  return NextResponse.json(batch[0]);
}
