"use client";

import { useState } from "react";
import { ErrorToast } from "@/components/ui/ErrorToast";

export type Inquiry = {
  id:            string;
  name:          string;
  contact:       string;
  email:         string;
  message:       string;
  submittedAt:   string;
  status:        "New" | "Contacted" | "Converted";
  notes:         string | null;
  actionedByName: string | null;
  actionedAt:    string | null;
};

const STATUS_STYLES: Record<string, string> = {
  New:       "bg-amber-50 text-amber-700 border-amber-200",
  Contacted: "bg-blue-50 text-blue-700 border-blue-200",
  Converted: "bg-green-50 text-green-700 border-green-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ── Action Modal ──────────────────────────────────────────────────
function ActionModal({
  inquiry,
  onClose,
  onSaved,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onSaved: (updated: Inquiry) => void;
}) {
  const [status, setStatus] = useState<Inquiry["status"]>(inquiry.status);
  const [notes, setNotes]   = useState(inquiry.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    const res = await fetch(`/api/inquiries/${inquiry.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ status, notes }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to save.");
      return;
    }
    const d = await res.json();
    onSaved({
      ...inquiry,
      status:          d.inquiry.status,
      notes:           d.inquiry.notes,
      actionedByName:  d.inquiry.actionedBy?.name ?? null,
      actionedAt:      d.inquiry.actionedAt,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Update Inquiry</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Inquiry summary */}
        <div className="border-b border-slate-100 bg-slate-50 px-5 py-3">
          <p className="text-sm font-semibold text-slate-800">{inquiry.name}</p>
          <p className="text-xs text-slate-500">{inquiry.email} · {inquiry.contact}</p>
          <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-3">{inquiry.message}</p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Inquiry["status"])}
              className="input"
            >
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Converted">Converted</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Action notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Summarise the action taken…"
              className="input resize-none"
            />
          </div>

          <ErrorToast message={error} onClose={() => setError("")} />

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full sm:w-auto">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
export function InquiriesClient({ initialInquiries }: { initialInquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [selected, setSelected]   = useState<Inquiry | null>(null);
  const [filter, setFilter]       = useState<"All" | "New" | "Contacted" | "Converted">("All");
  const [search, setSearch]       = useState("");

  const filtered = inquiries.filter((q) => {
    const matchStatus = filter === "All" || q.status === filter;
    const term = search.toLowerCase();
    const matchSearch = !term ||
      q.name.toLowerCase().includes(term) ||
      q.email.toLowerCase().includes(term) ||
      q.contact.toLowerCase().includes(term);
    return matchStatus && matchSearch;
  });

  function handleSaved(updated: Inquiry) {
    setInquiries((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  }

  const counts = {
    All:       inquiries.length,
    New:       inquiries.filter((q) => q.status === "New").length,
    Contacted: inquiries.filter((q) => q.status === "Contacted").length,
    Converted: inquiries.filter((q) => q.status === "Converted").length,
  };

  return (
    <>
      {selected && (
        <ActionModal
          inquiry={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["All", "New", "Contacted", "Converted"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              filter === s
                ? "border-primary bg-primary text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {s}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${filter === s ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
              {counts[s]}
            </span>
          </button>
        ))}

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email…"
          className="input ml-auto w-full sm:w-56"
        />
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">No inquiries found.</p>
        ) : (
          filtered.map((q) => (
            <div key={q.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{q.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{q.email}</p>
                  <p className="text-xs text-slate-500">{q.contact}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[q.status]}`}>
                  {q.status}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{q.message}</p>
              {q.notes && (
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">Notes</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{q.notes}</p>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                <div>
                  <p className="text-[11px] text-slate-400">{formatDate(q.submittedAt)}</p>
                  {q.actionedByName && (
                    <p className="text-[11px] text-slate-400">Actioned by <span className="font-medium text-slate-600">{q.actionedByName}</span></p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(q)}
                  className="btn-primary py-1.5 px-3 text-xs"
                >
                  Update
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Submitted</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Contact</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Message</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Actioned by</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Notes</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">No inquiries found.</td>
              </tr>
            ) : (
              filtered.map((q) => (
                <tr key={q.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-500 tabular-nums">{formatDate(q.submittedAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{q.name}</p>
                    <p className="text-xs text-slate-400">{q.email}</p>
                    <p className="text-xs text-slate-400">{q.contact}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[180px]">
                    <p className="line-clamp-3 text-xs leading-relaxed">{q.message}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[q.status]}`}>
                      {q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {q.actionedByName ? (
                      <div>
                        <p className="text-slate-700 font-medium text-xs">{q.actionedByName}</p>
                        {q.actionedAt && <p className="text-[11px] text-slate-400">{formatDate(q.actionedAt)}</p>}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    {q.notes ? (
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{q.notes}</p>
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => setSelected(q)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
