"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Workgroup = { id: string; abbreviation: string; name: string };
type Mentor    = { id: string; name: string | null; workgroupName: string | null };

type Props = {
  workgroups: Workgroup[];
  mentors:    Mentor[];
};

type FieldError = Partial<Record<string, string>>;

export function NewMemberForm({ workgroups, mentors }: Props) {
  const router = useRouter();

  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    name:          "",
    email:         "",
    phone:         "",
    workgroupId:   "",
    mentorId:      "",
    joinDate:      today,
    preferredName: "",
  });
  const [errors, setErrors]   = useState<FieldError>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading]   = useState(false);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((errs) => { const next = { ...errs }; delete next[field]; return next; });
    };
  }

  function validate(): FieldError {
    const errs: FieldError = {};
    if (!form.name.trim())        errs.name        = "Name is required.";
    if (!form.email.trim())       errs.email       = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.workgroupId)        errs.workgroupId = "Workgroup is required.";
    if (!form.joinDate)           errs.joinDate    = "Join date is required.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/members", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:          form.name.trim(),
          email:         form.email.trim().toLowerCase(),
          phone:         form.phone.trim() || null,
          workgroupId:   form.workgroupId,
          mentorId:      form.mentorId || null,
          joinDate:      form.joinDate,
          preferredName: form.preferredName.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? "Something went wrong."); return; }
      router.push("/app/membership");
      router.refresh();
    } catch {
      setApiError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {apiError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      {/* Personal details */}
      <div className="card space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Personal details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Full name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Jane Mwangi"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.name ? "border-red-400 bg-red-50" : "border-slate-300 bg-white focus:border-primary"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Preferred name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Preferred name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.preferredName}
              onChange={set("preferredName")}
              placeholder="Nickname or short name"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="jane@example.com"
              className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.email ? "border-red-400 bg-red-50" : "border-slate-300 bg-white focus:border-primary"
              }`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            <p className="mt-1 text-xs text-slate-400">A temporary password will be sent to this address.</p>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="e.g. 0712 345 678"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="mt-1 text-xs text-slate-400">WhatsApp welcome message will be sent here.</p>
          </div>
        </div>
      </div>

      {/* Membership details */}
      <div className="card space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Membership details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Workgroup */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Workgroup <span className="text-red-500">*</span>
            </label>
            <select
              value={form.workgroupId}
              onChange={set("workgroupId")}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.workgroupId ? "border-red-400 bg-red-50" : "border-slate-300 bg-white focus:border-primary"
              }`}
            >
              <option value="">— Select workgroup —</option>
              {workgroups.map((wg) => (
                <option key={wg.id} value={wg.id}>
                  {wg.abbreviation} – {wg.name}
                </option>
              ))}
            </select>
            {errors.workgroupId && <p className="mt-1 text-xs text-red-600">{errors.workgroupId}</p>}
          </div>

          {/* Join date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Join date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={form.joinDate}
              onChange={set("joinDate")}
              max={today}
              className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
                errors.joinDate ? "border-red-400 bg-red-50" : "border-slate-300 bg-white focus:border-primary"
              }`}
            />
            {errors.joinDate && <p className="mt-1 text-xs text-red-600">{errors.joinDate}</p>}
          </div>

          {/* Mentor */}
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Mentor <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <select
              value={form.mentorId}
              onChange={set("mentorId")}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— No mentor assigned —</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name ?? "Unknown"}{m.workgroupName ? ` (${m.workgroupName})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <svg className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <p className="text-xs text-blue-700">
          A temporary password will be auto-generated and sent to the member by email and WhatsApp. They should change it on first login. Module access can be configured from User Management after creation.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/app/membership")}
          disabled={loading}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60"
        >
          {loading && (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          {loading ? "Creating member…" : "Create member"}
        </button>
      </div>
    </form>
  );
}
