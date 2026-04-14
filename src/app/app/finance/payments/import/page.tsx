"use client";

import Link from "next/link";
import { useState, useCallback } from "react";

type ImportRow = {
  mpesaCode: string;
  datePaid: string;
  amount: number;
  accountCode: string;
  memberIdentifier: string;
  payeeName: string;
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      cell += c;
    } else if (c === "," || c === "\t") {
      current.push(cell.trim());
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      current.push(cell.trim());
      cell = "";
      if (current.some((s) => s.length > 0)) rows.push(current);
      current = [];
    } else {
      cell += c;
    }
  }
  if (cell.length > 0 || current.length > 0) {
    current.push(cell.trim());
    if (current.some((s) => s.length > 0)) rows.push(current);
  }
  return rows;
}

function normalizeHeader(h: string): string {
  return h.toLowerCase().replace(/\s+/g, "").replace(/_/g, "");
}

export default function ImportPaymentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number; skippedDetails: { row: number; reason: string }[] } | null>(null);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setPreview(null);
    setResult(null);
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    setFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseCsv(text);
      if (rows.length < 2) {
        setError("CSV must have a header row and at least one data row.");
        return;
      }
      const headers = rows[0].map(normalizeHeader);
      const mpesaIdx = headers.findIndex((h) => h.includes("mpesa") || h.includes("receipt") || h === "code");
      const dateIdx = headers.findIndex((h) => h.includes("date") || h === "datepaid");
      const amountIdx = headers.findIndex((h) => h.includes("amount"));
      const accountIdx = headers.findIndex((h) => h.includes("account") || h.includes("kitty") || h.includes("welfare"));
      const memberIdx = headers.findIndex((h) => h.includes("member") || h.includes("phone") || h.includes("email") || h.includes("name"));
      const payeeIdx = headers.findIndex((h) => h.includes("payee") || h.includes("sender"));

      if (mpesaIdx < 0 || dateIdx < 0 || amountIdx < 0 || accountIdx < 0 || memberIdx < 0) {
        setError("CSV must include columns for: M-Pesa code, date, amount, account (CP-KITTY/CP-WELFARE), and member (phone/email/name).");
        return;
      }

      const parsed: ImportRow[] = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const mpesaCode = row[mpesaIdx] ?? "";
        const datePaid = row[dateIdx] ?? "";
        const amount = Number(row[amountIdx]) || 0;
        const accountCode = (row[accountIdx] ?? "").trim().toUpperCase();
        const memberIdentifier = row[memberIdx] ?? "";
        const payeeName = payeeIdx >= 0 ? (row[payeeIdx] ?? "").trim() : "";
        if (!mpesaCode && !datePaid && !amount && !memberIdentifier) continue;
        parsed.push({ mpesaCode, datePaid, amount, accountCode, memberIdentifier, payeeName });
      }
      setPreview(parsed);
    };
    reader.readAsText(f, "UTF-8");
  }, []);

  async function handleImport() {
    if (!preview || preview.length === 0) {
      setError("No data to import.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        setSubmitting(false);
        return;
      }
      setResult({
        created: data.created ?? 0,
        skipped: data.skipped ?? 0,
        skippedDetails: data.skippedDetails ?? [],
      });
      setSubmitting(false);
    } catch {
      setError("Import failed.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <Link
          href="/app/finance/payments"
          className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        >
          ← Back to Payments
        </Link>
      </div>
      <h1 className="page-heading">Import payments from report</h1>

      <div className="card max-w-2xl space-y-4">
        <p className="text-sm text-slate-600">
          Upload a CSV or Excel export from the paybill report. The file should have columns for: <strong>M-Pesa/Receipt code</strong>, <strong>Date</strong>, <strong>Amount</strong>, <strong>Account</strong> (CP-KITTY or CP-WELFARE), and <strong>Member</strong> (phone, email, or name). Optional: Payee name.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Select file</label>
          <input
            type="file"
            accept=".csv,.txt,text/csv,application/csv"
            onChange={handleFile}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:hover:bg-primary-light"
          />
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</div>
        )}
        {preview && preview.length > 0 && (
          <>
            <p className="text-sm text-slate-700">
              <strong>{preview.length}</strong> row(s) ready to import.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleImport}
                disabled={submitting}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {submitting ? "Importing…" : "Import payments"}
              </button>
            </div>
          </>
        )}
        {result && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-medium text-slate-800">Import complete.</p>
            <p className="mt-1 text-sm text-slate-600">
              Created: <strong>{result.created}</strong> · Skipped: <strong>{result.skipped}</strong>
            </p>
            {result.skippedDetails.length > 0 && (
              <ul className="mt-2 list-inside list-disc text-xs text-slate-600">
                {result.skippedDetails.map((s) => (
                  <li key={s.row}>Row {s.row}: {s.reason}</li>
                ))}
              </ul>
            )}
            <Link
              href="/app/finance/payments"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              View payments →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
