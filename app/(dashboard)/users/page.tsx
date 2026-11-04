import { KeyRound } from "lucide-react";
import { EntityPage } from "@/components/shared/entity-page";
import { listUsers } from "@/lib/db/queries/catalog";

export const metadata = { title: "Users — CRM RN", description: "Pengguna" };

export default async function Page() {
  const rows = (await listUsers()) as Array<Record<string, unknown>>;
  return (
    <EntityPage
      title="Users"
      rows={rows as never[]}
      columns={[
        { key: "id", label: "ID" },
        { key: "nama", label: "Nama" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "is_active", label: "Aktif" },
      ]}
    />
  );
}
