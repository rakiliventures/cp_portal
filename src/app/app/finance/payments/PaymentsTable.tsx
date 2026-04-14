"use client";

import { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { PaymentActions } from "./PaymentActions";

export type SerializedPayment = {
  id: string;
  mpesaCode: string;
  datePaid: string;
  amount: string;
  account: { code: string; name: string };
  member: { id: string; name: string | null; email: string | null };
  payeeName: string;
  createdById: string | null;
  createdBy: { id: string; name: string } | null;
  verified: boolean;
  verifiedById: string | null;
  verifiedBy: { id: string; name: string } | null;
  verifiedAt: string | null;
};

type Props = {
  payments: SerializedPayment[];
  canEdit: boolean;
  canDelete: boolean;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function PaymentsTable({ payments, canEdit, canDelete }: Props) {
  const [query, setQuery]       = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [exportDate, setExportDate] = useState("");

  const pendingCount = payments.filter((p) => !p.verified).length;

  const filtered = useMemo(() => {
    const q    = query.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    // Include the entire "to" day by advancing to end-of-day
    const to   = dateTo   ? new Date(dateTo + "T23:59:59").getTime() : null;

    return payments.filter((p) => {
      if (q) {
        const matches =
          p.mpesaCode.toLowerCase().includes(q) ||
          (p.member.name ?? "").toLowerCase().includes(q) ||
          (p.member.email ?? "").toLowerCase().includes(q) ||
          p.payeeName.toLowerCase().includes(q) ||
          p.account.code.toLowerCase().includes(q) ||
          p.account.name.toLowerCase().includes(q);
        if (!matches) return false;
      }
      const paid = new Date(p.datePaid).getTime();
      if (from !== null && paid < from) return false;
      if (to   !== null && paid > to)   return false;
      return true;
    });
  }, [payments, query, dateFrom, dateTo]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [query, dateFrom, dateTo]);

  useEffect(() => {
    setExportDate(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  }, []);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated   = filtered.slice((page - 1) * pageSize, page * pageSize);

  const hasDateFilter = dateFrom || dateTo;

  function clearDateFilter() {
    setDateFrom("");
    setDateTo("");
  }

  function exportExcel() {
    const rows = filtered.map((p) => ({
      "M-Pesa Code":   p.mpesaCode,
      "Date Paid":     new Date(p.datePaid).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      "Amount (KES)":  Number(p.amount),
      "Account":       p.account.code,
      "Member":        p.member.name ?? p.member.email ?? "—",
      "Payee Name":    p.payeeName,
      "Created By":    p.createdById === null ? "Imported" : (p.createdBy?.name ?? "—"),
      "Verified":      p.verified ? "Yes" : "No",
      "Verified By":   p.verifiedBy?.name ?? "—",
      "Verified At":   p.verifiedAt
        ? new Date(p.verifiedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : "—",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    // Auto-size columns
    const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
    }));
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payments");
    XLSX.writeFile(wb, `payments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportPdf() {
    window.print();
  }

  return (
    <div>
      {/* Pending verification summary */}
      {pendingCount > 0 && (
        <div className="no-print mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-amber-800">
            <span className="font-bold">{pendingCount}</span>{" "}
            {pendingCount === 1 ? "payment" : "payments"} pending verification
          </p>
        </div>
      )}

      {/* Toolbar: search + date range + export */}
      <div className="no-print mb-4 flex flex-col gap-3">
        {/* Row 1: search + export */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              placeholder="Search by code, member, payee, account…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Export buttons */}
          <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Excel
          </button>
          <button
            type="button"
            onClick={exportPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            PDF
          </button>
        </div>
        </div>

        {/* Row 2: date range */}
        <div className="flex flex-wrap items-center gap-2">
          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-sm text-slate-500">Date paid:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            max={dateTo || undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary sm:w-auto"
          />
          <span className="text-sm text-slate-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            min={dateFrom || undefined}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary sm:w-auto"
          />
          {hasDateFilter && (
            <button
              type="button"
              onClick={clearDateFilter}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Match count */}
      {(query.trim() || hasDateFilter) && (
        <p className="no-print mb-2 text-xs text-slate-500">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {query.trim() && <> for &ldquo;{query}&rdquo;</>}
          {hasDateFilter && (
            <> · {dateFrom && dateTo ? `${dateFrom} – ${dateTo}` : dateFrom ? `from ${dateFrom}` : `until ${dateTo}`}</>
          )}
        </p>
      )}

      {/* Table — dual-mode layout */}

      {/* Mobile: stacked card list (hidden on sm+) */}
      <div className="card overflow-hidden p-0 sm:hidden">
        {paginated.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-500">
            {query.trim() || hasDateFilter ? "No payments match your search." : "No payments recorded yet."}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((p) => (
              <div key={p.id} className="min-h-[0px] p-4">
                {/* Row 1: M-Pesa code + amount */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-slate-800">{p.mpesaCode}</span>
                  <span className="font-bold text-slate-800">
                    KES {Number(p.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {/* Row 2: date + account badge */}
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {new Date(p.datePaid).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {p.account.code}
                  </span>
                </div>
                {/* Row 3: member name */}
                <div className="mt-1">
                  <span className="text-sm text-slate-700">
                    {p.member.name ?? p.member.email ?? "—"}
                  </span>
                </div>
                {/* Row 4: verification status + actions */}
                <div className="no-print mt-2 flex items-center justify-between">
                  {p.verified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Unverified
                    </span>
                  )}
                  <PaymentActions
                    paymentId={p.id}
                    verified={p.verified}
                    canEdit={canEdit}
                    canDelete={canDelete}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: scrollable table (hidden on mobile) */}
      <div className="card hidden overflow-hidden p-0 sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">M-Pesa Code</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Date Paid</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Amount</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Account</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Member</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Payee Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Created by</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Verified by</th>
                <th className="no-print px-4 py-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                    {query.trim() || hasDateFilter ? "No payments match your search." : "No payments recorded yet."}
                  </td>
                </tr>
              ) : (
                paginated.map((p) => {
                  const createdByLabel =
                    p.createdById === null ? "Imported" : (p.createdBy?.name ?? "—");

                  return (
                    <tr
                      key={p.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-mono text-slate-800">{p.mpesaCode}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(p.datePaid).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        KES {Number(p.amount).toLocaleString("en-KE", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{p.account.code}</span>
                        <span className="ml-1 text-slate-500">({p.account.name})</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {p.member.name ?? p.member.email ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{p.payeeName}</td>

                      {/* Created by */}
                      <td className="px-4 py-3">
                        {p.createdById === null ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            Imported
                          </span>
                        ) : (
                          <span className="text-slate-700">{createdByLabel}</span>
                        )}
                      </td>

                      {/* Verified by */}
                      <td className="px-4 py-3">
                        {p.verified ? (
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              Verified
                            </span>
                            {p.verifiedBy && (
                              <p className="mt-0.5 text-xs text-slate-500">{p.verifiedBy.name}</p>
                            )}
                            {p.verifiedAt && (
                              <p className="text-xs text-slate-400">
                                {new Date(p.verifiedAt).toLocaleDateString("en-GB", {
                                  day: "numeric", month: "short", year: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Unverified
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="no-print px-4 py-3">
                        <PaymentActions
                          paymentId={p.id}
                          verified={p.verified}
                          canEdit={canEdit}
                          canDelete={canDelete}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="no-print mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          {/* Left: count info + page size */}
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <label className="flex items-center gap-1.5">
              Rows:
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Right: page buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="First page"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5M11.25 19.5l-7.5-7.5 7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Page number pills */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, idx) =>
                n === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-slate-400">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n as number)}
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-sm transition ${
                      page === n
                        ? "border-primary bg-primary font-semibold text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}

            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Last page"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5M12.75 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Print-only footer */}
      <div className="hidden print:block mt-4 text-xs text-slate-500">
        {exportDate && <>Exported {exportDate}</>}
        {query.trim() && ` · Filtered by: "${query}"`}
      </div>
    </div>
  );
}
