import { getDb } from "@/lib/db";
import { jsonSafe } from "@/lib/utils/serialize";

export async function listPrograms() {
  const sql = getDb();
  return jsonSafe(await sql`SELECT * FROM programs ORDER BY sort_order, nama`);
}
export async function upsertProgram(input: {
  id?: string;
  slug: string;
  nama: string;
  kategori: string;
  deskripsi?: string;
  createdBy: string;
}) {
  const sql = getDb();
  if (input.id) {
    return sql`
      UPDATE programs SET nama = ${input.nama}, kategori = ${input.kategori}, deskripsi = ${input.deskripsi ?? null}
      WHERE id = ${input.id} RETURNING *
    `;
  }
  return sql`
    INSERT INTO programs (slug, nama, kategori, deskripsi, created_by)
    VALUES (${input.slug}, ${input.nama}, ${input.kategori}, ${input.deskripsi ?? null}, ${input.createdBy})
    RETURNING *
  `;
}

export async function listCampaigns() {
  const sql = getDb();
  return jsonSafe(await sql`
    SELECT c.*, p.nama AS program_nama
    FROM campaigns c LEFT JOIN programs p ON p.id = c.program_id
    ORDER BY c.tgl_mulai DESC NULLS LAST, c.nama
  `);
}
export async function upsertCampaign(input: {
  id?: string;
  slug: string;
  nama: string;
  tipe: string;
  programId?: string | null;
  tglMulai?: string | null;
  tglSelesai?: string | null;
  createdBy: string;
}) {
  const sql = getDb();
  if (input.id) {
    return sql`
      UPDATE campaigns SET nama = ${input.nama}, tipe = ${input.tipe}, program_id = ${input.programId ?? null},
        tgl_mulai = ${input.tglMulai ?? null}, tgl_selesai = ${input.tglSelesai ?? null}
      WHERE id = ${input.id} RETURNING *
    `;
  }
  return sql`
    INSERT INTO campaigns (slug, nama, tipe, program_id, tgl_mulai, tgl_selesai, created_by)
    VALUES (${input.slug}, ${input.nama}, ${input.tipe}, ${input.programId ?? null}, ${input.tglMulai ?? null}, ${input.tglSelesai ?? null}, ${input.createdBy})
    RETURNING *
  `;
}

export async function listTransactions(limit = 100) {
  const sql = getDb();
  return jsonSafe(await sql`
    SELECT t.*, d.nama_lengkap, p.nama AS program_nama, c.nama AS campaign_nama
    FROM transactions t
    JOIN donors d ON d.id = t.donor_id
    JOIN programs p ON p.id = t.program_id
    LEFT JOIN campaigns c ON c.id = t.campaign_id
    ORDER BY t.tgl_transaksi DESC, t.id DESC
    LIMIT ${limit}
  `);
}

export async function listTransactionsForDonor(donorId: string) {
  const sql = getDb();
  return jsonSafe(await sql`
    SELECT t.*, p.nama AS program_nama, c.nama AS campaign_nama
    FROM transactions t
    JOIN programs p ON p.id = t.program_id
    LEFT JOIN campaigns c ON c.id = t.campaign_id
    WHERE t.donor_id = ${donorId}
    ORDER BY t.tgl_transaksi DESC
  `);
}

export async function createTransaction(input: {
  donorId: string;
  programId: string;
  campaignId?: string | null;
  tglTransaksi: string;
  nominal: number;
  status?: string;
  sumber?: string;
}) {
  const sql = getDb();
  const bulan = input.tglTransaksi.slice(0, 7);
  const rows = await sql`
    INSERT INTO transactions (donor_id, program_id, campaign_id, tgl_transaksi, bulan_program, nominal, status, sumber)
    VALUES (${input.donorId}, ${input.programId}, ${input.campaignId ?? null}, ${input.tglTransaksi}, ${bulan}, ${input.nominal}, ${input.status ?? "paid"}, ${input.sumber ?? "manual"})
    RETURNING *
  `;
  await sql`SELECT fn_rebuild_search_index(${input.donorId}::bigint)`;
  return rows[0];
}

export async function listUsers() {
  const sql = getDb();
  return jsonSafe(
    await sql`SELECT id, nama, email, role, is_active, last_login_at, created_at FROM users WHERE deleted_at IS NULL ORDER BY id`,
  );
}

export async function listFieldDefinitions() {
  const sql = getDb();
  return jsonSafe(await sql`SELECT * FROM field_definitions ORDER BY sort_order, label`);
}

export async function upsertFieldDefinition(input: {
  slug: string;
  label: string;
  tipe: string;
  optionsJson?: unknown;
  createdBy: string;
}) {
  const sql = getDb();
  return sql`
    INSERT INTO field_definitions (slug, label, tipe, options_json, created_by)
    VALUES (${input.slug}, ${input.label}, ${input.tipe}, ${JSON.stringify(input.optionsJson ?? [])}::jsonb, ${input.createdBy})
    ON CONFLICT (slug) DO UPDATE SET label = EXCLUDED.label, tipe = EXCLUDED.tipe
    RETURNING *
  `;
}

