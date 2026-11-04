import { getDb } from "@/lib/db";
import { jsonSafe } from "@/lib/utils/serialize";

export type DonorListRow = {
  id: string;
  no_hp_canonical: string;
  nama_lengkap: string;
  email: string | null;
  status_kontak: string;
  segmen_rfm: string | null;
  skor_r: number | null;
  skor_f: number | null;
  skor_m: number | null;
  tags: string[];
  assigned_to: string | null;
  assigned_nama: string | null;
  dynamic: Record<string, unknown>;
  follow_up_status: string | null;
  follow_up_due_date: string | null;
  last_donation_at: string | null;
  last_donation_nominal: string | null;
  last_donation_program_nama: string | null;
  total_donation_lifetime: string;
  total_donation_count: number;
};

export async function listDonors(opts: {
  q?: string;
  page?: number;
  limit?: number;
  assignedTo?: string;
  status?: string;
  segmen?: string;
}) {
  const sql = getDb();
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 50;
  const offset = (page - 1) * limit;
  const q = opts.q?.trim();
  const rows = await sql`
    SELECT
      d.id, d.no_hp_canonical, d.nama_lengkap, d.email, d.status_kontak, d.segmen_rfm,
      d.skor_r, d.skor_f, d.skor_m, d.tags, d.assigned_to, u.nama AS assigned_nama,
      d.follow_up_status, d.follow_up_due_date, d.last_donation_at, d.last_donation_nominal,
      p.nama AS last_donation_program_nama, d.total_donation_lifetime, d.total_donation_count,
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
    LEFT JOIN programs p ON p.id = d.last_donation_program_id
    WHERE d.deleted_at IS NULL
      AND (${q ?? null}::text IS NULL OR i.search_doc->>'nama' ILIKE '%' || lower(${q ?? ""}) || '%'
           OR d.no_hp_canonical ILIKE '%' || ${q ?? ""} || '%')
      AND (${opts.assignedTo ?? null}::text IS NULL OR d.assigned_to = ${opts.assignedTo ?? null}::bigint)
      AND (${opts.status ?? null}::text IS NULL OR i.search_doc->>'status' = ${opts.status ?? ""})
      AND (${opts.segmen ?? null}::text IS NULL OR i.search_doc->>'segmen' = ${opts.segmen ?? ""})
    ORDER BY d.updated_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const countRows = await sql`
    SELECT COUNT(*)::int AS n
    FROM donor_search_index i
    JOIN donors d ON d.id = i.donor_id
    WHERE d.deleted_at IS NULL
      AND (${q ?? null}::text IS NULL OR i.search_doc->>'nama' ILIKE '%' || lower(${q ?? ""}) || '%'
           OR d.no_hp_canonical ILIKE '%' || ${q ?? ""} || '%')
  `;
  return jsonSafe({ rows: rows as DonorListRow[], total: (countRows[0] as { n: number }).n, page, limit });
}

export async function getDonorById(id: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT d.*, u.nama AS assigned_nama, p.nama AS last_donation_program_nama, p.slug AS last_donation_program_slug
    FROM donors d
    LEFT JOIN users u ON u.id = d.assigned_to
    LEFT JOIN programs p ON p.id = d.last_donation_program_id
    WHERE d.id = ${id} AND d.deleted_at IS NULL
  `;
  return jsonSafe(rows[0] ?? null);
}

export async function getDonorByPhone(phone: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT d.*, u.nama AS assigned_nama
    FROM donors d
    LEFT JOIN users u ON u.id = d.assigned_to
    WHERE d.no_hp_canonical = ${phone} AND d.deleted_at IS NULL
  `;
  return jsonSafe(rows[0] ?? null);
}

export async function createDonor(input: {
  noHpCanonical: string;
  namaLengkap: string;
  email?: string | null;
  statusKontak?: string;
  tags?: string[];
  assignedTo?: string | null;
}) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO donors (no_hp_canonical, nama_lengkap, email, status_kontak, tags, assigned_to, assigned_at, sumber_registrasi)
    VALUES (
      ${input.noHpCanonical}, ${input.namaLengkap}, ${input.email ?? null},
      ${input.statusKontak ?? "aktif"}, ${input.tags ?? []}, ${input.assignedTo ?? null},
      ${input.assignedTo ? new Date().toISOString() : null}, 'manual'
    )
    RETURNING *
  `;
  const donor = rows[0] as { id: string };
  await sql`SELECT fn_rebuild_search_index(${donor.id}::bigint)`;
  return rows[0];
}

export async function updateDonor(id: string, patch: Record<string, unknown>) {
  const sql = getDb();
  const nama = (patch.namaLengkap as string) ?? null;
  const email = (patch.email as string) ?? null;
  const status = (patch.statusKontak as string) ?? null;
  const assignedTo = (patch.assignedTo as string) ?? null;
  const followUp = (patch.followUpStatus as string) ?? null;
  const due = (patch.followUpDueDate as string) ?? null;
  const tags = (patch.tags as string[]) ?? null;
  await sql`
    UPDATE donors SET
      nama_lengkap = COALESCE(${nama}, nama_lengkap),
      email = COALESCE(${email}, email),
      status_kontak = COALESCE(${status}, status_kontak),
      assigned_to = COALESCE(${assignedTo}::bigint, assigned_to),
      follow_up_status = COALESCE(${followUp}, follow_up_status),
      follow_up_due_date = COALESCE(${due}::date, follow_up_due_date),
      tags = COALESCE(${tags}::text[], tags)
    WHERE id = ${id}
  `;
  await sql`SELECT fn_rebuild_search_index(${id}::bigint)`;
  return getDonorById(id);
}

