"use client";

import { useState } from "react";
import { ErrorToast } from "@/components/ui/ErrorToast";

export type BudgetItem = {
  id:            string;
  title:         string;
  date:          string; // ISO string
  forecastAmount: string | number;
  recordedBy:    { name: string | null } | null;
  createdAt:     string;
};

type Props = {
  initialItems: BudgetItem[];
  canCreate:    boolean;
  canEdit:      boolean;
  canDelete:    boolean;
};

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtAmount(v: string | number) {
  return Number(v).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── shared modal shell ────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── form fields ───────────────────────────────────────────────────────────────

function BudgetFormFields({ defaults }: { defaults?: { title: string; date: string; amount: string } }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
          Title <span className="text-red-600">*</span>
        </label>
        <input
          id="title" name="title" type="text" required className="input"
          placeholder="e.g. Annual Retreat Costs"
          defaultValue={defaults?.title ?? ""}
        />
      </div>
      <div>
        <label htmlFor="date" className="mb-1 block text-sm font-medium text-slate-700">
          Date <span className="text-red-600">*</span>
        </label>
        <input id="date" name="date" type="date" required className="input" defaultValue={defaults?.date ?? ""} />
      </div>
      <div>
        <label htmlFor="amount" className="mb-1 block text-sm font-medium text-slate-700">
          Amount (KES) <span className="text-red-600">*</span>
        </label>
        <input
          id="amount" name="amount" type="number" required min="0" step="0.01" className="input"
          placeholder="0.00"
          defaultValue={defaults?.amount ?? ""}
        />
      </div>
    </div>
  );
}

// ── add modal ─────────────────────────────────────────────────────────────────

function AddBudgetModal({ onClose, onAdded }: { onClose: () => void; onAdded: (item: BudgetItem) => void }) {
  const [error,     setError]     = useState<string | null>(null);
  const [saving,    setSaving]    = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/budget", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        title:  (fd.get("title") as string)?.trim(),
        date:   fd.get("date") as string,
        amount: fd.get("amount") as string,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setSaving(false); return; }
    onAdded(data);
    onClose();
  }

  return (
    <ModalShell title="Add Budget Item" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorToast message={error ?? ""} onClose={() => setError(null)} />
        <BudgetFormFields />
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light disabled:opacity-70">
            {saving ? "Saving…" : "Add item"}
          </button>
          <button type="button" onClick={onClose}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── edit modal ────────────────────────────────────────────────────────────────

function EditBudgetModal({ item, onClose, onUpdated }: { item: BudgetItem; onClose: () => void; onUpdated: (item: BudgetItem) => void }) {
  const [error,  setError]  = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // date input needs YYYY-MM-DD
  const dateInput = new Date(item.date).toISOString().slice(0, 10);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/budget/${item.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        title:  (fd.get("title") as string)?.trim(),
        date:   fd.get("date") as string,
        amount: fd.get("amount") as string,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setSaving(false); return; }
    onUpdated(data);
    onClose();
  }

  return (
    <ModalShell title="Edit Budget Item" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorToast message={error ?? ""} onClose={() => setError(null)} />
        <BudgetFormFields defaults={{ title: item.title, date: dateInput, amount: String(item.forecastAmount) }} />
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light disabled:opacity-70">
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={onClose}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── delete modal ──────────────────────────────────────────────────────────────

function DeleteBudgetModal({ item, onClose, onDeleted }: { item: BudgetItem; onClose: () => void; onDeleted: (id: string) => void }) {
  const [error,   setError]   = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/budget/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete.");
      setDeleting(false);
      return;
    }
    onDeleted(item.id);
    onClose();
  }

  return (
    <ModalShell title="Delete Budget Item" onClose={onClose}>
      <div className="space-y-4">
        <ErrorToast message={error ?? ""} onClose={() => setError(null)} />
        <p className="text-sm text-slate-700">
          Are you sure you want to delete <span className="font-semibold">{item.title}</span>? This cannot be undone.
        </p>
        <div className="flex gap-3 pt-1">
          <button onClick={handleDelete} disabled={deleting}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-md transition hover:bg-red-700 disabled:opacity-70">
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button onClick={onClose}
            className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function BudgetClient({ initialItems, canCreate, canEdit, canDelete }: Props) {
  const [items,      setItems]      = useState<BudgetItem[]>(initialItems);
  const [showAdd,    setShowAdd]    = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<BudgetItem | null>(null);

  const total = items.reduce((sum, i) => sum + Number(i.forecastAmount), 0);

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-heading mb-0">Budget</h1>
        {canCreate && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-5"
          >
            Add budget item
          </button>
        )}
      </div>

      {/* Summary card */}
      {items.length > 0 && (
        <div className="mb-6 card flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600">Total budgeted</span>
          <span className="text-lg font-bold text-slate-900">KES {fmtAmount(total)}</span>
        </div>
      )}

      {/* Mobile: stacked card list */}
      <div className="card overflow-hidden p-0 sm:hidden">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No budget items yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{fmtDate(item.date)}</span>
                  <span className="tabular-nums font-bold text-slate-900">KES {fmtAmount(item.forecastAmount)}</span>
                </div>
                <p className="mt-1 font-medium text-slate-900">{item.title}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{item.recordedBy?.name ? `Added by ${item.recordedBy.name}` : "—"}</span>
                  {(canEdit || canDelete) && (
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <button
                          onClick={() => setEditingItem(item)}
                          title="Edit"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 113.18 3.182L7.5 20.211 3 21l.789-4.5L16.862 4.487z" />
                          </svg>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => setDeletingItem(item)}
                          title="Delete"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Amount (KES)</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Added by</th>
                {(canEdit || canDelete) && (
                  <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={canEdit || canDelete ? 5 : 4} className="px-4 py-8 text-center text-slate-500">
                    No budget items yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0">
                    <td className="px-4 py-3 text-slate-700">{fmtDate(item.date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.title}</td>
                    <td className="px-4 py-3 text-slate-700 text-right tabular-nums">{fmtAmount(item.forecastAmount)}</td>
                    <td className="px-4 py-3 text-slate-500">{item.recordedBy?.name ?? "—"}</td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              onClick={() => setEditingItem(item)}
                              title="Edit"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487a2.25 2.25 0 113.18 3.182L7.5 20.211 3 21l.789-4.5L16.862 4.487z" />
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setDeletingItem(item)}
                              title="Delete"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V4a1 1 0 011-1h6a1 1 0 011 1v3" />
                              </svg>
                            </button>
                          )}
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

      {/* Modals */}
      {showAdd && (
        <AddBudgetModal
          onClose={() => setShowAdd(false)}
          onAdded={(item) => setItems((prev) => [item, ...prev])}
        />
      )}
      {editingItem && (
        <EditBudgetModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onUpdated={(updated) => setItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
        />
      )}
      {deletingItem && (
        <DeleteBudgetModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
      )}
    </>
  );
}
