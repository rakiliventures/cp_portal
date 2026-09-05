"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorToast } from "@/components/ui/ErrorToast";
import { EditInvoiceModal, VerifyIconButton, EditIconButton } from "../my-statement/StatementTable";
import type { StatementRow } from "@/lib/statement";

export type InvoiceRow = StatementRow & { memberEmail: string | null };

type Props = {
  rows:                  InvoiceRow[];
  unverifiedManualCount: number;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(Math.abs(n));
}

export function InvoicesTable({ rows, unverifiedManualCount }: Props) {
  const router = useRouter();
  const [query,          setQuery]          = useState("");
  const [pendingOnly,    setPendingOnly]     = useState(false);
  const [page,           setPage]           = useState(1);
  const [pageSize,       setPageSize]       = useState(25);
  const [verifyingKey,   setVerifyingKey]   = useState<string | null>(null);
  const [actionError,    setActionError]    = useState("");
  const [editingRow,     setEditingRow]     = useState<InvoiceRow | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (pendingOnly && r.verified !== false) return false;
      if (q) {
        const matches =
          (r.memberName ?? "").toLowerCase().includes(q) ||
          (r.memberEmail ?? "").toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [rows, query, pendingOnly]);

  useEffect(() => { setPage(1); }, [query, pendingOnly]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated   = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasFilter   = query.trim() || pendingOnly;

  async function handleVerify(row: InvoiceRow) {
    if (!row.memberId) return;
    setVerifyingKey(row.key);
    setActionError("");
    try {
      const res = await fetch(`/api/members/${row.memberId}/invoices/${row.rawId}/verify`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error ?? "Failed to verify.");
        setVerifyingKey(null);
        return;
      }
      router.refresh();
    } catch {
      setActionError("Network error. Please try again.");
      setVerifyingKey(null);
    }
  }

  return (
    <div>
      {editingRow && editingRow.memberId && (
        <EditInvoiceModal
          row={editingRow}
          memberId={editingRow.memberId}
          onClose={() => setEditingRow(null)}
          onSuccess={() => { setEditingRow(null); router.refresh(); }}
        />
      )}
      <ErrorToast message={actionError} onClose={() => setActionError("")} />

      {/* Pending verification summary */}
      {unverifiedManualCount > 0 && (
        <div className="no-print mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-amber-800">
            <span className="font-bold">{unverifiedManualCount}</span>{" "}
            manual {unverifiedManualCount === 1 ? "entry needs" : "entries need"} verification
          </p>
          <button type="button" onClick={() => setPendingOnly(true)}
            className="ml-auto rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100">
            Show unverified
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input type="search" placeholder="Search by member, email, description…"
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setPendingOnly((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${pendingOnly ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            Unverified manual only
          </button>
          {hasFilter && (
            <button type="button" onClick={() => { setQuery(""); setPendingOnly(false); }}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {hasFilter && (
        <p className="no-print mb-2 text-xs text-slate-500">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {query.trim() && <> for &ldquo;{query}&rdquo;</>}
        </p>
      )}

      {/* Mobile card list */}
      <div className="sm:hidden card overflow-hidden p-0">
        {paginated.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-500">
            {hasFilter ? "No invoices match your search." : "No invoices recorded yet."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {paginated.map((row) => (
              <li key={row.key} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{row.memberName ?? "—"}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${row.account === "Welfare" ? "bg-blue-50 text-blue-700" : "bg-primary/10 text-primary"}`}>
                    {row.account}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{row.description}</p>
                <p className="mt-1 text-xs text-slate-400">{row.dateLabel}</p>
                {row.source && (
                  <p className="mt-1 text-[11px] text-slate-400">
                    Created by: {row.source}
                    {row.verifiedLabel && <span className={row.verified ? "text-green-600" : "text-amber-600"}> · {row.verifiedLabel}</span>}
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-sm font-semibold tabular-nums ${row.debit > 0 ? "text-red-600" : "text-green-700"}`}>
                    {row.debit > 0 ? formatCurrency(row.debit) : `+${formatCurrency(row.credit)}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {row.canEdit && <EditIconButton onClick={() => setEditingRow(row)} />}
                    {row.canVerify && <VerifyIconButton onClick={() => handleVerify(row)} busy={verifyingKey === row.key} />}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Description</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Member</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Account</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Invoiced</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Credit</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {hasFilter ? "No invoices match your search." : "No invoices recorded yet."}
                  </td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                    <td className="px-4 py-3 tabular-nums text-slate-500 whitespace-nowrap">{row.dateLabel}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{row.description}</p>
                      {row.source && (
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Created by: {row.source}
                          {row.verifiedLabel && <span className={row.verified ? "text-green-600" : "text-amber-600"}> · {row.verifiedLabel}</span>}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <p>{row.memberName ?? "—"}</p>
                      <p className="text-xs text-slate-400">{row.memberEmail ?? ""}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${row.account === "Welfare" ? "bg-blue-50 text-blue-700" : "bg-primary/10 text-primary"}`}>
                        {row.account}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600">
                      {row.debit > 0 ? formatCurrency(row.debit) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-green-700">
                      {row.credit > 0 ? formatCurrency(row.credit) : <span className="text-slate-300 font-normal">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {row.canEdit && <EditIconButton onClick={() => setEditingRow(row)} />}
                        {row.canVerify && <VerifyIconButton onClick={() => handleVerify(row)} busy={verifyingKey === row.key} />}
                        {!row.canEdit && !row.canVerify && <span className="text-slate-300">—</span>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="no-print mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <label className="flex items-center gap-1.5">
              Rows:
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(1)} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5M11.25 19.5l-7.5-7.5 7.5-7.5" /></svg>
            </button>
            <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, idx) =>
                n === "…" ? (
                  <span key={`e-${idx}`} className="px-1 text-slate-400">…</span>
                ) : (
                  <button key={n} type="button" onClick={() => setPage(n as number)}
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-sm transition ${page === n ? "border-primary bg-primary font-semibold text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {n}
                  </button>
                )
              )}
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
            <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5M12.75 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
