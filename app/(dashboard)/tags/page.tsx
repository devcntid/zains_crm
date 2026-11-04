import { TagManager } from "@/components/forms/tag-manager";
import { listTags } from "@/lib/db/queries/tags";

export const metadata = { title: "Label donatur — CRM RN", description: "Katalog tag donatur" };

export default async function Page() {
  const rows = await listTags();
  return <TagManager rows={rows} />;
}
