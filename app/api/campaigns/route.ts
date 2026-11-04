import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { listCampaigns, upsertCampaign } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";

export async function GET() {
  const g = await guard("campaigns", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listCampaigns() });
}
export async function POST(req: Request) {
  const g = await guard("campaigns", "create");
  if (g.error) return g.error;
  const body = await req.json();
  const rows = await upsertCampaign({ ...body, createdBy: g.session!.user.id });
  await logAudit({ userId: g.session!.user.id, action: "create", entityType: "campaign", valueAfter: body });
  return NextResponse.json(rows[0]);
}
