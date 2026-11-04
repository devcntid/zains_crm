import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { listTags, slugifyTag, upsertTag } from "@/lib/db/queries/tags";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { tagSchema } from "@/lib/validators/tag";

export async function GET() {
  const g = await guard("tags", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listTags() });
}

export async function POST(req: Request) {
  const g = await guard("tags", "config");
  if (g.error) return g.error;
  const parsed = tagSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const slug = parsed.data.slug || slugifyTag(parsed.data.nama);
  const row = await upsertTag({ ...parsed.data, slug });
  await logAudit({
    userId: g.session!.user.id,
    action: "create",
    entityType: "tag",
    valueAfter: row,
  });
  return NextResponse.json(row);
}
