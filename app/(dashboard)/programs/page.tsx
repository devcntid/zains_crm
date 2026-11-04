import { Bookmark } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { listPrograms } from "@/lib/db/queries/catalog";

export const metadata = { title: "Programs — CRM RN", description: "Master program" };

export default async function Page() {
  const rows = (await listPrograms()) as Array<Record<string, unknown>>;
  return (
    <EntityPage
      title="Programs"
      rows={rows as never[]}
      columns={[
        { key: "id", label: "ID" },
        { key: "slug", label: "Slug" },
        { key: "nama", label: "Nama" },
        { key: "kategori", label: "Kategori" },
        { key: "is_active", label: "Status" },
      ]}
    />
  );
}
