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
  isRequired?: boolean;
  isSearchable?: boolean;
  isActive?: boolean;
  visibleInJson?: string[];
  sortOrder?: number;
  createdBy: string;
}) {
  const sql = getDb();
  const createdBy = input.createdBy === "0" ? null : input.createdBy;
  const rows = await sql`
    INSERT INTO field_definitions (
      slug, label, tipe, options_json, is_required, is_searchable, is_active,
      visible_in_json, sort_order, created_by
    )
    VALUES (
      ${input.slug}, ${input.label}, ${input.tipe},
      ${JSON.stringify(input.optionsJson ?? [])}::jsonb,
      ${input.isRequired ?? false}, ${input.isSearchable ?? true}, ${input.isActive ?? true},
      ${JSON.stringify(input.visibleInJson ?? ["profil", "list", "export"])}::jsonb,
      ${input.sortOrder ?? 0}, ${createdBy}
    )
    ON CONFLICT (slug) DO UPDATE SET
      label = EXCLUDED.label,
      tipe = EXCLUDED.tipe,
      options_json = EXCLUDED.options_json,
      is_required = EXCLUDED.is_required,
      is_searchable = EXCLUDED.is_searchable,
      is_active = EXCLUDED.is_active,
      visible_in_json = EXCLUDED.visible_in_json,
      sort_order = EXCLUDED.sort_order
    RETURNING *
  `;
  return jsonSafe(rows);
}

export async function updateFieldDefinition(
  id: string,
  input: {
    label?: string;
    tipe?: string;
    optionsJson?: unknown;
    isRequired?: boolean;
    isSearchable?: boolean;
    isActive?: boolean;
    visibleInJson?: string[];
    sortOrder?: number;
  },
) {
  const sql = getDb();
  const rows = await sql`
    UPDATE field_definitions SET
      label = COALESCE(${input.label ?? null}, label),
      tipe = COALESCE(${input.tipe ?? null}, tipe),
      options_json = COALESCE(${input.optionsJson != null ? JSON.stringify(input.optionsJson) : null}::jsonb, options_json),
      is_required = COALESCE(${input.isRequired ?? null}, is_required),
      is_searchable = COALESCE(${input.isSearchable ?? null}, is_searchable),
      is_active = COALESCE(${input.isActive ?? null}, is_active),
      visible_in_json = COALESCE(${input.visibleInJson ? JSON.stringify(input.visibleInJson) : null}::jsonb, visible_in_json),
      sort_order = COALESCE(${input.sortOrder ?? null}, sort_order)
    WHERE id = ${id}::bigint
    RETURNING *
  `;
  return jsonSafe(rows[0] ?? null);
}

export async function deactivateFieldDefinition(id: string) {
  const sql = getDb();
  await sql`UPDATE field_definitions SET is_active = FALSE WHERE id = ${id}::bigint`;
}

export async function listDonorDynamicValues(donorId: string) {
  const sql = getDb();
  return jsonSafe(
    await sql`
      SELECT
        fd.id, fd.slug, fd.label, fd.tipe, fd.options_json, fd.is_required, fd.is_searchable,
        fd.is_active, fd.visible_in_json, fd.sort_order,
        ddf.value_text, ddf.value_number, ddf.value_date, ddf.value_boolean, ddf.value_json
      FROM field_definitions fd
      LEFT JOIN donor_dynamic_fields ddf
        ON ddf.field_def_id = fd.id AND ddf.donor_id = ${donorId}::bigint
      WHERE fd.is_active = TRUE
      ORDER BY fd.sort_order, fd.label
    `,
  );
}

