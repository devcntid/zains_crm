import { Send } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { listBlastBatches } from "@/lib/db/queries/catalog";

export const metadata = { title: "Blast Batches — CRM RN", description: "Laporan blast" };

export default async function Page() {
  const rows = (await listBlastBatches()) as Array<Record<string, unknown>>;
  return (
    <EntityPage
      title="Blast Batches"
      rows={rows as never[]}
      columns={[
        { key: "id", label: "ID" },
        { key: "campaign_nama", label: "Campaign" },
        { key: "nama_vendor", label: "Vendor" },
        { key: "tgl_blast", label: "Tgl" },
        { key: "jumlah_target", label: "Target" },
        { key: "jumlah_terkirim", label: "Terkirim" },
        { key: "jumlah_closing", label: "Closing" },
        { key: "import_status", label: "Status" },
      ]}
    />
  );
}
