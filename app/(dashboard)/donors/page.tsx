import { Users } from "lucide-react";
import { DonorCreateButton } from "@/components/forms/donor-form";
import { DonorsTable, QueryBuilderPanel } from "@/components/donor/donors-client";
import { listDonors } from "@/lib/db/queries/donors";

export const metadata = { title: "Donors — CRM RN", description: "Daftar donatur" };

export default async function DonorsPage() {
  const { rows, total } = await listDonors({ limit: 100 });
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users size={20} color="var(--primary)" />
          <h1 className="m-0 text-[20px] font-bold text-[var(--primary)]">Donatur ({total})</h1>
        </div>
        <DonorCreateButton />
      </div>
      <QueryBuilderPanel />
      <DonorsTable rows={rows as never[]} />
    </div>
  );
}
