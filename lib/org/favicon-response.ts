import { getOrgProfile } from "@/lib/db/queries/org-profile";

export async function orgFaviconResponse(): Promise<Response> {
  const org = await getOrgProfile();
  const url = org.favicon_url || org.logo_url;
  if (url) {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const type = res.headers.get("content-type")?.split(";")[0] || "image/png";
        if (type.startsWith("image/")) {
          return new Response(buf, {
            headers: {
              "Content-Type": type,
              "Cache-Control": "public, max-age=60",
            },
          });
        }
      }
    } catch {
      /* fall through to generated mark */
    }
  }

  const letter = (org.nama_singkat || org.nama || "CRM").slice(0, 2).toUpperCase();
  const color = org.primary_color || "#01665a";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="${color}"/>
    <text x="16" y="21" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="700" fill="#fff">${letter}</text>
  </svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=60",
    },
  });
}
