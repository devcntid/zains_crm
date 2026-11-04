import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { listFieldDefinitions, upsertFieldDefinition } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";

export async function GET() {
  const g = await guard("field_definitions", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listFieldDefinitions() });
}
export async function POST(req: Request) {
  const g = await guard("field_definitions", "config");
  if (g.error) return g.error;
  const body = await req.json();
  const rows = await upsertFieldDefinition({ ...body, createdBy: g.session!.user.id });
  await logAudit({ userId: g.session!.user.id, action: "create", entityType: "field_def", valueAfter: body });
  return NextResponse.json(rows[0]);
}
