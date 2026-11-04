import { Settings } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { listFieldDefinitions } from "@/lib/db/queries/catalog";

export const metadata = { title: "Fields — CRM RN", description: "Dynamic fields" };

export default async function Page() {
  const rows = (await listFieldDefinitions()) as Array<Record<string, unknown>>;
  return (
    <EntityPage
      title="Dynamic Fields"
      rows={rows as never[]}
      columns={[
        { key: "slug", label: "Slug" },
        { key: "label", label: "Label" },
        { key: "tipe", label: "Tipe" },
        { key: "is_searchable", label: "Searchable" },
      ]}
    />
  );
}
