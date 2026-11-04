import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { uploadOrgAsset } from "@/lib/blob/org-assets";
import { logAudit } from "@/lib/db/queries/audit-logs";
import { setOrgAssetUrl } from "@/lib/db/queries/org-profile";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = await guard("app_config", "config");
  if (g.error) return g.error;
  const form = await req.formData();
  const kindRaw = String(form.get("kind") ?? "");
  const kind = kindRaw === "favicon" ? "favicon" : kindRaw === "logo" ? "logo" : null;
  const file = form.get("file");
  if (!kind || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Berkas dan jenis (logo/favicon) wajib" }, { status: 400 });
  }
  try {
    const url = await uploadOrgAsset(kind, file);
    await setOrgAssetUrl(kind, url);
    await logAudit({
      userId: g.session!.user.id,
      action: "update",
      entityType: "org_profile",
      fieldChanged: kind,
      valueAfter: { url },
    });
    return NextResponse.json({ url, kind });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unggah gagal";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
