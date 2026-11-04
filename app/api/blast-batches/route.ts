import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { listBlastBatches } from "@/lib/db/queries/catalog";

export async function GET() {
  const g = await guard("blast_batches", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listBlastBatches() });
}
