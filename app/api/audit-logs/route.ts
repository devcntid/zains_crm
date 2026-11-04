import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { listAuditLogs } from "@/lib/db/queries/audit-logs";

export async function GET() {
  const g = await guard("audit_logs", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listAuditLogs() });
}
