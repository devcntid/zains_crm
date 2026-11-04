"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SearchSelect, type SelectOption } from "@/components/shared/search-select";

const FIELDS: SelectOption[] = [
  { value: "segmen", label: "Segmen RFM" },
  { value: "status", label: "Status kontak" },
  { value: "follow_up_status", label: "Follow-up" },
  { value: "nama", label: "Nama" },
];

const OPS: SelectOption[] = [
  { value: "eq", label: "sama dengan" },
  { value: "contains", label: "mengandung" },
];

const SEGMEN: SelectOption[] = ["champions", "loyal", "potential", "at_risk", "lost", "new", "one_time"].map((v) => ({
  value: v,
  label: v,
}));
const STATUS: SelectOption[] = ["aktif", "mati", "diblokir", "opt_out"].map((v) => ({ value: v, label: v }));
const FOLLOW: SelectOption[] = ["in_progress", "waiting_callback", "closing", "failed"].map((v) => ({
  value: v,
  label: v,
}));

function mapDonors(json: unknown): SelectOption[] {
  const rows = (json as { rows?: Array<{ nama_lengkap: string; no_hp_canonical: string }> }).rows ?? [];
  return rows.map((r) => ({
    value: r.nama_lengkap,
    label: `${r.nama_lengkap} · ${r.no_hp_canonical}`,
  }));
}

export function QueryBuilder({
  onResults,
}: {
  onResults: (rows: unknown[]) => void;
}) {
  const [conditions, setConditions] = useState([{ field: "segmen", op: "eq", value: "" }]);

  async function run() {
    const res = await fetch("/api/donors/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditions: conditions.filter((c) => c.value) }),
    });
    const json = await res.json();
    onResults(json.rows ?? []);
    toast.success(`${(json.rows ?? []).length} donatur`);
  }

  async function save() {
    const name = prompt("Nama segmen?");
    if (!name) return;
    await fetch("/api/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nama: name, queryJson: { conditions } }),
    });
    toast.success("Segmen disimpan");
  }

  function patch(i: number, next: Partial<(typeof conditions)[0]>) {
    const copy = [...conditions];
    copy[i] = { ...copy[i], ...next };
    setConditions(copy);
  }

  return (
    <div className="mb-3 rounded-[10px] border border-[#d9efe9] bg-white p-3 md:p-4">
      <div className="mb-2 text-[12px] font-bold text-[var(--primary)]">Filter donatur</div>
      {conditions.map((c, i) => (
        <div key={i} className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SearchSelect
            value={c.field}
            options={FIELDS}
            allowClear={false}
            onChange={(field) => patch(i, { field, value: "" })}
          />
          <SearchSelect value={c.op} options={OPS} allowClear={false} onChange={(op) => patch(i, { op })} />
          {c.field === "segmen" && (
            <SearchSelect value={c.value} options={SEGMEN} placeholder="Pilih segmen" onChange={(value) => patch(i, { value })} />
          )}
          {c.field === "status" && (
            <SearchSelect value={c.value} options={STATUS} placeholder="Pilih status" onChange={(value) => patch(i, { value })} />
          )}
          {c.field === "follow_up_status" && (
            <SearchSelect value={c.value} options={FOLLOW} placeholder="Pilih follow-up" onChange={(value) => patch(i, { value })} />
          )}
          {c.field === "nama" && (
            <SearchSelect
              value={c.value}
              loadUrl="/api/donors"
              searchParam="q"
              mapRows={mapDonors}
              placeholder="Cari nama donatur"
              onChange={(value) => patch(i, { value })}
            />
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button className="min-h-10 flex-1 rounded-xl bg-[#e8e8e8] px-3 text-[12px] font-semibold sm:flex-none" onClick={() => setConditions([...conditions, { field: "segmen", op: "eq", value: "" }])}>
          + Kondisi
        </button>
        <button className="min-h-10 flex-1 rounded-xl bg-[var(--primary)] px-3 text-[12px] font-semibold text-white sm:flex-none" onClick={run}>
          Jalankan
        </button>
        <button className="min-h-10 flex-1 rounded-xl bg-[var(--accent)] px-3 text-[12px] font-semibold text-white sm:flex-none" onClick={save}>
          Simpan segmen
        </button>
      </div>
    </div>
  );
}
