import { FileText } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { listProspectNotes } from "@/lib/db/queries/catalog";

export const metadata = { title: "Prospect Notes — CRM RN", description: "Catatan prospek" };

export default async function Page() {
  const rows = (await listProspectNotes()) as Array<Record<string, unknown>>;
  return (
    <EntityPage
      title="Prospect Notes"
      rows={rows as never[]}
      columns={[
        { key: "nama_lengkap", label: "Donatur" },
        { key: "user_nama", label: "PIC" },
        { key: "tgl_prospek", label: "Tgl" },
        { key: "channel", label: "Channel" },
        { key: "respon_donatur", label: "Respon" },
        { key: "catatan_bebas", label: "Catatan" },
      ]}
    />
  );
}
