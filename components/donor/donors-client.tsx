"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table/data-table";
import { QueryBuilder } from "@/components/query-builder/query-builder";
import { Badge } from "@/components/shared/badge";
import { fmtRp, toNum } from "@/lib/utils/format";
import { useState } from "react";

const SC: Record<string, string> = {
  champions: "#01665a",
  loyal: "#2e8b7a",
  potential: "#5cb8a8",
  at_risk: "#e74c3c",
  lost: "#95a5a6",
  new: "#3498db",
  one_time: "#f39c12",
};

type Row = {
  id: string;
  nama_lengkap: string;
  no_hp_canonical: string;
  status_kontak: string;
  segmen_rfm: string | null;
  total_donation_lifetime: string;
  assigned_nama: string | null;
};

export function QueryBuilderPanel() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const router = useRouter();
  return (
    <>
      <QueryBuilder onResults={(r) => setRows(r as Row[])} />
      {rows && (
        <div className="mb-3">
          <div className="mb-1 text-[12px] text-[#666]">Hasil query: {rows.length}</div>
          <DataTable
            data={rows}
            exportFilename="hasil-query"
            onRow={(r) => router.push(`/donors/${r.id}`)}
            columns={[
              { key: "nama_lengkap", label: "Nama" },
              { key: "no_hp_canonical", label: "HP" },
              { key: "segmen_rfm", label: "Segmen", exportValue: (d) => d.segmen_rfm || "" },
            ]}
          />
        </div>
      )}
    </>
  );
}

export function DonorsTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  return (
    <DataTable
      data={rows}
      exportFilename="donatur"
      onRow={(r) => router.push(`/donors/${r.id}`)}
      columns={[
        { key: "nama_lengkap", label: "Nama", render: (d) => <strong>{d.nama_lengkap}</strong> },
        { key: "no_hp_canonical", label: "No. HP" },
        { key: "status_kontak", label: "Status", render: (d) => <Badge>{d.status_kontak}</Badge> },
        {
          key: "segmen_rfm",
          label: "Segmen",
          render: (d) => (d.segmen_rfm ? <Badge color={SC[d.segmen_rfm] || "#999"}>{d.segmen_rfm}</Badge> : "—"),
          exportValue: (d) => d.segmen_rfm || "—",
        },
        {
          key: "total_donation_lifetime",
          label: "Total",
          render: (d) => fmtRp(toNum(d.total_donation_lifetime)),
          exportValue: (d) => fmtRp(toNum(d.total_donation_lifetime)),
        },
        {
          key: "assigned_nama",
          label: "PIC",
          render: (d) => d.assigned_nama || "—",
          exportValue: (d) => d.assigned_nama || "—",
        },
      ]}
    />
  );
}
