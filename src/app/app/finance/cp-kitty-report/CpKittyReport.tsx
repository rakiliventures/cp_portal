"use client";

import { useRouter, usePathname } from "next/navigation";

export type MonthPayment = {
  month:  number; // 1–12
  total:  number;
};

export type ExpenseEntry = {
  id:          string;
  month:       number; // 1–12
  day:         number; // day-of-month, used for sort within month
  dateLabel:   string; // formatted e.g. "5 Jan 2025"
  title:       string | null;
  description: string;
  amount:      number;
};

type Props = {
  year:           number;
  availableYears: number[];
  balanceBF:      number;
  payments:       MonthPayment[];
  expenses:       ExpenseEntry[];
};

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function fmt(n: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency", currency: "KES", minimumFractionDigits: 0,
  }).format(Math.abs(n));
}

type LedgerRow =
  | { kind: "bf";      balance: number }
  | { kind: "payment"; month: number; amount: number;  balance: number }
  | { kind: "expense"; entry: ExpenseEntry;             balance: number }
  | { kind: "total";   totalPayments: number; totalExpenses: number; balance: number };

export function CpKittyReport({ year, availableYears, balanceBF, payments, expenses }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const now          = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Build ledger rows sorted chronologically within each month:
  // payment row comes first (start of month), then expenses sorted by day
  const ledger: LedgerRow[] = [];
  let running       = balanceBF;
  let totalPayments = 0;
  let totalExpenses = 0;

  ledger.push({ kind: "bf", balance: balanceBF });

  const maxMonth = year === currentYear ? currentMonth : 12;

  for (let m = 1; m <= maxMonth; m++) {
    const pay = payments.find((p) => p.month === m);

    // Payment row first (beginning of month)
    if (pay && pay.total > 0) {
      running += pay.total;
      totalPayments += pay.total;
      ledger.push({ kind: "payment", month: m, amount: pay.total, balance: running });
    }

    // Individual expense rows, sorted by day
    const monthExpenses = expenses
      .filter((e) => e.month === m)
      .sort((a, b) => a.day - b.day);

    for (const e of monthExpenses) {
      running -= e.amount;
      totalExpenses += e.amount;
      ledger.push({ kind: "expense", entry: e, balance: running });
    }
  }

  ledger.push({ kind: "total", totalPayments, totalExpenses, balance: running });

  const cashflow = running; // already includes BF

  function onYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    router.push(`${pathname}?year=${e.target.value}`);
  }

  return (
    <>
      {/* ── Controls bar ──────────────────────────────────────────── */}
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-slate-600">Year:</label>
          <select
            value={year}
            onChange={onYearChange}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          Print / PDF
        </button>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────── */}
      <div className="no-print mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Balance B/F</p>
          <p className={`mt-1 text-lg font-bold tabular-nums leading-none ${balanceBF >= 0 ? "text-slate-800" : "text-red-600"}`}>
            {balanceBF < 0 ? "−" : ""}{fmt(balanceBF)}
          </p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Total Collected</p>
          <p className="mt-1 text-lg font-bold tabular-nums leading-none text-green-700">{fmt(totalPayments)}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Total Expenses</p>
          <p className="mt-1 text-lg font-bold tabular-nums leading-none text-red-600">{fmt(totalExpenses)}</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${cashflow >= 0 ? "border-primary/30 bg-primary/5" : "border-red-200 bg-red-50"}`}>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Cashflow at Hand</p>
          <p className={`mt-1 text-lg font-bold tabular-nums leading-none ${cashflow >= 0 ? "text-primary" : "text-red-600"}`}>
            {cashflow < 0 ? "−" : ""}{fmt(cashflow)}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">incl. balance b/f</p>
        </div>
      </div>

      {/* ── Ledger table ──────────────────────────────────────────── */}
      <div className="card overflow-hidden p-0 print:border print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date / Period</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Payments In (KES)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Expenses Out (KES)</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Running Balance (KES)</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row, idx) => {

                if (row.kind === "bf") {
                  return (
                    <tr key="bf" className="border-b border-slate-100 bg-amber-50/60">
                      <td className="px-4 py-3 font-medium text-amber-800 whitespace-nowrap">{year - 1}</td>
                      <td className="px-4 py-3 font-medium text-amber-800">Balance Carried Forward</td>
                      <td className="px-4 py-3 text-right text-slate-300">—</td>
                      <td className="px-4 py-3 text-right text-slate-300">—</td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${row.balance >= 0 ? "text-slate-800" : "text-red-600"}`}>
                        {row.balance < 0 ? "−" : ""}{fmt(row.balance)}
                      </td>
                    </tr>
                  );
                }

                if (row.kind === "payment") {
                  return (
                    <tr key={`pay-${row.month}`} className="border-b border-slate-100 bg-green-50/40 hover:bg-green-50">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{MONTH_NAMES[row.month - 1]} {year}</td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {MONTH_NAMES[row.month - 1]} Member Contributions
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-green-700">{fmt(row.amount)}</td>
                      <td className="px-4 py-3 text-right text-slate-300">—</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${row.balance >= 0 ? "text-slate-700" : "text-red-600"}`}>
                        {row.balance < 0 ? "−" : ""}{fmt(row.balance)}
                      </td>
                    </tr>
                  );
                }

                if (row.kind === "expense") {
                  return (
                    <tr key={`exp-${row.entry.id}`} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3 tabular-nums text-slate-500 whitespace-nowrap">{row.entry.dateLabel}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {row.entry.title ?? row.entry.description}
                        {row.entry.title && row.entry.description && (
                          <span className="ml-1 text-slate-400">({row.entry.description})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-300">—</td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-600">{fmt(row.entry.amount)}</td>
                      <td className={`px-4 py-3 text-right tabular-nums font-medium ${row.balance >= 0 ? "text-slate-700" : "text-red-600"}`}>
                        {row.balance < 0 ? "−" : ""}{fmt(row.balance)}
                      </td>
                    </tr>
                  );
                }

                // total row
                return (
                  <tr key="total" className="border-t-2 border-slate-300 bg-slate-100">
                    <td className="px-4 py-3 font-bold text-slate-800" colSpan={2}>Year Total</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-green-700">{fmt(row.totalPayments)}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-red-600">{fmt(row.totalExpenses)}</td>
                    <td className={`px-4 py-3 text-right font-bold tabular-nums ${row.balance >= 0 ? "text-primary" : "text-red-600"}`}>
                      {row.balance < 0 ? "−" : ""}{fmt(row.balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print footer */}
      <div className="hidden print:block mt-6 text-xs text-slate-400">
        CP Kitty Summary Report · {year} · All amounts in KES
      </div>
    </>
  );
}
