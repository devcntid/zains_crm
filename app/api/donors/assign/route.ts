import { NextResponse } from "next/server";
import { guard, zodError } from "@/lib/api/guard";
import { assignDonors } from "@/lib/db/queries/donors";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { assignSchema } from "@/lib/validators/donor";

export async function POST(req: Request) {
  const g = await guard("donors", "assign");
  if (g.error) return g.error;
  const parsed = assignSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  await assignDonors(parsed.data.donorIds, parsed.data.assignedTo, g.session!.user.id);
  await logAudit({ userId: g.session!.user.id, action: "assign", entityType: "donor", valueAfter: parsed.data });
  return NextResponse.json({ success: true });
}