export async function saveDonorDynamicFields(
  donorId: string,
  values: Record<string, unknown>,
  updatedBy: string,
) {
  const sql = getDb();
  const defs = (await listFieldDefinitions()) as Array<{
    id: string;
    slug: string;
    tipe: string;
    is_active: boolean;
  }>;
  const userId = updatedBy === "0" ? null : updatedBy;
  for (const fd of defs) {
    if (!fd.is_active || !(fd.slug in values)) continue;
    const raw = values[fd.slug];
    let valueText: string | null = null;
    let valueNumber: string | null = null;
    let valueDate: string | null = null;
    let valueBoolean: boolean | null = null;
    let valueJson: string | null = null;
    if (raw !== null && raw !== undefined && raw !== "") {
      if (fd.tipe === "number") valueNumber = String(raw);
      else if (fd.tipe === "date") valueDate = String(raw).slice(0, 10);
      else if (fd.tipe === "boolean") valueBoolean = raw === true || raw === "true" || raw === "Ya";
      else if (fd.tipe === "multiselect") {
        const arr = Array.isArray(raw)
          ? raw
          : String(raw)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
        valueJson = JSON.stringify(arr);
      } else valueText = String(raw);
    }
    await sql`
      INSERT INTO donor_dynamic_fields (
        donor_id, field_def_id, value_text, value_number, value_date, value_boolean, value_json, updated_by
      )
      VALUES (
        ${donorId}::bigint, ${fd.id}::bigint, ${valueText}, ${valueNumber}::numeric,
        ${valueDate}::date, ${valueBoolean}, ${valueJson}::jsonb, ${userId}
      )
      ON CONFLICT (donor_id, field_def_id) DO UPDATE SET
        value_text = EXCLUDED.value_text,
        value_number = EXCLUDED.value_number,
        value_date = EXCLUDED.value_date,
        value_boolean = EXCLUDED.value_boolean,
        value_json = EXCLUDED.value_json,
        updated_by = EXCLUDED.updated_by
    `;
  }
  await sql`SELECT fn_rebuild_search_index(${donorId}::bigint)`;
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

const CORE_SEARCH_FIELDS = new Set([
  "nama",
  "no_hp",
  "email",
  "status",
  "segmen",
  "follow_up_status",
  "last_donation_date",
  "assigned_to_id",
]);

function dynCompareSql(op: string, pSlug: string, pVal: string, pBool: string, pJson: string, pNum: string, pDate: string) {
  const textExpr = `COALESCE(ddf.value_text, ddf.value_number::text, ddf.value_date::text, ddf.value_boolean::text)`;
  if (op === "contains") {
    return `(
      ${textExpr} ILIKE '%' || ${pVal} || '%'
      OR ddf.value_json ? ${pVal}
      OR ddf.value_json::text ILIKE '%' || ${pVal} || '%'
    )`;
  }
  if (op === "gte") {
    return `(
      (${pNum} ~ '^-?[0-9]+(\\.[0-9]+)?$' AND ddf.value_number >= ${pNum}::numeric)
      OR (${pDate} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND ddf.value_date >= ${pDate}::date)
    )`;
  }
  if (op === "lte") {
    return `(
      (${pNum} ~ '^-?[0-9]+(\\.[0-9]+)?$' AND ddf.value_number <= ${pNum}::numeric)
      OR (${pDate} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}' AND ddf.value_date <= ${pDate}::date)
    )`;
  }
  return `(
    ${textExpr} = ${pVal}
    OR (fd.tipe = 'boolean' AND ddf.value_boolean = ${pBool}::boolean)
    OR ddf.value_json @> ${pJson}::jsonb
  )`;
}

export async function searchDonorsByConditions(
  conditions: Array<{ field: string; op: string; value: string }>,
  match: "and" | "or" = "and",
) {
  const sql = getDb();
  const params: unknown[] = [];
  const add = (v: unknown) => {
    params.push(v);
    return `$${params.length}`;
  };
  const clauses: string[] = [];
  for (const c of conditions) {
    if (!c.field || c.value == null || c.value === "") continue;
    const field = c.field.replace(/[^a-z0-9_]/gi, "");
    if (!field) continue;
    const op = ["eq", "contains", "gte", "lte", "contains_all", "contains_any"].includes(c.op) ? c.op : "eq";
    const boolVal = c.value === "Ya" || c.value === "true" ? "true" : c.value === "Tidak" || c.value === "false" ? "false" : c.value;
    if (field === "tags") {
      const slugs = c.value
        .split(",")
        .map((s) => s.trim().replace(/[^a-z0-9_]/gi, ""))
        .filter(Boolean);
      if (slugs.length === 0) continue;
      const p = add(slugs);
      if (op === "contains_any") clauses.push(`d.tags && ${p}::text[]`);
      else clauses.push(`d.tags @> ${p}::text[]`);
    } else if (CORE_SEARCH_FIELDS.has(field)) {
      const expr = `i.search_doc->>'${field}'`;
      const p = add(c.value);
      if (op === "contains") clauses.push(`${expr} ILIKE '%' || ${p} || '%'`);
      else clauses.push(`${expr} = ${p}`);
    } else {
      const pSlug = add(field);
      const pVal = add(c.value);
      const pBool = add(boolVal);
      const pJson = add(JSON.stringify([c.value]));
      const pNum = add(c.value);
      const pDate = add(c.value);
      clauses.push(`EXISTS (
        SELECT 1 FROM donor_dynamic_fields ddf
        JOIN field_definitions fd ON fd.id = ddf.field_def_id
        WHERE ddf.donor_id = d.id AND fd.is_active = TRUE AND fd.slug = ${pSlug}
          AND ${dynCompareSql(op, pSlug, pVal, pBool, pJson, pNum, pDate)}
      )`);
    }
  }
  const filter = clauses.length === 0 ? "TRUE" : clauses.map((x) => `(${x})`).join(match === "or" ? " OR " : " AND ");
  const result = await sql.query(
    `SELECT d.id, d.nama_lengkap, d.no_hp_canonical, d.segmen_rfm, d.status_kontak, d.total_donation_lifetime,
            d.tags, u.nama AS assigned_nama,
            COALESCE((
              SELECT jsonb_object_agg(
                fd.slug,
                COALESCE(ddf.value_json, to_jsonb(ddf.value_text), to_jsonb(ddf.value_number),
                         to_jsonb(ddf.value_date), to_jsonb(ddf.value_boolean))
              )
              FROM donor_dynamic_fields ddf
              JOIN field_definitions fd ON fd.id = ddf.field_def_id AND fd.is_active = TRUE
              WHERE ddf.donor_id = d.id
            ), '{}'::jsonb) AS dynamic
     FROM donor_search_index i
     JOIN donors d ON d.id = i.donor_id
     LEFT JOIN users u ON u.id = d.assigned_to
     WHERE d.deleted_at IS NULL AND (${filter})
     ORDER BY d.nama_lengkap
     LIMIT 500`,
    params,
  );
  const rows = Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? []);
  return jsonSafe(rows);
}
