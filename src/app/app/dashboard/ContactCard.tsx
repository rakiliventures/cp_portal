"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  email: string;
  phone: string | null;
};

export function ContactCard({ email: initialEmail, phone: initialPhone }: Props) {
  const router = useRouter();
  const [open,       setOpen]       = useState(false);
  const [email,      setEmail]      = useState(initialEmail);
  const [phone,      setPhone]      = useState(initialPhone ?? "");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  // Displayed values (optimistic before save)
  const [shownEmail, setShownEmail] = useState(initialEmail);
  const [shownPhone, setShownPhone] = useState(initialPhone ?? "");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim(), phone: phone.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        setSaving(false);
        return;
      }
      setShownEmail(data.email);
      setShownPhone(data.phone ?? "");
      setOpen(false);
      setSaving(false);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <>
      <div className="card flex flex-col gap-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contacts</p>
          <button
            type="button"
            onClick={() => { setEmail(shownEmail); setPhone(shownPhone); setError(""); setOpen(true); }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Edit contact details"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
            Edit
          </button>
        </div>

        {/* Email */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </span>
          <span className="min-w-0 truncate text-sm text-slate-700">{shownEmail}</span>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100">
            <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </span>
          <span className="text-sm text-slate-700">{shownPhone || <span className="text-slate-400">—</span>}</span>
        </div>
      </div>

      {/* Edit modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-800">Edit contact details</h3>
            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60"
                >
                  {saving && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
