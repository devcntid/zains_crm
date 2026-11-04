import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { getExtensionConfig, listExtensionConfigs } from "@/lib/db/queries/catalog";
import { getDb } from "@/lib/db";
import { logAudit } from "@/lib/db/queries/audit-logs";

export async function GET(req: Request) {
  const g = await guard("extensions", "read");
  if (g.error) return g.error;
  const type = new URL(req.url).searchParams.get("extType");
  if (type) return NextResponse.json(await getExtensionConfig(type));
  return NextResponse.json({ rows: await listExtensionConfigs() });
}

export async function PUT(req: Request) {
  const g = await guard("extensions", "config");
  if (g.error) return g.error;
  const body = await req.json();
  const sql = getDb();
  const rows = await sql`
    UPDATE extension_configs
    SET is_active = COALESCE(${body.isActive ?? null}, is_active),
        config_json = COALESCE(${JSON.stringify(body.configJson ?? null)}::jsonb, config_json),
        status = COALESCE(${body.status ?? null}, status)
    WHERE ext_type = ${body.extType}
    RETURNING *
  `;
  await logAudit({ userId: g.session!.user.id, action: "update", entityType: "extension_config", valueAfter: body });
  return NextResponse.json(rows[0]);
}
