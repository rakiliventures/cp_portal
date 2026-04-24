"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorToast } from "@/components/ui/ErrorToast";

type Props = {
  paymentId: string;
  verified: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

export function PaymentActions({ paymentId, verified, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"verify" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setBusy("verify");
    setError(null);
    const res = await fetch(`/api/payments/${paymentId}/verify`, { method: "PATCH" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to verify.");
      setBusy(null);
      return;
    }
    router.refresh();
    setBusy(null);
  }

  async function handleDelete() {
    if (!confirm("Delete this payment? This cannot be undone.")) return;
    setBusy("delete");
    setError(null);
    const res = await fetch(`/api/payments/${paymentId}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Failed to delete.");
      setBusy(null);
      return;
    }
    router.refresh();
    setBusy(null);
  }

  if (verified) return null;

  return (
    <div className="flex items-center gap-1.5">
      <ErrorToast message={error} onClose={() => setError("")} />
      {canEdit && (
        <button
          type="button"
          onClick={handleVerify}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-50"
        >
          {busy === "verify" ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
          ) : (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          )}
          Verify
        </button>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:opacity-50"
        >
          {busy === "delete" ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-red-600 border-t-transparent" />
          ) : (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          )}
          Delete
        </button>
      )}
    </div>
  );
}
