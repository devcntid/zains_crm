import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { createDonor, listDonors } from "@/lib/db/queries/donors";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { createDonorSchema } from "@/lib/validators/donor";
import { normalizePhone } from "@/lib/utils/phone";

export async function GET(req: Request) {
  const g = await guard("donors", "read");
  if (g.error) return g.error;
  const { searchParams } = new URL(req.url);
  const data = await listDonors({
    q: searchParams.get("q") ?? undefined,
    page: Number(searchParams.get("page") ?? 1),
    assignedTo: searchParams.get("assignedTo") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    segmen: searchParams.get("segmen") ?? undefined,
  });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const g = await guard("donors", "create");
  if (g.error) return g.error;
  const parsed = createDonorSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const phone = normalizePhone(parsed.data.noHpCanonical);
  if (!phone) return NextResponse.json({ error: "Nomor HP tidak valid" }, { status: 400 });
  const row = await createDonor({ ...parsed.data, noHpCanonical: phone });
  await logAudit({
    userId: g.session!.user.id,
    action: "create",
    entityType: "donor",
    entityId: String((row as { id: string }).id),
    valueAfter: row,
  });
  return NextResponse.json(row);
}
