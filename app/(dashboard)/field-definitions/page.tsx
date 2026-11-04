import { FieldDefinitionsManager } from "@/components/forms/field-definition-form";
import { listFieldDefinitions } from "@/lib/db/queries/catalog";
import type { FieldDef } from "@/lib/org/field-value";

export const metadata = { title: "Fields — CRM RN", description: "Dynamic fields" };

export default async function Page() {
  const rows = (await listFieldDefinitions()) as FieldDef[];
  return <FieldDefinitionsManager rows={rows} />;
}
