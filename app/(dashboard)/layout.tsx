import { AppShell } from "@/components/layout/sidebar";
import { getServerSession } from "@/lib/auth/session";
import { getOrgProfile } from "@/lib/db/queries/org-profile";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const org = await getOrgProfile();
  return (
    <div
      style={
        {
          "--primary": org.primary_color,
          "--sidebar": org.sidebar_color,
          "--accent": org.accent_color,
        } as React.CSSProperties
      }
    >
      <AppShell userNama={session.user.nama} org={org}>
        {children}
      </AppShell>
    </div>
  );
}
