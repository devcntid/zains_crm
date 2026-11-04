"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SearchSelect } from "@/components/shared/search-select";

export function DonorCreateButton() {
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const router = useRouter();

  async function submit() {
    const res = await fetch("/api/donors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ namaLengkap: nama, noHpCanonical: phone, email: email || null }),
    });
    if (!res.ok) {
      toast.error("Gagal menyimpan donatur");
      return;
    }
    toast.success("Donatur dibuat");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[var(--primary)] px-3.5 text-[12px] font-semibold text-white" onClick={() => setOpen(true)}>
        + Tambah
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full rounded-t-xl bg-white p-5 sm:max-w-[400px] sm:rounded-xl">
            <h3 className="mt-0 mb-3 text-primary">Donatur baru</h3>
            <label className="mb-2 block text-[12px]">Nama</label>
            <input className="mb-2 w-full rounded border px-2 py-1.5" value={nama} onChange={(e) => setNama(e.target.value)} />
            <label className="mb-2 block text-[12px]">No. HP</label>
            <input className="mb-2 w-full rounded border px-2 py-1.5" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <label className="mb-2 block text-[12px]">Email</label>
            <input className="mb-3 w-full rounded border px-2 py-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="rounded-xl px-3 py-1.5" onClick={() => setOpen(false)}>Batal</button>
              <button className="rounded-xl bg-primary px-3 py-1.5 text-white" onClick={submit}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function ProspectNoteForm({ donorId }: { donorId: string }) {
  const [catatan, setCatatan] = useState("");
  const [respon, setRespon] = useState("merespon");
  const router = useRouter();
  return (
    <form
      className="mb-3 flex flex-col gap-2 sm:flex-row"
      onSubmit={async (e) => {
        e.preventDefault();
        await fetch("/api/prospect-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ donorId, responDonatur: respon, catatanBebas: catatan }),
        });
        setCatatan("");
        toast.success("Catatan tersimpan");
        router.refresh();
      }}
    >
      <SearchSelect
        className="sm:w-52"
        value={respon}
        allowClear={false}
        options={["belum_merespon", "hanya_read", "merespon", "closing", "gagal", "opt_out"].map((x) => ({
          value: x,
          label: x,
        }))}
        onChange={setRespon}
      />
      <input className="min-h-10 min-w-0 flex-1 rounded border px-2" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan" />
      <button className="min-h-10 rounded-xl bg-[var(--primary)] px-3 text-white" type="submit">
        Catat
      </button>
    </form>
  );
}
