import Link from "next/link";
import { CircleDot, Target, Wallet } from "lucide-react";
import { DataTable } from "@/components/data-table/data-table";
import { ProspectNoteForm } from "@/components/forms/donor-form";
import { Badge } from "@/components/shared/badge";
import { getDonorById } from "@/lib/db/queries/donors";
import { listProspectNotes, listTransactionsForDonor } from "@/lib/db/queries/catalog";
import { fmtRp, toNum } from "@/lib/utils/format";
import { notFound } from "next/navigation";

export const metadata = { title: "Profil Donatur — CRM RN", description: "Detail donatur" };

export default async function DonorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const donor = (await getDonorById(id)) as Record<string, unknown> | null;
  if (!donor) notFound();
  const trx = (await listTransactionsForDonor(id)) as Array<Record<string, unknown>>;
  const notes = (await listProspectNotes(id)) as Array<Record<string, unknown>>;

  return (
    <div>
      <div className="mb-3.5 flex flex-wrap items-center gap-2.5">
        <Link href="/donors" className="rounded bg-[#e8e8e8] px-3 py-1.5 text-[12px] font-semibold">
          ← Kembali
        </Link>
        <h1 className="m-0 min-w-0 text-[18px] font-bold break-words text-[var(--primary)] md:text-[20px]">{String(donor.nama_lengkap)}</h1>
        <Badge>{String(donor.status_kontak)}</Badge>
        {donor.segmen_rfm ? <Badge>{String(donor.segmen_rfm)}</Badge> : null}
      </div>
      <div className="mb-3.5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[10px] bg-white p-[18px] shadow-sm">
          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-[#888]">
            <CircleDot size={12} /> IDENTITAS
          </div>
          <div className="text-[13px] leading-7">
            <div><strong>No. HP:</strong> {String(donor.no_hp_canonical)}</div>
            <div><strong>Email:</strong> {String(donor.email ?? "—")}</div>
            <div><strong>PIC:</strong> {String(donor.assigned_nama ?? "—")}</div>
          </div>
        </div>
        <div className="rounded-[10px] bg-white p-[18px] shadow-sm">
          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-[#888]">
            <Wallet size={12} /> DONASI
          </div>
          <div className="text-[13px] leading-7">
            <div><strong>Total:</strong> {fmtRp(toNum(donor.total_donation_lifetime))}</div>
            <div><strong>Transaksi:</strong> {String(donor.total_donation_count)}x</div>
            <div><strong>Program:</strong> {String(donor.last_donation_program_nama ?? "—")}</div>
          </div>
        </div>
        <div className="rounded-[10px] bg-white p-[18px] shadow-sm">
          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-[#888]">
            <Target size={12} /> SKOR RFM
          </div>
          <div className="mt-3 flex justify-around">
            {[
              ["Recency", donor.skor_r],
              ["Frequency", donor.skor_f],
              ["Monetary", donor.skor_m],
            ].map(([l, v]) => (
              <div key={String(l)} className="text-center">
                <div className="text-[26px] font-bold text-primary">{String(v ?? "-")}</div>
                <div className="text-[10px] text-[#888]">{String(l)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <h2 className="text-[15px] font-bold text-primary">Transaksi</h2>
      <DataTable
        data={trx.map((r) => ({
          ...r,
          nominal: fmtRp(toNum(r.nominal)),
        })) as never[]}
        columns={[
          { key: "tgl_transaksi", label: "Tanggal" },
          { key: "program_nama", label: "Program" },
          { key: "campaign_nama", label: "Campaign" },
          { key: "nominal", label: "Nominal" },
          { key: "status", label: "Status" },
        ]}
      />
      <h2 className="mt-4 text-[15px] font-bold text-primary">Prospect notes</h2>
      <ProspectNoteForm donorId={id} />
      <DataTable
        data={notes as never[]}
        columns={[
          { key: "tgl_prospek", label: "Tgl" },
          { key: "user_nama", label: "PIC" },
          { key: "respon_donatur", label: "Respon" },
          { key: "catatan_bebas", label: "Catatan" },
          { key: "source", label: "Sumber" },
        ]}
      />
    </div>
  );
}
