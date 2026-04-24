"use client";

import { useState, useMemo, useEffect } from "react";
import { ErrorToast } from "@/components/ui/ErrorToast";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

export type SerializedMember = {
  id:              string;
  name:            string | null;
  email:           string | null;
  phone:           string | null;
  status:          string;
  workgroupId:     string | null;
  workgroupAbbrev: string | null;
  workgroupName:   string | null;
  mentorId:        string | null;
  mentorName:      string | null;
  joinDate:        string | null;
  cpKittyBalance:  number;
  welfareBalance:  number;
  hasArrears:      boolean;
  attendance:      { cpEvents: number; mgm: number; kachai: number; kachaiTotal: number };
  deactivatedAt:   string | null;
};

type AttendanceTotals = { cpEvents: number; mgm: number; kachai: number };

type WorkgroupCount = { id: string; abbreviation: string; name: string; count: number };

type Props = {
  members:            SerializedMember[];
  workgroups:         WorkgroupCount[];
  canCreate:          boolean;
  canEdit:            boolean;
  attendanceYear:     number;
  attendanceTotals:   AttendanceTotals;
  showDeactivatedAt?: boolean;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatBalance(n: number): string {
  const abs = Math.abs(Math.round(n));
  return (n < 0 ? "-" : "") + new Intl.NumberFormat("en-KE").format(abs);
}

// ── Member details modal ───────────────────────────────────────────────────────

function MemberDetailsModal({
  member, onClose, attendanceYear, attendanceTotals,
}: {
  member: SerializedMember;
  onClose: () => void;
  attendanceYear: number;
  attendanceTotals: AttendanceTotals;
}) {
  const cpCompliant      = member.cpKittyBalance >= 0;
  const welfareCompliant = member.welfareBalance >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{member.name ?? "Member Details"}</h3>
            <p className="mt-0.5 text-xs text-slate-400">{member.workgroupName ?? "No workgroup"}</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition" aria-label="Close">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {/* Contact info */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Contact</p>
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <span className="text-sm text-slate-700">{member.email ?? <span className="text-slate-400">No email</span>}</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span className="text-sm text-slate-700">{member.phone ?? <span className="text-slate-400">No phone</span>}</span>
              </div>
            </div>
          </div>

          {/* Membership info */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Membership</p>
            <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <Row label="Workgroup"   value={member.workgroupName} />
              <Row label="Joined"      value={member.joinDate} />
              <Row label="Mentor"      value={member.mentorName} />
            </div>
          </div>

          {/* Financial balances */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Financial Balance</p>
            <div className="grid grid-cols-2 gap-2">
              <div className={`rounded-xl border px-4 py-3 ${cpCompliant ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">CP Kitty</p>
                <p className={`mt-0.5 text-base font-bold tabular-nums leading-none ${cpCompliant ? "text-green-700" : "text-red-600"}`}>
                  {cpCompliant ? "+" : "−"}{new Intl.NumberFormat("en-KE").format(Math.abs(Math.round(member.cpKittyBalance)))}
                </p>
                <p className={`mt-1 text-[10px] font-semibold uppercase ${cpCompliant ? "text-green-600" : "text-red-500"}`}>
                  {cpCompliant ? "Compliant" : "Arrears"}
                </p>
              </div>
              <div className={`rounded-xl border px-4 py-3 ${welfareCompliant ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Welfare</p>
                <p className={`mt-0.5 text-base font-bold tabular-nums leading-none ${welfareCompliant ? "text-green-700" : "text-red-600"}`}>
                  {welfareCompliant ? "+" : "−"}{new Intl.NumberFormat("en-KE").format(Math.abs(Math.round(member.welfareBalance)))}
                </p>
                <p className={`mt-1 text-[10px] font-semibold uppercase ${welfareCompliant ? "text-green-600" : "text-red-500"}`}>
                  {welfareCompliant ? "Compliant" : "Arrears"}
                </p>
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Activity Attendance · {attendanceYear}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { label: "CP Events", attended: member.attendance.cpEvents, total: attendanceTotals.cpEvents },
                  { label: "Kachai",    attended: member.attendance.kachai,   total: member.attendance.kachaiTotal },
                  { label: "MGM",       attended: member.attendance.mgm,      total: attendanceTotals.mgm },
                ] as const
              ).map(({ label, attended, total }) => {
                const pct      = total > 0 ? Math.round((attended / total) * 100) : null;
                const isGood   = pct !== null && pct >= 50;
                return (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-2 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums leading-none text-slate-800">
                      {attended}
                      <span className="text-sm font-normal text-slate-400">/{total}</span>
                    </p>
                    {pct !== null ? (
                      <p className={`mt-1 text-[10px] font-semibold uppercase ${isGood ? "text-green-600" : "text-amber-600"}`}>
                        {pct}%
                      </p>
                    ) : (
                      <p className="mt-1 text-[10px] text-slate-400">No events</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-5 py-3 text-right">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value ?? <span className="font-normal text-slate-400">—</span>}</span>
    </div>
  );
}

// ── Edit member modal ─────────────────────────────────────────────────────────

type EditModalProps = {
  member:     SerializedMember;
  workgroups: WorkgroupCount[];
  members:    SerializedMember[]; // for mentor dropdown
  onClose:    () => void;
  onSuccess:  () => void;
};

function EditMemberModal({ member, workgroups, members, onClose, onSuccess }: EditModalProps) {
  const [name,        setName]        = useState(member.name ?? "");
  const [email,       setEmail]       = useState(member.email ?? "");
  const [phone,       setPhone]       = useState(member.phone ?? "");
  const [workgroupId, setWorkgroupId] = useState(member.workgroupId ?? "");
  const [mentorId,    setMentorId]    = useState(member.mentorId ?? "");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const potentialMentors = members.filter((m) => m.id !== member.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:        name.trim(),
          email:       email.trim(),
          phone:       phone.trim() || null,
          workgroupId,
          mentorId:    mentorId || null,
        }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update member.");
        setSaving(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-md flex-col rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Edit Member</h3>
            <p className="mt-0.5 text-xs text-slate-400">{member.name}</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="space-y-4 px-5 py-4">

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +254700000000"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>

            {/* Workgroup */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Workgroup <span className="text-red-500">*</span>
              </label>
              <select value={workgroupId} onChange={(e) => setWorkgroupId(e.target.value)} required
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="" disabled>Select workgroup…</option>
                {workgroups.map((wg) => (
                  <option key={wg.id} value={wg.id}>{wg.name} ({wg.abbreviation})</option>
                ))}
              </select>
            </div>

            {/* Mentor */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mentor</label>
              <select value={mentorId} onChange={(e) => setMentorId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">— None —</option>
                {potentialMentors.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <ErrorToast message={error} onClose={() => setError("")} />
          </div>

          {/* Footer */}
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
      </div>
    </div>
  );
}

// ── Deactivate / reactivate confirm modal ─────────────────────────────────────

type DeactivateModalProps = {
  member:    SerializedMember;
  onClose:   () => void;
  onSuccess: () => void;
};

function DeactivateModal({ member, onClose, onSuccess }: DeactivateModalProps) {
  const isActive    = member.status === "Active";
  const action      = isActive ? "deactivate" : "reactivate";
  const [nameInput, setNameInput] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");

  const nameMatches = nameInput.trim() === (member.name ?? "").trim();

  async function handleConfirm() {
    if (isActive && !nameMatches) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to update member status.");
        setSaving(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800 capitalize">{action} Member</h3>
        <p className="mt-1.5 text-sm text-slate-500">
          {isActive
            ? <>This will deactivate <strong>{member.name}</strong> and stop all future automatic invoices for them.</>
            : <>Are you sure you want to reactivate <strong>{member.name}</strong>? They will resume receiving automatic invoices from this month.</>
          }
        </p>

        {isActive && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700">
              Type <span className="font-semibold text-slate-900">{member.name}</span> to confirm
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter member name…"
              autoFocus
              className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
          </div>
        )}

        <ErrorToast message={error} onClose={() => setError("")} />
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={handleConfirm}
            disabled={saving || (isActive && !nameMatches)}
            className={`flex-1 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${isActive ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary-light"}`}>
            {saving ? "Saving…" : isActive ? "Deactivate" : "Yes, reactivate"}
          </button>
          <button type="button" onClick={onClose} disabled={saving}
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invoice modal ─────────────────────────────────────────────────────────────

type InvoiceModalProps = {
  memberId:   string;
  memberName: string | null;
  onClose:    () => void;
  onSuccess:  () => void;
};

function InvoiceModal({ memberId, memberName, onClose, onSuccess }: InvoiceModalProps) {
  const [amount,     setAmount]     = useState("");
  const [type,       setType]       = useState<"CP_KITTY" | "WELFARE">("CP_KITTY");
  const [notes,      setNotes]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) { setError("Enter a valid amount."); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/members/${memberId}/invoices`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ amount: num, type, notes: notes.trim() || undefined }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to create invoice.");
        setSubmitting(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-base font-semibold text-slate-800">Add manual invoice</h3>
        <p className="mt-0.5 text-sm text-slate-500">{memberName}</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (KES)</label>
            <input type="number" min="1" step="1" placeholder="e.g. 5000" value={amount}
              onChange={(e) => setAmount(e.target.value)} required
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kitty</label>
            <select value={type} onChange={(e) => setType(e.target.value as "CP_KITTY" | "WELFARE")}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="CP_KITTY">CP Kitty</option>
              <option value="WELFARE">Welfare Kitty</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <input type="text" placeholder="e.g. Balance carried forward" value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <ErrorToast message={error} onClose={() => setError("")} />
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={submitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-60">
              {submitting && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {submitting ? "Saving…" : "Add invoice"}
            </button>
            <button type="button" onClick={onClose} disabled={submitting}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main table ─────────────────────────────────────────────────────────────────

export function MembershipTable({ members, workgroups, canCreate, canEdit, attendanceYear, attendanceTotals, showDeactivatedAt = false }: Props) {
  const router = useRouter();

  const [query,         setQuery]         = useState("");
  const [workgroup,     setWorkgroup]      = useState<string | null>(null);
  const [noArrearsOnly, setNoArrearsOnly]  = useState(false);
  const [page,          setPage]           = useState(1);
  const [pageSize,      setPageSize]       = useState(25);
  const [exportDate,    setExportDate]     = useState("");
  const [viewingMember,    setViewingMember]    = useState<SerializedMember | null>(null);
  const [editingMember,    setEditingMember]    = useState<SerializedMember | null>(null);
  const [deactivatingFor,  setDeactivatingFor]  = useState<SerializedMember | null>(null);
  const [invoicingFor,     setInvoicingFor]     = useState<SerializedMember | null>(null);

  const noArrearsCount = members.filter((m) => !m.hasArrears).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (workgroup && m.workgroupAbbrev !== workgroup) return false;
      if (noArrearsOnly && m.hasArrears) return false;
      if (q) {
        const match =
          (m.name ?? "").toLowerCase().includes(q) ||
          (m.email ?? "").toLowerCase().includes(q) ||
          (m.phone ?? "").toLowerCase().includes(q) ||
          (m.workgroupName ?? "").toLowerCase().includes(q) ||
          (m.mentorName ?? "").toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [members, query, workgroup, noArrearsOnly]);

  useEffect(() => { setPage(1); }, [query, workgroup, noArrearsOnly]);
  useEffect(() => {
    setExportDate(new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  }, []);

  const totalPages    = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRows = filtered.slice((page - 1) * pageSize, page * pageSize);
  const hasActiveFilter = query.trim() || workgroup || noArrearsOnly;

  function exportExcel() {
    const rows = filtered.map((m) => ({
      "Name":         m.name ?? "—",
      "Email":        m.email ?? "—",
      "Phone":        m.phone ?? "—",
      "Workgroup":    m.workgroupName ?? "—",
      "Mentor":       m.mentorName ?? "—",
      "Joined":       m.joinDate ?? "—",
      "CP Kitty Bal": m.cpKittyBalance,
      "Welfare Bal":  m.welfareBalance,
      "Has Arrears":  m.hasArrears ? "Yes" : "No",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key as keyof typeof r] ?? "").length)) + 2,
    }));
    ws["!cols"] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Members");
    XLSX.writeFile(wb, `members_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  return (
    <div>
      {/* Modals */}
      {viewingMember && (
        <MemberDetailsModal
          member={viewingMember}
          onClose={() => setViewingMember(null)}
          attendanceYear={attendanceYear}
          attendanceTotals={attendanceTotals}
        />
      )}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          workgroups={workgroups}
          members={members}
          onClose={() => setEditingMember(null)}
          onSuccess={() => { setEditingMember(null); router.refresh(); }}
        />
      )}
      {deactivatingFor && (
        <DeactivateModal
          member={deactivatingFor}
          onClose={() => setDeactivatingFor(null)}
          onSuccess={() => { setDeactivatingFor(null); router.refresh(); }}
        />
      )}
      {invoicingFor && (
        <InvoiceModal
          memberId={invoicingFor.id}
          memberName={invoicingFor.name}
          onClose={() => setInvoicingFor(null)}
          onSuccess={() => { setInvoicingFor(null); router.refresh(); }}
        />
      )}

      {/* Arrears banner */}
      {noArrearsCount < members.length && (
        <div className="no-print mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-medium text-amber-800">
            <span className="font-bold">{members.length - noArrearsCount}</span>{" "}
            {members.length - noArrearsCount === 1 ? "member has" : "members have"} outstanding arrears
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="no-print mb-4 flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input type="search" placeholder="Search by name, email, phone, workgroup…"
              value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={exportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Excel
            </button>
            <button type="button" onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              PDF
            </button>
          </div>
        </div>

        {/* Workgroup pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Workgroup:</span>
          <button type="button" onClick={() => setWorkgroup(null)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${workgroup === null ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            All ({members.length})
          </button>
          {workgroups.map((wg) => (
            <button key={wg.abbreviation} type="button"
              onClick={() => setWorkgroup(workgroup === wg.abbreviation ? null : wg.abbreviation)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${workgroup === wg.abbreviation ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
              {wg.abbreviation} ({wg.count})
            </button>
          ))}
        </div>

        {/* No arrears toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setNoArrearsOnly((v) => !v)}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${noArrearsOnly ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Without arrears ({noArrearsCount})
          </button>
          {hasActiveFilter && (
            <button type="button" onClick={() => { setQuery(""); setWorkgroup(null); setNoArrearsOnly(false); }}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-700">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all
            </button>
          )}
        </div>
      </div>

      {hasActiveFilter && (
        <p className="no-print mb-2 text-xs text-slate-500">
          {filtered.length} member{filtered.length !== 1 ? "s" : ""}
          {query.trim() && <> matching &ldquo;{query}&rdquo;</>}
        </p>
      )}

      {/* Mobile card list */}
      <div className="sm:hidden card overflow-hidden p-0">
        {paginatedRows.length === 0 ? (
          <p className="px-4 py-8 text-center text-slate-500">
            {hasActiveFilter ? "No members match the current filters." : "No members found."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {paginatedRows.map((m) => (
              <li key={m.id} className={`px-4 py-3 ${m.status !== "Active" ? "opacity-60" : ""}`}>
                {/* Name + status badge */}
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{m.name ?? "—"}</p>
                  {m.status === "Paused" && (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Inactive</span>
                  )}
                </div>
                {/* Workgroup */}
                <p className="mt-0.5 text-xs text-slate-500">{m.workgroupName ?? "No workgroup"}</p>
                {/* Actions */}
                <div className="mt-2 flex items-center gap-1">
                  {/* View details */}
                  <button type="button" onClick={() => setViewingMember(m)} title="View details"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  {/* Edit member */}
                  {canEdit && (
                    <button type="button" onClick={() => setEditingMember(m)} title="Edit member"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                  )}
                  {/* Deactivate / Reactivate */}
                  {canEdit && (
                    <button type="button" onClick={() => setDeactivatingFor(m)}
                      title={m.status === "Active" ? "Deactivate member" : "Reactivate member"}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-slate-100 ${m.status === "Active" ? "text-slate-400 hover:text-red-500" : "text-amber-500 hover:text-primary"}`}>
                      {m.status === "Active" ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                  )}
                  {/* Add invoice */}
                  {canCreate && (
                    <button type="button" onClick={() => setInvoicingFor(m)} title="Add manual invoice"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Table */}
      <div className="hidden sm:block card overflow-hidden p-0 print:border print:shadow-none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Workgroup</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Joined</th>
                {showDeactivatedAt && (
                  <th className="px-4 py-3 font-semibold text-slate-700">Deactivated On</th>
                )}
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">CP Kitty</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-right">Welfare</th>
                <th className="no-print px-4 py-3 font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={showDeactivatedAt ? 7 : 6} className="px-4 py-8 text-center text-slate-500">
                    {hasActiveFilter ? "No members match the current filters." : "No members found."}
                  </td>
                </tr>
              ) : (
                paginatedRows.map((m) => (
                  <tr key={m.id} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50/80 ${m.status !== "Active" ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{m.name ?? "—"}</p>
                        {m.status === "Paused" && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Inactive</span>
                        )}
                      </div>
                      {m.mentorName && (
                        <p className="text-xs text-slate-400">Mentor: {m.mentorName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{m.workgroupName ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{m.joinDate ?? "—"}</td>
                    {showDeactivatedAt && (
                      <td className="px-4 py-3 text-slate-600">{m.deactivatedAt ?? "—"}</td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <BalanceBadge value={m.cpKittyBalance} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <BalanceBadge value={m.welfareBalance} />
                    </td>
                    <td className="no-print px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* View details */}
                        <button type="button" onClick={() => setViewingMember(m)} title="View details"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </button>
                        {/* Edit member */}
                        {canEdit && (
                          <button type="button" onClick={() => setEditingMember(m)} title="Edit member"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                          </button>
                        )}
                        {/* Deactivate / Reactivate */}
                        {canEdit && (
                          <button type="button" onClick={() => setDeactivatingFor(m)}
                            title={m.status === "Active" ? "Deactivate member" : "Reactivate member"}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg transition hover:bg-slate-100 ${m.status === "Active" ? "text-slate-400 hover:text-red-500" : "text-amber-500 hover:text-primary"}`}>
                            {m.status === "Active" ? (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>
                        )}
                        {/* Add invoice */}
                        {canCreate && (
                          <button type="button" onClick={() => setInvoicingFor(m)} title="Add manual invoice"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="no-print mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <span>
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
            </span>
            <label className="flex items-center gap-1.5">
              Rows:
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary">
                {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(1)} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5M11.25 19.5l-7.5-7.5 7.5-7.5" /></svg>
            </button>
            <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
              .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, idx) =>
                n === "…" ? (
                  <span key={`e-${idx}`} className="px-1 text-slate-400">…</span>
                ) : (
                  <button key={n} type="button" onClick={() => setPage(n as number)}
                    className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg border px-2 text-sm transition ${page === n ? "border-primary bg-primary font-semibold text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                    {n}
                  </button>
                )
              )}
            <button type="button" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
            <button type="button" onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5M12.75 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
          </div>
        </div>
      )}

      <div className="hidden print:block mt-4 text-xs text-slate-500">
        {exportDate && <>Exported {exportDate}</>}
      </div>
    </div>
  );
}

function BalanceBadge({ value }: { value: number }) {
  if (value < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 tabular-nums">
        {formatBalance(value)}
      </span>
    );
  }
  if (value === 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 tabular-nums">
        0
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 tabular-nums">
      +{formatBalance(value)}
    </span>
  );
}
