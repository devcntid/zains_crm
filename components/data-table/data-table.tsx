"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SearchSelect } from "@/components/shared/search-select";

export type Column<T> = {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

const PAGE_SIZES = [10, 25, 50, 100] as const;

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  onRow,
  selectable,
}: {
  columns: Column<T>[];
  data: T[];
  onRow?: (row: T) => void;
  selectable?: boolean;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return data;
    return data.filter((row) => {
      const rec = row as Record<string, unknown>;
      const fromCols = columns.some((c) => String(rec[c.key] ?? "").toLowerCase().includes(q));
      if (fromCols) return true;
      return Object.values(rec).some((v) => v != null && typeof v !== "object" && String(v).toLowerCase().includes(q));
    });
  }, [data, term, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = String((a as Record<string, unknown>)[sortKey] ?? "");
      const bv = String((b as Record<string, unknown>)[sortKey] ?? "");
      return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filtered, sortKey, dir]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize;
  const rows = sorted.slice(start, start + pageSize);
  const from = total === 0 ? 0 : start + 1;
  const to = start + rows.length;

  const titleCol = columns[0];
  const restCols = columns.slice(1, 5);
  const colSpan = columns.length + 1 + (selectable ? 1 : 0);

  function goto(p: number) {
    setPage(Math.max(1, Math.min(pageCount, p)));
  }

  const searchBar = (
    <div className="flex items-center gap-2 border-b border-[#eee] px-3 py-2">
      <Search size={16} className="shrink-0 text-[#888]" />
      <input
        className="min-h-9 w-full border-0 bg-transparent text-[13px] outline-none"
        placeholder="Cari di tabel…"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setPage(1);
        }}
      />
    </div>
  );

  const pager = (
    <div className="flex flex-col gap-2 px-3 py-2.5 text-[12px] text-[#555] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span>
          {total === 0 ? "Tidak ada data" : `Menampilkan ${from}–${to} dari ${total}`}
        </span>
        <label className="inline-flex items-center gap-1.5">
          <span className="text-[#888]">Baris</span>
          <SearchSelect
            className="w-[5.5rem]"
            placement="top"
            allowClear={false}
            value={String(pageSize)}
            options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
            onChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          />
        </label>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#ddd] bg-white disabled:opacity-40"
          disabled={safePage <= 1}
          onClick={() => goto(safePage - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[4.5rem] px-1 text-center font-semibold">
          {safePage} / {pageCount}
        </span>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[#ddd] bg-white disabled:opacity-40"
          disabled={safePage >= pageCount}
          onClick={() => goto(safePage + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="overflow-hidden rounded-[10px] bg-white shadow-sm md:hidden">
        {searchBar}
        <div className="space-y-2 p-2">
          {rows.length === 0 && (
            <div className="px-3 py-8 text-center text-[#999]">Tidak ada data</div>
          )}
          {rows.map((row, i) => {
            const id = String(row.id ?? start + i);
            const Tag = onRow ? "button" : "div";
            return (
              <Tag
                key={id}
                type={onRow ? "button" : undefined}
                onClick={() => onRow?.(row)}
                className="block w-full rounded-xl bg-[#f8f9fa] p-3 text-left"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-[11px] font-bold text-[#888]">{start + i + 1}.</span>
                  <div className="min-w-0 text-[14px] font-semibold text-[#1a1a1a]">
                    {titleCol?.render ? titleCol.render(row) : String((row as Record<string, unknown>)[titleCol?.key ?? ""] ?? "—")}
                  </div>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[12px]">
                  {restCols.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-[10px] font-bold tracking-wide text-[#888] uppercase">{c.label}</dt>
                      <dd className="truncate text-[#333]">
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Tag>
            );
          })}
        </div>
        {pager}
      </div>
      <div className="hidden overflow-hidden rounded-[10px] bg-white shadow-sm md:block">
        {searchBar}
        <div className="overflow-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-[12px] font-semibold text-white">
                {selectable && <th className="w-10 bg-[var(--primary)] px-3 py-2.5" />}
                <th className="w-12 bg-[var(--primary)] px-3 py-2.5">No</th>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className={`cursor-pointer bg-[var(--primary)] px-3 py-2.5 ${c.className ?? ""}`}
                    onClick={() => {
                      setSortKey(c.key);
                      setDir((d) => (sortKey === c.key && d === "asc" ? "desc" : "asc"));
                      setPage(1);
                    }}
                  >
                    <span className="inline-flex min-h-6 items-center gap-1">
                      {c.label}
                      {sortKey === c.key ? (dir === "asc" ? " ↑" : " ↓") : ""}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const id = String(row.id ?? start + i);
                return (
                  <tr
                    key={id}
                    onClick={() => onRow?.(row)}
                    className={`border-b border-[#f0f0f0] ${onRow ? "cursor-pointer hover:bg-[#f6fffe]" : ""}`}
                  >
                    {selectable && (
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked.has(id)}
                          onChange={(e) => {
                            const next = new Set(checked);
                            if (e.target.checked) next.add(id);
                            else next.delete(id);
                            setChecked(next);
                          }}
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 tabular-nums text-[#888]">{start + i + 1}</td>
                    {columns.map((c) => (
                      <td key={c.key} className="px-3 py-2">
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-3 py-8 text-center text-[#999]">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {pager}
      </div>
    </>
  );
}
