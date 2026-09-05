"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorToast } from "@/components/ui/ErrorToast";
import type { StatementRow } from "@/lib/statement";

export type { StatementRow };

type Balance = { cpKitty: number; welfare: number };

type Props = {
  rows:        StatementRow[];
  balances:    Balance;
  memberName:  string;
  generatedOn: string; // passed from server to avoid hydration mismatch
  memberId?:   string; // required when any row has canVerify — used to build the verify URL
};

const PAGE_SIZE = 15;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(Math.abs(n));
}

// ── Edit manual invoice modal ───────────────────────────────────────────────

export function EditInvoiceModal({
  row, memberId, onClose, onSuccess,
}: {
  row:       StatementRow;
  memberId:  string;
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState(String(Math.abs(row.rawAmountExpected ?? 0)));
  const [type,   setType]   = useState<"CP_KITTY" | "WELFARE">(row.rawKitty ?? "CP_KITTY");
  const [kind,   setKind]   = useState<"DEBIT" | "CREDIT">((row.rawAmountExpected ?? 0) < 0 ? "CREDIT" : "DEBIT");
  const [notes,  setNotes]  = useState(row.rawNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) { setError("Enter a valid amount."); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/members/${memberId}/invoices/${row.rawId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: num, type, kind, notes: notes.trim() || undefined }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save changes.");
        setSaving(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-800">Edit manual entry</h3>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Entry type</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setKind("DEBIT")}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  kind === "DEBIT" ? "border-primary bg-primary/10 text-primary" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}>
                Debit
              </button>
              <button type="button" onClick={() => setKind("CREDIT")}
                className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                  kind === "CREDIT" ? "border-primary bg-primary/10 text-primary" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }`}>
                Credit
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (KES)</label>
            <input type="number" min="1" step="1" value={amount}
              onChange={(e) => setAmount(e.target.value)} required
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kitty</label>
            <select value={type} onChange={(e) => setType(e.target.value as "CP_KITTY" | "WELFARE")}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="CP_KITTY">CP Kitty</option>
              <option value="WELFARE">Welfare Kitty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <ErrorToast message={error} onClose={() => setError("")} />
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Small icon action buttons ────────────────────────────────────────────────

export function VerifyIconButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={busy} title="Verify"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-primary transition hover:bg-primary/10 disabled:opacity-50">
      {busy ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border border-primary border-t-transparent" />
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </button>
  );
}

export function EditIconButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} title="Edit entry"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    </button>
  );
}

export function StatementTable({ rows, balances, memberName, generatedOn, memberId }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [verifyingKey, setVerifyingKey] = useState<string | null>(null);
  const [verifyError,  setVerifyError]  = useState("");
  const [editingRow,   setEditingRow]   = useState<StatementRow | null>(null);

  async function handleVerify(row: StatementRow) {
    if (!memberId) return;
    setVerifyingKey(row.key);
    setVerifyError("");
    const url = row.rowType === "invoice"
      ? `/api/members/${memberId}/invoices/${row.rawId}/verify`
      : `/api/payments/${row.rawId}/verify`;
    try {
      const res = await fetch(url, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setVerifyError(data.error ?? "Failed to verify.");
        setVerifyingKey(null);
        return;
      }
      router.refresh();
    } catch {
      setVerifyError("Network error. Please try again.");
      setVerifyingKey(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginated  = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActions = rows.some((r) => r.canEdit || r.canVerify);

  // Reset to page 1 if rows change
  useEffect(() => { setPage(1); }, [rows.length]);

  const cpCompliant      = balances.cpKitty >= 0;
  const welfareCompliant = balances.welfare >= 0;

  return (
    <>
      {editingRow && memberId && (
        <EditInvoiceModal
          row={editingRow}
          memberId={memberId}
          onClose={() => setEditingRow(null)}
          onSuccess={() => { setEditingRow(null); router.refresh(); }}
        />
      )}
      <ErrorToast message={verifyError} onClose={() => setVerifyError("")} />

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

      {/* ── Mobile card list ───────────────────────────────────── */}
      <div className="sm:hidden space-y-3 print:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No records yet.</p>
        ) : (
          paginated.map((row) => (
            <div key={row.key} className="card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 leading-snug">{row.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{row.dateLabel}</p>
                  {row.source && (
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      Created by: {row.source}
                      {row.verifiedLabel && <span className={row.verified ? "text-green-600" : "text-amber-600"}> · {row.verifiedLabel}</span>}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${row.account === "Welfare" ? "bg-blue-50 text-blue-700" : "bg-primary/10 text-primary"}`}>
                  {row.account}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Invoiced</p>
                  <p className="text-sm font-semibold tabular-nums text-red-600">
                    {row.debit > 0 ? formatCurrency(row.debit) : <span className="text-slate-300 font-normal">—</span>}
                  </p>
                </div>
                <div className="h-6 w-px bg-slate-100" />
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Paid</p>
                  <p className="text-sm font-semibold tabular-nums text-green-700">
                    {row.credit > 0 ? formatCurrency(row.credit) : <span className="text-slate-300 font-normal">—</span>}
                  </p>
                </div>
              </div>
              {(row.canVerify || row.canEdit) && (
                <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-2">
                  {row.canEdit && <EditIconButton onClick={() => setEditingRow(row)} />}
                  {row.canVerify && <VerifyIconButton onClick={() => handleVerify(row)} busy={verifyingKey === row.key} />}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Desktop table ──────────────────────────────────────── */}
      <div className="hidden sm:block card overflow-hidden p-0 print:block print:border print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Account</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Invoiced</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Paid</th>
                {hasActions && <th className="no-print px-4 py-3 text-left font-semibold text-slate-700">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={hasActions ? 6 : 5} className="px-4 py-10 text-center text-slate-400">No records yet.</td>
                </tr>
              ) : (
                paginated.map((row) => (
                  <tr key={row.key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 print:hover:bg-transparent">
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
                    {hasActions && (
                      <td className="no-print px-4 py-3">
                        <div className="flex items-center gap-2">
                          {row.canEdit && <EditIconButton onClick={() => setEditingRow(row)} />}
                          {row.canVerify && <VerifyIconButton onClick={() => handleVerify(row)} busy={verifyingKey === row.key} />}
                        </div>
                      </td>
                    )}
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