export async function listVendorProfiles() {
  const sql = getDb();
  return jsonSafe(await sql`SELECT * FROM vendor_profiles ORDER BY is_default DESC, nama_vendor`);
}

export async function listBlastBatches() {
  const sql = getDb();
  return jsonSafe(await sql`
    SELECT b.*, c.nama AS campaign_nama, v.nama_vendor, u.nama AS imported_by_nama
    FROM blast_batches b
    LEFT JOIN campaigns c ON c.id = b.campaign_id
    LEFT JOIN vendor_profiles v ON v.id = b.vendor_profile_id
    JOIN users u ON u.id = b.diimport_oleh
    ORDER BY b.tgl_blast DESC
  `);
}

export async function listProspectNotes(donorId?: string) {
  const sql = getDb();
  return jsonSafe(await sql`
    SELECT n.*, d.nama_lengkap, u.nama AS user_nama, c.nama AS campaign_nama
    FROM prospect_notes n
    JOIN donors d ON d.id = n.donor_id
    JOIN users u ON u.id = n.user_id
    LEFT JOIN campaigns c ON c.id = n.campaign_id
    WHERE (${donorId ?? null}::text IS NULL OR n.donor_id = ${donorId ?? null}::bigint)
    ORDER BY n.created_at DESC
    LIMIT 200
  `);
}

export async function createProspectNote(input: {
  donorId: string;
  userId: string;
  campaignId?: string | null;
  tglProspek?: string;
  channel?: string;
  responDonatur?: string | null;
  catatanBebas?: string | null;
  source?: string;
}) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO prospect_notes (donor_id, user_id, campaign_id, tgl_prospek, channel, respon_donatur, catatan_bebas, source)
    VALUES (
      ${input.donorId}, ${input.userId}, ${input.campaignId ?? null},
      ${input.tglProspek ?? new Date().toISOString().slice(0, 10)},
      ${input.channel ?? "manual"}, ${input.responDonatur ?? null}, ${input.catatanBebas ?? null},
      ${input.source ?? "web_app"}
    )
    RETURNING *
  `;
  await sql`SELECT fn_rebuild_search_index(${input.donorId}::bigint)`;
  return rows[0];
}

export async function listSegments() {
  const sql = getDb();
  return jsonSafe(await sql`
    SELECT s.*, u.nama AS dibuat_oleh_nama
    FROM saved_segments s JOIN users u ON u.id = s.dibuat_oleh
    ORDER BY s.updated_at DESC
  `);
}

export async function createSegment(input: {
  nama: string;
  deskripsi?: string;
  queryJson: unknown;
  isPublic?: boolean;
  dibuatOleh: string;
}) {
  const sql = getDb();
  return sql`
    INSERT INTO saved_segments (nama, deskripsi, query_json, is_public, dibuat_oleh)
    VALUES (${input.nama}, ${input.deskripsi ?? null}, ${JSON.stringify(input.queryJson)}::jsonb, ${input.isPublic ?? true}, ${input.dibuatOleh})
    RETURNING *
  `;
}

export async function listDataImports() {
  const sql = getDb();
  return jsonSafe(await sql`
    SELECT i.*, u.nama AS uploaded_by
    FROM data_imports i JOIN users u ON u.id = i.diupload_oleh
    ORDER BY i.created_at DESC
  `);
}

export async function listAppConfig() {
  const sql = getDb();
  return jsonSafe(await sql`SELECT * FROM app_config ORDER BY key`);
}

export async function upsertAppConfig(key: string, value: string) {
  const sql = getDb();
  return jsonSafe(await sql`
    INSERT INTO app_config (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    RETURNING *
  `);
}

export async function listExtensionConfigs() {
  const sql = getDb();
  return jsonSafe(await sql`SELECT * FROM extension_configs ORDER BY ext_type`);
}

export async function getExtensionConfig(extType: string) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM extension_configs WHERE ext_type = ${extType}`;
  return rows[0] ?? null;
}

export async function searchDonorsByConditions(conditions: Array<{ field: string; op: string; value: string }>) {
  const sql = getDb();
  const parts: string[] = ["d.deleted_at IS NULL"];
  for (const c of conditions) {
    if (!c.field || !c.value) continue;
    const field = c.field.replace(/[^a-z0-9_]/gi, "");
    if (c.op === "eq") parts.push(`i.search_doc->>'${field}' = '${c.value.replace(/'/g, "''")}'`);
    else if (c.op === "contains") parts.push(`i.search_doc->>'${field}' ILIKE '%${c.value.replace(/'/g, "''")}%'`);
  }
  const where = parts.join(" AND ");
  return sql.query(
    `SELECT d.id, d.nama_lengkap, d.no_hp_canonical, d.segmen_rfm, d.status_kontak, d.total_donation_lifetime
     FROM donor_search_index i JOIN donors d ON d.id = i.donor_id
     WHERE ${where}
     ORDER BY d.nama_lengkap
     LIMIT 200`,
  );
}
