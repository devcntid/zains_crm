import { UsersManager } from "@/components/forms/users-manager";
import { listUsers } from "@/lib/db/queries/catalog";

export const metadata = { title: "Users — CRM RN", description: "Pengguna" };

export default async function Page() {
  const rows = (await listUsers()) as never[];
  return <UsersManager rows={rows} />;
}
