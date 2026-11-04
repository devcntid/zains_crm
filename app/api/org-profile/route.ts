import { NextResponse } from "next/server";
import { z } from "zod";
import { guard, zodError } from "@/lib/api/guard";
import { getOrgProfile, updateOrgProfile } from "@/lib/db/queries/org-profile";
import { logAudit } from "@/lib/db/queries/audit-logs";

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Warna harus hex #RRGGBB");

const schema = z.object({
  nama: z.string().min(2),
  namaSingkat: z.string().min(1).max(40),
  tagline: z.string().max(200),
  logoUrl: z.union([z.string().url(), z.literal(""), z.null()]),
  faviconUrl: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  primaryColor: hex,
  sidebarColor: hex,
  accentColor: hex,
});

export async function GET() {
  const g = await guard("app_config", "read");
  if (g.error) return g.error;
  return NextResponse.json(await getOrgProfile());
}

export async function PUT(req: Request) {
  const g = await guard("app_config", "config");
  if (g.error) return g.error;
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return zodError(parsed.error);
  const logoUrl = parsed.data.logoUrl ? parsed.data.logoUrl : null;
  const faviconUrl = parsed.data.faviconUrl ? parsed.data.faviconUrl : null;
  const row = await updateOrgProfile({ ...parsed.data, logoUrl, faviconUrl });
  await logAudit({
    userId: g.session!.user.id,
    action: "update",
    entityType: "org_profile",
    entityId: "1",
    valueAfter: parsed.data,
  });
  return NextResponse.json(row);
}
