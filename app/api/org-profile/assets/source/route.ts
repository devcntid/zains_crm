import { NextResponse } from "next/server";
import { guard } from "@/lib/api/guard";
import { getOrgProfile } from "@/lib/db/queries/org-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const g = await guard("app_config", "read");
  if (g.error) return g.error;
  const kind = new URL(req.url).searchParams.get("kind") === "favicon" ? "favicon" : "logo";
  const org = await getOrgProfile();
  const url = kind === "favicon" ? org.favicon_url || org.logo_url : org.logo_url;
  if (!url) return NextResponse.json({ error: "Belum ada logo" }, { status: 404 });
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return NextResponse.json({ error: "Gagal mengambil gambar" }, { status: 502 });
  const type = res.headers.get("content-type")?.split(";")[0] || "image/png";
  return new NextResponse(res.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "no-store",
    },
  });
}
