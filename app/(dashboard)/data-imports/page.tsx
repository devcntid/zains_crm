import { FolderUp } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { ImportWizard } from "@/components/forms/import-wizard";
import { listDataImports } from "@/lib/db/queries/catalog";

export const metadata = { title: "Imports — CRM RN", description: "Import data" };

export default async function Page() {
  const rows = (await listDataImports()) as Array<Record<string, unknown>>;
  return (
    <div>
      <ImportWizard />
      <EntityPage
        title="Data Imports"
        rows={rows as never[]}
        columns={[
          { key: "entity_type", label: "Tipe" },
          { key: "file_name", label: "File" },
          { key: "row_count_total", label: "Total" },
          { key: "row_count_new", label: "Baru" },
          { key: "row_count_merge", label: "Merge" },
          { key: "status", label: "Status" },
          { key: "uploaded_by", label: "Oleh" },
        ]}
      />
    </div>
  );
}
