"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  name: string;
  canEdit: boolean;
  canDelete: boolean;
};

export function PaymentAccountActions({ id, name, canEdit, canDelete }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete payment account "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/payment-accounts/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error ?? "Failed to delete.");
        return;
      }
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <td className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {canEdit && (
          <Link
            href={`/app/payment-accounts/${id}/edit`}
            className="font-medium text-primary hover:text-primary-light hover:underline"
          >
            Edit
          </Link>
        )}
        {canDelete && (
          <>
            {canEdit && <span className="text-slate-300">|</span>}
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </>
        )}
      </div>
    </td>
  );
}
