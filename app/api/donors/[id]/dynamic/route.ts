import { NextResponse } from "next/server";
import { z } from "zod";
import { guard, zodError } from "@/lib/api/guard";
import { listDonorDynamicValues, saveDonorDynamicFields } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("donors", "read");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  return NextResponse.json({ rows: await listDonorDynamicValues(id) });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("donors", "update");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const parsed = z.object({ values: z.record(z.string(), z.unknown()) }).safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  await saveDonorDynamicFields(id, parsed.data.values, g.session!.user.id);
  await logAudit({
    userId: g.session!.user.id,
    donorId: id,
    action: "update",
    entityType: "donor_dynamic",
    entityId: id,
    valueAfter: parsed.data.values,
  });
  return NextResponse.json({ success: true });
}