export async function addDonorTag(id: string, slug: string) {
  const sql = getDb();
  await sql`
    UPDATE donors SET tags = CASE
      WHEN tags @> ARRAY[${slug}]::text[] THEN tags
      ELSE array_append(tags, ${slug})
    END
    WHERE id = ${id}::bigint AND deleted_at IS NULL
  `;
  await sql`SELECT fn_rebuild_search_index(${id}::bigint)`;
  return getDonorById(id);
}

export async function removeDonorTag(id: string, slug: string) {
  const sql = getDb();
  await sql`
    UPDATE donors SET tags = array_remove(tags, ${slug})
    WHERE id = ${id}::bigint AND deleted_at IS NULL
  `;
  await sql`SELECT fn_rebuild_search_index(${id}::bigint)`;
  return getDonorById(id);
}

export async function softDeleteDonor(id: string) {
  const sql = getDb();
  await sql`UPDATE donors SET deleted_at = now() WHERE id = ${id}`;
}

export async function assignDonors(ids: string[], assignedTo: string | null, assignedBy: string) {
  const sql = getDb();
  for (const id of ids) {
    const current = await sql`SELECT assigned_to FROM donors WHERE id = ${id}`;
    const from = current[0] ? String((current[0] as { assigned_to: string | null }).assigned_to) : null;
    await sql`
      UPDATE donors SET assigned_to = ${assignedTo}, assigned_at = now(),
        follow_up_status = COALESCE(follow_up_status, 'in_progress')
      WHERE id = ${id}
    `;
    await sql`
      INSERT INTO donor_assignment_history (donor_id, assigned_from, assigned_to, assigned_by, reason)
      VALUES (${id}, ${from}, ${assignedTo}, ${assignedBy}, 'bulk assign')
    `;
    await sql`SELECT fn_rebuild_search_index(${id}::bigint)`;
  }
}

export async function dashboardStats() {
  const sql = getDb();
  const [totals] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE deleted_at IS NULL)::int AS donors,
      COUNT(*) FILTER (WHERE deleted_at IS NULL AND status_kontak = 'aktif')::int AS aktif,
      COUNT(*) FILTER (WHERE deleted_at IS NULL AND assigned_to IS NOT NULL)::int AS assigned,
      COALESCE(SUM(total_donation_lifetime) FILTER (WHERE deleted_at IS NULL), 0) AS lifetime
    FROM donors
  `;
  const rfm = await sql`
    SELECT COALESCE(segmen_rfm, 'unscored') AS segmen, COUNT(*)::int AS n
    FROM donors WHERE deleted_at IS NULL
    GROUP BY 1 ORDER BY n DESC
  `;
  const trend = await sql`
    SELECT bulan_program AS bulan, COALESCE(SUM(nominal),0) AS total, COUNT(*)::int AS n
    FROM transactions WHERE status = 'paid'
    GROUP BY 1 ORDER BY 1 DESC LIMIT 12
  `;
  const workload = await sql`
    SELECT u.nama, COUNT(d.id)::int AS n
    FROM users u
    LEFT JOIN donors d ON d.assigned_to = u.id AND d.deleted_at IS NULL
    WHERE u.role IN ('tim_blast','supervisor') AND u.deleted_at IS NULL
    GROUP BY u.id, u.nama
    ORDER BY n DESC
  `;
  const byProgram = await sql`
    SELECT p.nama, COALESCE(SUM(t.nominal) FILTER (WHERE t.status = 'paid'), 0) AS total,
           COUNT(t.id) FILTER (WHERE t.status = 'paid')::int AS n
    FROM programs p
    LEFT JOIN transactions t ON t.program_id = p.id
    GROUP BY p.id, p.nama
    HAVING COUNT(t.id) FILTER (WHERE t.status = 'paid') > 0
    ORDER BY total DESC
    LIMIT 8
  `;
  const byStatus = await sql`
    SELECT status_kontak AS name, COUNT(*)::int AS value
    FROM donors WHERE deleted_at IS NULL
    GROUP BY 1 ORDER BY value DESC
  `;
  const byFollow = await sql`
    SELECT COALESCE(follow_up_status, 'belum') AS name, COUNT(*)::int AS n
    FROM donors
    WHERE deleted_at IS NULL AND assigned_to IS NOT NULL
    GROUP BY 1 ORDER BY n DESC
  `;
  return jsonSafe({ totals: totals as Record<string, unknown>, rfm, trend, workload, byProgram, byStatus, byFollow });
}

export async function worklist(assignedTo?: string) {
  const sql = getDb();
  return jsonSafe(
    await sql`
    SELECT * FROM v_donor_worklist
    WHERE (${assignedTo ?? null}::text IS NULL OR assigned_to = ${assignedTo ?? null}::bigint)
    ORDER BY priority_score DESC, follow_up_due_date ASC NULLS LAST
    LIMIT 200
  `,
  );
}
