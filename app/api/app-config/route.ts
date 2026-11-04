import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { listAppConfig, upsertAppConfig } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";

export async function GET() {
  const g = await guard("app_config", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listAppConfig() });
}
export async function PUT(req: Request) {
  const g = await guard("app_config", "config");
  if (g.error) return g.error;
  const { key, value } = await req.json();
  const rows = await upsertAppConfig(key, value);
  await logAudit({ userId: g.session!.user.id, action: "update", entityType: "app_config", fieldChanged: key, valueAfter: { value } });
  return NextResponse.json(rows[0]);
}
