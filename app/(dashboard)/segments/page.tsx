import { Target } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { listSegments } from "@/lib/db/queries/catalog";

export const metadata = { title: "Segments — CRM RN", description: "Segmen tersimpan" };

export default async function Page() {
  const rows = (await listSegments()) as Array<Record<string, unknown>>;
  return (
    <EntityPage
      title="Segments"
      rows={rows as never[]}
      columns={[
        { key: "nama", label: "Nama" },
        { key: "last_count", label: "Count" },
        { key: "refresh_schedule", label: "Refresh" },
        { key: "dibuat_oleh_nama", label: "Oleh" },
      ]}
    />
  );
}
