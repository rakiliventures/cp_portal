"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ErrorToast } from "@/components/ui/ErrorToast";

export type PaymentAccountOption = {
  id:   string;
  code: string;
  name: string;
};

export type SerializedExpense = {
  id:                string;
  title:             string | null;
  description:       string;
  amount:            string;
  expenseDate:       string; // ISO
  categoryOrAccount: string | null;
  recordedBy:        { id: string; name: string | null } | null;
  createdAt:         string;
};

type Props = {
  expenses:        SerializedExpense[];
  canCreate:       boolean;
  paymentAccounts: PaymentAccountOption[];
};

const PAGE_SIZE = 20;

function accountLabel(code: string | null) {
  if (code === "CP-KITTY")  return { text: "CP Kitty",      cls: "bg-primary/10 text-primary" };
  if (code === "CP-WELFARE") return { text: "Welfare Kitty", cls: "bg-blue-50 text-blue-700" };
  return { text: code ?? "—", cls: "bg-slate-100 text-slate-600" };
}

function fmt(amount: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES", minimumFractionDigits: 0,
  }).format(Number(amount));
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const EMPTY_FORM = {
  categoryOrAccount: "",
  amount:            "",
  expenseDate:       "",
  title:             "",
  description:       "",
};

export function ExpensesClient({ expenses, canCreate, paymentAccounts }: Props) {
  const router = useRouter();
  const [page, setPage]         = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(expenses.length / PAGE_SIZE));
  const paginated  = expenses.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalAmount = expenses.reduce((s, e) => s + Number(e.amount), 0);

  function openModal() {
    setForm({ ...EMPTY_FORM, categoryOrAccount: paymentAccounts[0]?.code ?? "" });
    setError(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      if (!res.ok) {
        let message = `Server error (${res.status}).`;
        try {
          const data = await res.json();
          message = data.error ?? message;
        } catch { /* response wasn't JSON */ }
        setError(message);
        return;
      }
      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function field(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <>
      {/* ── Header strip ─────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Total Expenses</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-red-600">{fmt(String(totalAmount))}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Records</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-slate-800">{expenses.length}</p>
          </div>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={openModal}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Expense
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0">
        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-slate-100">
          {expenses.length === 0 ? (
            <p className="px-4 py-10 text-center text-slate-400">No expenses recorded yet.</p>
          ) : (
            paginated.map((exp) => {
              const acct = accountLabel(exp.categoryOrAccount);
              return (
                <div key={exp.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{fmtDate(exp.expenseDate)}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${acct.cls}`}>
                      {acct.text}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-800">{exp.title ?? exp.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Recorded by {exp.recordedBy?.name ?? "—"}</span>
                    <span className="tabular-nums font-bold text-red-600">{fmt(exp.amount)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Account</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">No expenses recorded yet.</td>
                </tr>
              ) : (
                paginated.map((exp) => {
                  const acct = accountLabel(exp.categoryOrAccount);
                  return (
                    <tr key={exp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-4 py-3 tabular-nums text-slate-500 whitespace-nowrap">
                        {fmtDate(exp.expenseDate)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {exp.title ?? exp.description}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${acct.cls}`}>
                          {acct.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-red-600">
                        {fmt(exp.amount)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[260px]">
                        <span className="line-clamp-2">{exp.description}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {exp.recordedBy?.name ?? "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ───────────────────────────────────────────── */}
      {expenses.length > PAGE_SIZE && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-slate-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, expenses.length)} of {expenses.length}
          </p>
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

      {/* ── Add Expense Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">Add Expense</h3>
              <button type="button" onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="overflow-y-auto">
              <div className="space-y-4 px-5 py-4">

                {/* Account */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Expense Account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.categoryOrAccount}
                    onChange={(e) => field("categoryOrAccount", e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="" disabled>Select account…</option>
                    {paymentAccounts.map((a) => (
                      <option key={a.id} value={a.code}>{a.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date + Amount (side by side) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Date Incurred <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.expenseDate}
                      onChange={(e) => field("expenseDate", e.target.value)}
                      required
                      max={new Date().toISOString().slice(0, 10)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Amount (KES) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => field("amount", e.target.value)}
                      required
                      min="1"
                      step="1"
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => field("title", e.target.value)}
                    required
                    placeholder="e.g. Venue booking — December meeting"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => field("description", e.target.value)}
                    required
                    rows={3}
                    placeholder="Provide additional details about this expense…"
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <ErrorToast message={error} onClose={() => setError("")} />
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end border-t border-slate-100 px-5 py-3">
                <button type="button" onClick={closeModal}
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60">
                  {saving ? "Saving…" : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
