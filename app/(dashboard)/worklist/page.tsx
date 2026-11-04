import { ClipboardList } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { worklist } from "@/lib/db/queries/donors";
import { fmtRp, toNum } from "@/lib/utils/format";

export const metadata = { title: "Worklist — CRM RN", description: "Worklist PIC" };

export default async function WorklistPage() {
  const rows = (await worklist()) as Array<Record<string, unknown>>;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <ClipboardList size={20} color="var(--primary)" />
        <h1 className="m-0 text-[20px] font-bold text-[var(--primary)]">Daftar kerja ({rows.length})</h1>
      </div>
      <DataTable
        data={rows.map((r) => ({
          ...r,
          last_donation_nominal: fmtRp(toNum(r.last_donation_nominal)),
        })) as never[]}
        columns={[
          { key: "nama_lengkap", label: "Nama" },
          { key: "no_hp_canonical", label: "HP" },
          { key: "segmen_rfm", label: "Segmen" },
          { key: "follow_up_status", label: "Follow-up" },
          { key: "follow_up_due_date", label: "Due" },
          { key: "last_donation_nominal", label: "Last" },
          { key: "priority_score", label: "Prioritas" },
        ]}
      />
    </div>
  );
}
