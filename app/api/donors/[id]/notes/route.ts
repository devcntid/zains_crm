import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { createProspectNote, listProspectNotes } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { prospectNoteSchema } from "@/lib/validators/donor";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("prospect_notes", "read");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  return NextResponse.json({ rows: await listProspectNotes(id) });
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("prospect_notes", "create");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const parsed = prospectNoteSchema.safeParse({ ...(await req.json()), donorId: id });
  if (!parsed.success) return zodError(parsed.error);
  const row = await createProspectNote({ ...parsed.data, userId: g.session!.user.id });
  await logAudit({
    userId: g.session!.user.id,
    donorId: id,
    action: "create",
    entityType: "prospect_note",
    source: parsed.data.source ?? "web_app",
  });
  return NextResponse.json(row);
}
