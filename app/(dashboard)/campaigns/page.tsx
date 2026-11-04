import { Megaphone } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { listCampaigns } from "@/lib/db/queries/catalog";

export const metadata = { title: "Campaigns — CRM RN", description: "Campaign blast" };

export default async function Page() {
  const rows = (await listCampaigns()) as Array<Record<string, unknown>>;
  return (
    <EntityPage
      title="Campaigns"
      rows={rows as never[]}
      columns={[
        { key: "id", label: "ID" },
        { key: "slug", label: "Slug" },
        { key: "nama", label: "Nama" },
        { key: "program_nama", label: "Program" },
        { key: "tipe", label: "Tipe" },
      ]}
    />
  );
}
