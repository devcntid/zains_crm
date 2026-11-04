import { getDb } from "@/lib/db";
import { jsonSafe } from "@/lib/utils/serialize";

export type TagDef = {
  id: string;
  slug: string;
  nama: string;
  warna: string;
  deskripsi: string | null;
  is_active: boolean;
};

export function slugifyTag(nama: string) {
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 100);
}

export async function listTags() {
  const sql = getDb();
  return jsonSafe(await sql`SELECT * FROM tag_definitions ORDER BY is_active DESC, nama`) as TagDef[];
}

export async function upsertTag(input: {
  slug: string;
  nama: string;
  warna?: string;
  deskripsi?: string | null;
  isActive?: boolean;
}) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO tag_definitions (slug, nama, warna, deskripsi, is_active)
    VALUES (
      ${input.slug}, ${input.nama}, ${input.warna ?? "#01665a"},
      ${input.deskripsi ?? null}, ${input.isActive ?? true}
    )
    ON CONFLICT (slug) DO UPDATE SET
      nama = EXCLUDED.nama,
      warna = EXCLUDED.warna,
      deskripsi = EXCLUDED.deskripsi,
      is_active = EXCLUDED.is_active,
      updated_at = now()
    RETURNING *
  `;
  return jsonSafe(rows[0]);
}

export async function updateTag(
  id: string,
  input: { nama?: string; warna?: string; deskripsi?: string | null; isActive?: boolean },
) {
  const sql = getDb();
  const rows = await sql`
    UPDATE tag_definitions SET
      nama = COALESCE(${input.nama ?? null}, nama),
      warna = COALESCE(${input.warna ?? null}, warna),
      deskripsi = COALESCE(${input.deskripsi ?? null}, deskripsi),
      is_active = COALESCE(${input.isActive ?? null}, is_active),
      updated_at = now()
    WHERE id = ${id}::bigint
    RETURNING *
  `;
  return jsonSafe(rows[0] ?? null);
}

export async function deactivateTag(id: string) {
  const sql = getDb();
  const usage = await sql`
    SELECT COUNT(*)::int AS n FROM donors
    WHERE deleted_at IS NULL AND tags @> ARRAY[(SELECT slug FROM tag_definitions WHERE id = ${id}::bigint)]
  `;
  const n = (usage[0] as { n: number }).n;
  if (n > 0) {
    await sql`UPDATE tag_definitions SET is_active = FALSE, updated_at = now() WHERE id = ${id}::bigint`;
    return { deactivated: true, used: n };
  }
  await sql`DELETE FROM tag_definitions WHERE id = ${id}::bigint`;
  return { deleted: true, used: 0 };
}

export async function ensureTag(namaOrSlug: string) {
  const nama = namaOrSlug.trim();
  const slug = slugifyTag(nama);
  if (!slug) throw new Error("Nama tag tidak valid");
  const sql = getDb();
  const rows = await sql`
    INSERT INTO tag_definitions (slug, nama)
    VALUES (${slug}, ${nama})
    ON CONFLICT (slug) DO UPDATE SET is_active = TRUE
    RETURNING *
  `;
  return jsonSafe(rows[0]) as TagDef;
}

export { formatTagNames } from "@/lib/org/field-value";
