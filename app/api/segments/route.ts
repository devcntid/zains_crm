import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { createSegment, listSegments } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";

export async function GET() {
  const g = await guard("segments", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listSegments() });
}
export async function POST(req: Request) {
  const g = await guard("segments", "create");
  if (g.error) return g.error;
  const body = await req.json();
  const rows = await createSegment({ ...body, dibuatOleh: g.session!.user.id });
  await logAudit({ userId: g.session!.user.id, action: "create", entityType: "segment", valueAfter: body });
  return NextResponse.json(rows[0]);
}
