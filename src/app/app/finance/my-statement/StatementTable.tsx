"use client";

import { useState, useEffect } from "react";

export type StatementRow = {
  key:         string;
  dateLabel:   string;
  description: string;
  account:     "CP Kitty" | "Welfare";
  debit:       number;
  credit:      number;
};

type Balance = { cpKitty: number; welfare: number };

type Props = {
  rows:        StatementRow[];
  balances:    Balance;
  memberName:  string;
  generatedOn: string; // passed from server to avoid hydration mismatch
};

const PAGE_SIZE = 15;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(Math.abs(n));
}

export function StatementTable({ rows, balances, memberName, generatedOn }: Props) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginated  = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 if rows change
  useEffect(() => { setPage(1); }, [rows.length]);

  const cpCompliant      = balances.cpKitty >= 0;
  const welfareCompliant = balances.welfare >= 0;

  return (
    <>
      {/* ── Balance summary ────────────────────────────────────── */}
      <div className="no-print mb-6 flex flex-wrap gap-3">
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${cpCompliant ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cpCompliant ? "bg-green-100" : "bg-red-100"}`}>
            {cpCompliant ? (
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">CP Kitty</p>
            <p className={`text-base font-bold tabular-nums leading-none ${cpCompliant ? "text-green-700" : "text-red-600"}`}>
              {cpCompliant ? "+" : "−"}{formatCurrency(Math.abs(balances.cpKitty))}
            </p>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${cpCompliant ? "text-green-600" : "text-red-500"}`}>
              {cpCompliant ? "Compliant" : "Arrears"}
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${welfareCompliant ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${welfareCompliant ? "bg-green-100" : "bg-red-100"}`}>
            {welfareCompliant ? (
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Welfare Kitty</p>
            <p className={`text-base font-bold tabular-nums leading-none ${welfareCompliant ? "text-green-700" : "text-red-600"}`}>
              {welfareCompliant ? "+" : "−"}{formatCurrency(Math.abs(balances.welfare))}
            </p>
            <p className={`text-[10px] font-semibold uppercase tracking-wide ${welfareCompliant ? "text-green-600" : "text-red-500"}`}>
              {welfareCompliant ? "Compliant" : "Arrears"}
            </p>
          </div>
        </div>

        {/* PDF button */}
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Download PDF
        </button>
      </div>

      {/* ── Print header (hidden on screen) ────────────────────── */}
      <div className="hidden print:block mb-6">
        <h2 className="text-lg font-bold text-slate-800">My Financial Statement</h2>
        <p className="text-sm text-slate-500">{memberName}</p>
        <p className="text-xs text-slate-400 mt-0.5">Generated {generatedOn}</p>
        <div className="mt-3 flex gap-6 text-sm">
          <span>CP Kitty: <strong className={cpCompliant ? "text-green-700" : "text-red-600"}>{cpCompliant ? "+" : "−"}{formatCurrency(Math.abs(balances.cpKitty))} ({cpCompliant ? "Compliant" : "Arrears"})</strong></span>
          <span>Welfare: <strong className={welfareCompliant ? "text-green-700" : "text-red-600"}>{welfareCompliant ? "+" : "−"}{formatCurrency(Math.abs(balances.welfare))} ({welfareCompliant ? "Compliant" : "Arrears"})</strong></span>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0 print:border print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Account</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Invoiced</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Paid</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">No records yet.</td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 print:hover:bg-transparent">
                    <td className="px-4 py-3 tabular-nums text-slate-500 whitespace-nowrap">{row.dateLabel}</td>
                    <td className="px-4 py-3 text-slate-700">{row.description}</td>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ─────────────────────────────────────────── */}
      {rows.length > PAGE_SIZE && (
        <div className="no-print mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
          </p>

          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(1)} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="First page">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5M11.25 19.5l-7.5-7.5 7.5-7.5" />
              </svg>
            </button>
            <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Previous page">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Next page">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
            <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Last page">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5M12.75 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Print footer ────────────────────────────────────────── */}
      <div className="hidden print:block mt-6 text-xs text-slate-400">
        Generated {generatedOn} · All amounts in KES
      </div>
    </>
  );
}
