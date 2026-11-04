import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import { getOrgProfile } from "@/lib/db/queries/org-profile";
import "./globals.css";

export const dynamic = "force-dynamic";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["400", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const org = await getOrgProfile();
  const v = encodeURIComponent(String(org.updated_at ?? Date.now()));
  const icon = `/icon?v=${v}`;
  return {
    title: org.nama,
    description: org.tagline || org.nama,
    icons: {
      icon: [
        { url: icon, type: "image/png", sizes: "32x32" },
        { url: `/favicon.ico?v=${v}`, sizes: "32x32" },
      ],
      apple: [{ url: `/apple-icon?v=${v}`, sizes: "180x180" }],
      shortcut: icon,
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${sourceSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
