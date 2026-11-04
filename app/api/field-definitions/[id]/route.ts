import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { deactivateFieldDefinition, updateFieldDefinition } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { updateFieldDefinitionSchema } from "@/lib/validators/field-definition";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("field_definitions", "config");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const parsed = updateFieldDefinitionSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const row = await updateFieldDefinition(id, parsed.data);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({
    userId: g.session!.user.id,
    action: "update",
    entityType: "field_def",
    entityId: id,
    valueAfter: parsed.data,
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("field_definitions", "config");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  await deactivateFieldDefinition(id);
  await logAudit({
    userId: g.session!.user.id,
    action: "delete",
    entityType: "field_def",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
