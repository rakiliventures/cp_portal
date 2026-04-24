"use client";

import { useState } from "react";
import { ErrorToast } from "@/components/ui/ErrorToast";

type Attendance = {
  id: string;
  memberId: string | null;
  memberName: string | null;
  recordedAt: string;
};

type Member = { id: string; name: string | null };

type Props = {
  eventId:           string;
  initialAttendances: Attendance[];
  allMembers:        Member[];
  canManage:         boolean;
  canDelete:         boolean;
  restrictionLabel?: string | null;
};

export function EventAttendanceSection({
  eventId,
  initialAttendances,
  allMembers,
  canManage,
  canDelete,
  restrictionLabel,
}: Props) {
  const [attendances, setAttendances] = useState<Attendance[]>(initialAttendances);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const attendedIds = new Set(attendances.map((a) => a.memberId));
  const available = allMembers.filter((m) => !attendedIds.has(m.id));

  async function handleAdd() {
    if (!selectedMemberId) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ memberId: selectedMemberId }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? "Failed to add attendee."); return; }
      setAttendances((prev) => [...prev, data.attendance]);
      setSelectedMemberId("");
    } catch {
      setAddError("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(attendanceId: string) {
    setRemovingId(attendanceId);
    try {
      const res = await fetch(`/api/events/${eventId}/attendance/${attendanceId}`, { method: "DELETE" });
      if (res.ok) {
        setAttendances((prev) => prev.filter((a) => a.id !== attendanceId));
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <section className="card mt-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Attendance
            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {attendances.length}
            </span>
          </h2>
        </div>
        {restrictionLabel && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <svg className="h-4 w-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <p className="text-xs font-medium text-amber-800">{restrictionLabel}</p>
          </div>
        )}
      </div>

      {/* Add attendee */}
      {canManage && (
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Record attendance</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <select
              value={selectedMemberId}
              onChange={(e) => { setSelectedMemberId(e.target.value); setAddError(""); }}
              className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Select member —</option>
              {available.map((m) => (
                <option key={m.id} value={m.id}>{m.name ?? m.id}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedMemberId || adding}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {adding && (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {adding ? "Adding…" : "Add"}
            </button>
          </div>
          <ErrorToast message={addError} onClose={() => setAddError("")} />
          {available.length === 0 && (
            <p className="mt-1.5 text-xs text-slate-400">
              All eligible members have already been recorded.
            </p>
          )}
        </div>
      )}

      {/* Attendees list */}
      {attendances.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
          No attendance recorded yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {attendances.map((a, idx) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              {/* Rank / avatar */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {idx + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{a.memberName ?? "Unknown"}</p>
                <p className="text-xs text-slate-400">
                  Recorded{" "}
                  {new Date(a.recordedAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              </div>
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleRemove(a.id)}
                  disabled={removingId === a.id}
                  aria-label="Remove attendee"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  {removingId === a.id ? (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
