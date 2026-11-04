import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { createTransaction, listTransactions } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";

export async function GET() {
  const g = await guard("transactions", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listTransactions() });
}
export async function POST(req: Request) {
  const g = await guard("transactions", "create");
  if (g.error) return g.error;
  const body = await req.json();
  const row = await createTransaction(body);
  await logAudit({ userId: g.session!.user.id, action: "create", entityType: "transaction", donorId: body.donorId, valueAfter: body });
  return NextResponse.json(row);
}
