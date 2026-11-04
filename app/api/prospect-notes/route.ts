import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { createProspectNote, listProspectNotes } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { prospectNoteSchema } from "@/lib/validators/donor";

export async function GET(req: Request) {
  const g = await guard("prospect_notes", "read");
  if (g.error) return g.error;
  const donorId = new URL(req.url).searchParams.get("donorId") ?? undefined;
  return NextResponse.json({ rows: await listProspectNotes(donorId) });
}

export async function POST(req: Request) {
  const g = await guard("prospect_notes", "create");
  if (g.error) return g.error;
  const parsed = prospectNoteSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const row = await createProspectNote({ ...parsed.data, userId: g.session!.user.id });
  await logAudit({
    userId: g.session!.user.id,
    donorId: parsed.data.donorId,
    action: "create",
    entityType: "prospect_note",
    entityId: String((row as { id: string }).id),
    source: parsed.data.source ?? "web_app",
  });
  return NextResponse.json(row);
}
