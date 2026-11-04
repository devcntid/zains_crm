import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { addDonorTag, removeDonorTag } from "@/lib/db/queries/donors";
import { ensureTag } from "@/lib/db/queries/tags";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { donorTagPatchSchema } from "@/lib/validators/tag";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("donors", "update");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const parsed = donorTagPatchSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  if (!parsed.data.add && !parsed.data.remove) {
    return NextResponse.json({ error: "add atau remove wajib" }, { status: 400 });
  }
  let row;
  if (parsed.data.add) {
    const tag = await ensureTag(parsed.data.add);
    row = await addDonorTag(id, tag.slug);
  } else {
    row = await removeDonorTag(id, parsed.data.remove!);
  }
  await logAudit({
    userId: g.session!.user.id,
    donorId: id,
    action: "update",
    entityType: "donor_tag",
    entityId: id,
    valueAfter: parsed.data,
  });
  return NextResponse.json(row);
}
