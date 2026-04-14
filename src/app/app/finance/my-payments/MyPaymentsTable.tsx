"use client";

import { useState } from "react";

export type MyPayment = {
  id:          string;
  mpesaCode:   string;
  datePaid:    string; // ISO
  amount:      string; // Decimal serialized as string
  accountCode: string;
  accountName: string;
  payeeName:   string;
  verified:    boolean;
  verifiedBy:  string | null;
  verifiedAt:  string | null; // ISO
};

type Props = { payments: MyPayment[] };

const PAGE_SIZE = 15;

function formatAmount(amount: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES", minimumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function MyPaymentsTable({ payments }: Props) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(payments.length / PAGE_SIZE));
  const paginated  = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const verifiedCount = payments.filter((p) => p.verified).length;
  const pendingCount  = payments.length - verifiedCount;
  const totalPaid     = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <>
      {/* Summary strip */}
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Total Paid</p>
            <p className="text-base font-bold text-slate-800 tabular-nums leading-none">{formatAmount(String(totalPaid))}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
            <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Approved</p>
            <p className="text-base font-bold text-green-700 tabular-nums leading-none">{verifiedCount}</p>
          </div>
        </div>

        {pendingCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Pending Approval</p>
              <p className="text-base font-bold text-amber-700 tabular-nums leading-none">{pendingCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date Paid</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">M-Pesa Code</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Account</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Payee Name</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No payments recorded yet.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3 tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDate(p.datePaid)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-800">{p.mpesaCode}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.accountCode === "CP-WELFARE"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {p.accountCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.payeeName}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-800">
                      {formatAmount(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      {p.verified ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            Approved
                          </span>
                          {p.verifiedBy && (
                            <p className="mt-0.5 text-[11px] text-slate-400">by {p.verifiedBy}</p>
                          )}
                          {p.verifiedAt && (
                            <p className="text-[11px] text-slate-400">{formatDate(p.verifiedAt)}</p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Pending Approval
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {payments.length > PAGE_SIZE && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, payments.length)} of {payments.length}
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
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-sm transition ${
                      page === n
                        ? "border-primary bg-primary font-semibold text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}>
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
    </>
  );
}
