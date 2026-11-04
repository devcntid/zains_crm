import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { getDonorByPhone } from "@/lib/db/queries/donors";
import { listProspectNotes } from "@/lib/db/queries/catalog";
import { normalizePhone } from "@/lib/utils/phone";

export async function GET(req: Request) {
  const g = await guard("donors", "read");
  if (g.error) return g.error;
  const phone = normalizePhone(new URL(req.url).searchParams.get("phone") ?? "");
  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 });
  const donor = await getDonorByPhone(phone);
  if (!donor) return NextResponse.json({ donor: null });
  const notes = await listProspectNotes(String((donor as { id: string }).id));
  return NextResponse.json({ donor, notes });
}
