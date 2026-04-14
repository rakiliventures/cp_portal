"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Account = { id: string; code: string; name: string };
type Member = { id: string; name: string; email: string };

type Props = { accounts: Account[]; members: Member[] };

export function PaymentForm({ accounts, members }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const mpesaCode = (formData.get("mpesaCode") as string)?.trim();
    const datePaid = (formData.get("datePaid") as string)?.trim();
    const amount = formData.get("amount");
    const accountId = (formData.get("accountId") as string)?.trim();
    const memberId = (formData.get("memberId") as string)?.trim();
    const payeeName = (formData.get("payeeName") as string)?.trim();

    if (!mpesaCode || !datePaid || !accountId || !memberId || !payeeName) {
      setError("M-Pesa code, date, account, member, and payee name are required.");
      setSubmitting(false);
      return;
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setError("Enter a valid amount.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mpesaCode,
          datePaid,
          amount: numAmount,
          accountId,
          memberId,
          payeeName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.push("/app/finance/payments");
      router.refresh();
    } catch {
      setError("Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
      )}
      <div>
        <label htmlFor="mpesaCode" className="mb-1 block text-sm font-medium text-slate-700">
          M-Pesa code <span className="text-red-600">*</span>
        </label>
        <input
          id="mpesaCode"
          name="mpesaCode"
          type="text"
          required
          className="input font-mono"
          placeholder="e.g. QGH12345AB"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="datePaid" className="mb-1 block text-sm font-medium text-slate-700">
            Date paid <span className="text-red-600">*</span>
          </label>
          <input id="datePaid" name="datePaid" type="date" required className="input" />
        </div>
        <div>
          <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">
            Amount (KES) <span className="text-red-600">*</span>
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            required
            min="0"
            step="0.01"
            className="input"
            placeholder="0.00"
          />
        </div>
      </div>
      <div>
        <label htmlFor="accountId" className="mb-1 block text-sm font-medium text-slate-700">
          Payment account <span className="text-red-600">*</span>
        </label>
        <select id="accountId" name="accountId" required className="input">
          <option value="">— Select —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="memberId" className="mb-1 block text-sm font-medium text-slate-700">
          Member <span className="text-red-600">*</span>
        </label>
        <select id="memberId" name="memberId" required className="input">
          <option value="">— Select —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.email})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="payeeName" className="mb-1 block text-sm font-medium text-slate-700">
          Payee name <span className="text-red-600">*</span>
        </label>
        <input
          id="payeeName"
          name="payeeName"
          type="text"
          required
          className="input"
          placeholder="Name as it appears on M-Pesa"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          {submitting ? "Saving…" : "Add payment"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
