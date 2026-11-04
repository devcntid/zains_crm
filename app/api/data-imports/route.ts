import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { listDataImports } from "@/lib/db/queries/catalog";

export async function GET() {
  const g = await guard("data_imports", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listDataImports() });
}
