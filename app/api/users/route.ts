import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { listUsers } from "@/lib/db/queries/catalog";
import { getDb } from "@/lib/db";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { hash } from "bcryptjs";

export async function GET() {
  const g = await guard("users", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listUsers() });
}
export async function POST(req: Request) {
  const g = await guard("users", "config");
  if (g.error) return g.error;
  const body = await req.json();
  const passwordHash = await hash(body.password ?? "password123", 12);
  const sql = getDb();
  const rows = await sql`
    INSERT INTO users (nama, email, password_hash, role, is_active)
    VALUES (${body.nama}, ${body.email}, ${passwordHash}, ${body.role ?? "tim_blast"}, TRUE)
    RETURNING id, nama, email, role, is_active
  `;
  await logAudit({ userId: g.session!.user.id, action: "create", entityType: "user", valueAfter: { email: body.email } });
  return NextResponse.json(rows[0]);
}
