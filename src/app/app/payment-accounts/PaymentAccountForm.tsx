"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  account?: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isActive: boolean;
  };
};

export function PaymentAccountForm({ account }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = !!account;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const code = (formData.get("code") as string)?.trim().toUpperCase().replace(/\s+/g, "-") || "";
    const name = (formData.get("name") as string)?.trim() || "";
    const description = (formData.get("description") as string)?.trim() || null;
    const isActive = formData.get("isActive") === "on";

    if (!code || !name) {
      setError("Code and name are required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(isEdit ? `/api/payment-accounts/${account.id}` : "/api/payment-accounts", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, description, isActive }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.push("/app/payment-accounts");
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
        <label htmlFor="code" className="mb-1 block text-sm font-medium text-slate-700">
          Code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          defaultValue={account?.code}
          placeholder="e.g. CP-KITTY"
          className="input"
          required
          disabled={isEdit}
          aria-describedby={isEdit ? "code-help" : undefined}
        />
        {isEdit && (
          <p id="code-help" className="mt-1 text-xs text-slate-500">Code cannot be changed after creation.</p>
        )}
      </div>
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={account?.name}
          placeholder="e.g. CP-Kitty"
          className="input"
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
          Description (optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={account?.description ?? ""}
          className="input input-textarea min-h-[80px]"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          defaultChecked={account?.isActive ?? true}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
        />
        <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
          Active
        </label>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary min-h-[44px] px-5"
        >
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Add account"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
