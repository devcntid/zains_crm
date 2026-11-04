import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { getDonorById, softDeleteDonor, updateDonor } from "@/lib/db/queries/donors";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { updateDonorSchema } from "@/lib/validators/donor";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("donors", "read");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const row = await getDonorById(id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("donors", "update");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const parsed = updateDonorSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const row = await updateDonor(id, parsed.data);
  await logAudit({ userId: g.session!.user.id, action: "update", entityType: "donor", entityId: id, valueAfter: parsed.data });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("donors", "delete");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  await softDeleteDonor(id);
  await logAudit({ userId: g.session!.user.id, action: "delete", entityType: "donor", entityId: id });
  return NextResponse.json({ success: true });
}
