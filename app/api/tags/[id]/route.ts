import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { deactivateTag, updateTag } from "@/lib/db/queries/tags";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { tagSchema } from "@/lib/validators/tag";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("tags", "config");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const parsed = tagSchema.partial().safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const row = await updateTag(id, parsed.data);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({
    userId: g.session!.user.id,
    action: "update",
    entityType: "tag",
    entityId: id,
    valueAfter: parsed.data,
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("tags", "config");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const result = await deactivateTag(id);
  await logAudit({
    userId: g.session!.user.id,
    action: "delete",
    entityType: "tag",
    entityId: id,
    valueAfter: result,
  });
  return NextResponse.json(result);
}
