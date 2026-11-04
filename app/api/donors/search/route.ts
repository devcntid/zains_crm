import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { searchDonorsByConditions } from "@/lib/db/queries/catalog";
import { searchSchema } from "@/lib/validators/donor";

export async function POST(req: Request) {
  const g = await guard("donors", "read");
  if (g.error) return g.error;
  const parsed = searchSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const rows = await searchDonorsByConditions(parsed.data.conditions);
  return NextResponse.json({ rows });
}
