import { getDb } from "@/lib/db";
import { jsonSafe } from "@/lib/utils/serialize";
import { DEFAULT_ORG } from "@/lib/nav";

export type OrgProfile = {
  id: number;
  nama: string;
  nama_singkat: string;
  tagline: string;
  logo_url: string | null;
  favicon_url: string | null;
  primary_color: string;
  sidebar_color: string;
  accent_color: string;
  is_seed_default: boolean;
};

export function fallbackOrg(): OrgProfile {
  return {
    id: 1,
    nama: DEFAULT_ORG.nama,
    nama_singkat: DEFAULT_ORG.namaSingkat,
    tagline: DEFAULT_ORG.tagline,
    logo_url: DEFAULT_ORG.logoUrl,
    favicon_url: DEFAULT_ORG.faviconUrl,
    primary_color: DEFAULT_ORG.primaryColor,
    sidebar_color: DEFAULT_ORG.sidebarColor,
    accent_color: DEFAULT_ORG.accentColor,
    is_seed_default: true,
  };
}

export async function getOrgProfile(): Promise<OrgProfile> {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM org_profile WHERE id = 1 LIMIT 1`;
    if (!rows[0]) return fallbackOrg();
    return jsonSafe(rows[0]) as OrgProfile;
  } catch {
    return fallbackOrg();
  }
}

export async function updateOrgProfile(input: {
  nama: string;
  namaSingkat: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  sidebarColor: string;
  accentColor: string;
}) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO org_profile (
      id, nama, nama_singkat, tagline, logo_url, favicon_url,
      primary_color, sidebar_color, accent_color, is_seed_default, updated_at
    ) VALUES (
      1, ${input.nama}, ${input.namaSingkat}, ${input.tagline}, ${input.logoUrl}, ${input.faviconUrl},
      ${input.primaryColor}, ${input.sidebarColor}, ${input.accentColor}, FALSE, now()
    )
    ON CONFLICT (id) DO UPDATE SET
      nama = EXCLUDED.nama,
      nama_singkat = EXCLUDED.nama_singkat,
      tagline = EXCLUDED.tagline,
      logo_url = EXCLUDED.logo_url,
      favicon_url = EXCLUDED.favicon_url,
      primary_color = EXCLUDED.primary_color,
      sidebar_color = EXCLUDED.sidebar_color,
      accent_color = EXCLUDED.accent_color,
      is_seed_default = FALSE,
      updated_at = now()
    RETURNING *
  `;
  await sql`
    INSERT INTO app_config (key, value, description)
    VALUES ('app_name', ${input.nama}, 'Nama aplikasi')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
  return jsonSafe(rows[0]) as OrgProfile;
}
