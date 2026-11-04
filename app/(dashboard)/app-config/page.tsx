import { AppConfigTable } from "@/components/forms/app-config-table";
import { OrgSettingsForm } from "@/components/forms/org-settings-form";
import { listAppConfig } from "@/lib/db/queries/catalog";
import { getOrgProfile } from "@/lib/db/queries/org-profile";

export const metadata = { title: "Pengaturan lembaga", description: "Identitas dan konfigurasi operasional" };

export default async function Page() {
  const org = await getOrgProfile();
  const rows = (await listAppConfig()) as Array<{ key: string; value: string; description: string | null }>;
  return (
    <div>
      <h1 className="mt-0 mb-1 text-[20px] font-bold text-[var(--primary)]">Pengaturan lembaga</h1>
      <p className="mb-4 text-[13px] text-[#666]">Nama, logo, dan warna dipakai di seluruh aplikasi. Nilai operasional di bawah bisa diubah langsung di tabel.</p>
      <OrgSettingsForm org={org} />
      <AppConfigTable rows={rows} />
    </div>
  );
}
