import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { guard, zodError } from "@/lib/api/guard";
import { createUser, listUsers } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { createUserSchema } from "@/lib/validators/user";

export async function GET() {
  const g = await guard("users", "read");
  if (g.error) return g.error;
  return NextResponse.json({ rows: await listUsers() });
}

export async function POST(req: Request) {
  const g = await guard("users", "config");
  if (g.error) return g.error;
  const parsed = createUserSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const passwordHash = await hash(parsed.data.password, 12);
  try {
    const row = await createUser({
      nama: parsed.data.nama,
      email: parsed.data.email,
      passwordHash,
      role: parsed.data.role,
      isActive: parsed.data.isActive,
    });
    await logAudit({
      userId: g.session!.user.id,
      action: "create",
      entityType: "user",
      valueAfter: { email: parsed.data.email, role: parsed.data.role },
    });
    return NextResponse.json(row);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("users_email") || msg.includes("unique")) {
      return NextResponse.json({ error: "Email sudah dipakai" }, { status: 409 });
    }
    throw err;
  }
}
