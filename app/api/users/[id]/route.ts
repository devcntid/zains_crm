import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { guard, zodError } from "@/lib/api/guard";
import { softDeleteUser, updateUser } from "@/lib/db/queries/catalog";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { updateUserSchema } from "@/lib/validators/user";

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("users", "config");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  const parsed = updateUserSchema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const passwordHash =
    parsed.data.password && parsed.data.password.length >= 8 ? await hash(parsed.data.password, 12) : undefined;
  const row = await updateUser(id, {
    nama: parsed.data.nama,
    email: parsed.data.email,
    role: parsed.data.role,
    isActive: parsed.data.isActive,
    passwordHash,
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await logAudit({
    userId: g.session!.user.id,
    action: "update",
    entityType: "user",
    entityId: id,
    valueAfter: { email: parsed.data.email, role: parsed.data.role },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard("users", "config");
  if (g.error) return g.error;
  const { id } = await ctx.params;
  if (id === g.session!.user.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }
  await softDeleteUser(id);
  await logAudit({
    userId: g.session!.user.id,
    action: "delete",
    entityType: "user",
    entityId: id,
  });
  return NextResponse.json({ success: true });
}
