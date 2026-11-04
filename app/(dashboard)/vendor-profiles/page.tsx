import { Plug } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { listVendorProfiles } from "@/lib/db/queries/catalog";

export const metadata = { title: "Vendors — CRM RN", description: "Profil vendor blast" };

export default async function Page() {
  const rows = (await listVendorProfiles()) as Array<Record<string, unknown>>;
  return (
    <EntityPage
      title="Vendor Profiles"
      rows={rows as never[]}
      columns={[
        { key: "id", label: "ID" },
        { key: "nama_vendor", label: "Nama" },
        { key: "is_default", label: "Default" },
      ]}
    />
  );
}
