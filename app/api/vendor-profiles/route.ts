import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { listVendorProfiles } from "@/lib/db/queries/catalog";
import { getDb } from "@/lib/db";
import { logAudit } from "@/lib/db/queries/audit-logs";

export async function GET() {
  const g = await guard("vendor_profiles", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listVendorProfiles() });
}
export async function POST(req: Request) {
  const g = await guard("vendor_profiles", "create");
  if (g.error) return g.error;
  const body = await req.json();
  const sql = getDb();
  const rows = await sql`
    INSERT INTO vendor_profiles (nama_vendor, column_mapping, status_mapping, is_default, created_by)
    VALUES (${body.namaVendor}, ${JSON.stringify(body.columnMapping ?? {})}::jsonb, ${JSON.stringify(body.statusMapping ?? {})}::jsonb, ${body.isDefault ?? false}, ${g.session!.user.id})
    RETURNING *
  `;
  await logAudit({ userId: g.session!.user.id, action: "create", entityType: "vendor_profile", valueAfter: body });
  return NextResponse.json(rows[0]);
}
