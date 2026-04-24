"use client";

import { useState } from "react";
import { ErrorToast } from "@/components/ui/ErrorToast";

export type SerializedDocument = {
  id:          string;
  title:       string;
  url:         string;
  description: string | null;
  category:    string | null;
  addedBy:     string | null;
  createdAt:   string;
};

type Props = {
  documents: SerializedDocument[];
  canCreate: boolean;
  canEdit:   boolean;
  canDelete: boolean;
};

const CATEGORIES = ["Constitution", "Guidelines", "Documentation", "Other"];

// ── Shared form fields ────────────────────────────────────────────────────────

function DocFormFields({
  title, setTitle,
  url, setUrl,
  category, setCategory,
  description, setDescription,
}: {
  title: string;       setTitle:       (v: string) => void;
  url: string;         setUrl:         (v: string) => void;
  category: string;    setCategory:    (v: string) => void;
  description: string; setDescription: (v: string) => void;
}) {
  return (
    <>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Document Title <span className="text-red-500">*</span>
        </label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
          placeholder="e.g. CP Constitution 2024"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Google Drive Link <span className="text-red-500">*</span>
        </label>
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} required
          placeholder="https://drive.google.com/…"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">— None —</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          placeholder="Brief description of the document…"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
      </div>
    </>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Add modal ─────────────────────────────────────────────────────────────────

function AddDocumentModal({ onClose, onSuccess }: {
  onClose:   () => void;
  onSuccess: (doc: SerializedDocument) => void;
}) {
  const [title,       setTitle]       = useState("");
  const [url,         setUrl]         = useState("");
  const [description, setDescription] = useState("");
  const [category,    setCategory]    = useState("");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: title.trim(), url: url.trim(), description: description.trim() || null, category: category || null }),
      });
      if (res.ok) { onSuccess(await res.json()); }
      else { setError((await res.json().catch(() => ({}))).error ?? "Failed to save document."); setSaving(false); }
    } catch { setError("Network error. Please try again."); setSaving(false); }
  }

  return (
    <ModalShell title="Add Document" onClose={onClose}>
      <form onSubmit={handleSubmit} className="overflow-y-auto">
        <div className="space-y-4 px-5 py-4">
          <DocFormFields title={title} setTitle={setTitle} url={url} setUrl={setUrl}
            category={category} setCategory={setCategory} description={description} setDescription={setDescription} />
          <ErrorToast message={error} onClose={() => setError("")} />
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60">
            {saving ? "Saving…" : "Add Document"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditDocumentModal({ doc, onClose, onSuccess }: {
  doc:       SerializedDocument;
  onClose:   () => void;
  onSuccess: (updated: SerializedDocument) => void;
}) {
  const [title,       setTitle]       = useState(doc.title);
  const [url,         setUrl]         = useState(doc.url);
  const [description, setDescription] = useState(doc.description ?? "");
  const [category,    setCategory]    = useState(doc.category ?? "");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: title.trim(), url: url.trim(), description: description.trim() || null, category: category || null }),
      });
      if (res.ok) { onSuccess(await res.json()); }
      else { setError((await res.json().catch(() => ({}))).error ?? "Failed to update document."); setSaving(false); }
    } catch { setError("Network error. Please try again."); setSaving(false); }
  }

  return (
    <ModalShell title="Edit Document" onClose={onClose}>
      <form onSubmit={handleSubmit} className="overflow-y-auto">
        <div className="space-y-4 px-5 py-4">
          <DocFormFields title={title} setTitle={setTitle} url={url} setUrl={setUrl}
            category={category} setCategory={setCategory} description={description} setDescription={setDescription} />
          <ErrorToast message={error} onClose={() => setError("")} />
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60">
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteDocumentModal({ doc, onClose, onSuccess }: {
  doc:       SerializedDocument;
  onClose:   () => void;
  onSuccess: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error,    setError]    = useState("");

  async function handleDelete() {
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) { onSuccess(doc.id); }
      else { setError((await res.json().catch(() => ({}))).error ?? "Failed to delete document."); setDeleting(false); }
    } catch { setError("Network error. Please try again."); setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800">Delete Document</h3>
        <p className="mt-1.5 text-sm text-slate-500">
          Are you sure you want to delete <strong>{doc.title}</strong>? This cannot be undone.
        </p>
        <ErrorToast message={error} onClose={() => setError("")} />
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-60">
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button type="button" onClick={onClose} disabled={deleting}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Document card ─────────────────────────────────────────────────────────────

function DocumentCard({ doc, canEdit, canDelete, onEdit, onDelete }: {
  doc:      SerializedDocument;
  canEdit:  boolean;
  canDelete: boolean;
  onEdit:   (doc: SerializedDocument) => void;
  onDelete: (doc: SerializedDocument) => void;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      {/* File icon */}
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
        <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <a href={doc.url} target="_blank" rel="noopener noreferrer"
            className="text-sm font-semibold text-slate-800 hover:text-primary hover:underline">
            {doc.title}
          </a>
          {doc.category && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {doc.category}
            </span>
          )}
        </div>
        {doc.description && (
          <p className="mt-0.5 text-xs text-slate-500">{doc.description}</p>
        )}
        <p className="mt-1.5 text-[11px] text-slate-400">
          Added by <span className="font-medium text-slate-500">{doc.addedBy ?? "—"}</span>
          {" · "}
          {doc.createdAt}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Open in Drive */}
        <a href={doc.url} target="_blank" rel="noopener noreferrer"
          title="Open in Google Drive"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
        {/* Edit */}
        {canEdit && (
          <button type="button" onClick={() => onEdit(doc)} title="Edit document"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>
        )}
        {/* Delete */}
        {canDelete && (
          <button type="button" onClick={() => onDelete(doc)} title="Delete document"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function DocumentsClient({ documents: initial, canCreate, canEdit, canDelete }: Props) {
  const [docs,        setDocs]        = useState<SerializedDocument[]>(initial);
  const [showAdd,     setShowAdd]     = useState(false);
  const [editingDoc,  setEditingDoc]  = useState<SerializedDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<SerializedDocument | null>(null);

  function handleAdded(doc: SerializedDocument) {
    setDocs((prev) => [doc, ...prev]);
    setShowAdd(false);
  }

  function handleUpdated(updated: SerializedDocument) {
    setDocs((prev) => prev.map((d) => d.id === updated.id ? updated : d));
    setEditingDoc(null);
  }

  function handleDeleted(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setDeletingDoc(null);
  }

  // Group by category
  const grouped = new Map<string, SerializedDocument[]>();
  for (const doc of docs) {
    const key = doc.category ?? "Uncategorised";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(doc);
  }

  return (
    <>
      {showAdd && (
        <AddDocumentModal onClose={() => setShowAdd(false)} onSuccess={handleAdded} />
      )}
      {editingDoc && (
        <EditDocumentModal doc={editingDoc} onClose={() => setEditingDoc(null)} onSuccess={handleUpdated} />
      )}
      {deletingDoc && (
        <DeleteDocumentModal doc={deletingDoc} onClose={() => setDeletingDoc(null)} onSuccess={handleDeleted} />
      )}

      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          {docs.length} document{docs.length !== 1 ? "s" : ""}
        </p>
        {canCreate && (
          <button type="button" onClick={() => setShowAdd(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Document
          </button>
        )}
      </div>

      {docs.length === 0 ? (
        <div className="card py-12 text-center">
          <svg className="mx-auto mb-3 h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No documents yet</p>
          {canCreate && (
            <p className="mt-1 text-xs text-slate-400">Click "Add Document" to add the first one.</p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([category, items]) => (
            <div key={category}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">{category}</h2>
              <div className="space-y-3">
                {items.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={setEditingDoc}
                    onDelete={setDeletingDoc}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
