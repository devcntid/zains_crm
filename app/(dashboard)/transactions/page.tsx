import { Wallet } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { listTransactions } from "@/lib/db/queries/catalog";
import { fmtRp, toNum } from "@/lib/utils/format";

export const metadata = { title: "Transactions — CRM RN", description: "Riwayat donasi" };

export default async function Page() {
  const rows = ((await listTransactions(200)) as Array<Record<string, unknown>>).map((r) => ({
    ...r,
    nominal: fmtRp(toNum(r.nominal)),
  }));
  return (
    <EntityPage
      title="Transactions"
      rows={rows as never[]}
      columns={[
        { key: "id", label: "ID" },
        { key: "nama_lengkap", label: "Donatur" },
        { key: "program_nama", label: "Program" },
        { key: "campaign_nama", label: "Campaign" },
        { key: "tgl_transaksi", label: "Tgl" },
        { key: "nominal", label: "Nominal" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
