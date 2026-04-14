"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  eventId:   string;
  backHref:  string; // where to go after delete
  canEdit:   boolean;
  canDelete: boolean;
  /** "row" = compact icon buttons in table, "detail" = labelled buttons on detail page */
  variant?:  "row" | "detail";
};

export function EventActions({ eventId, backHref, canEdit, canDelete, variant = "detail" }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function handleDelete() {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      if (res.ok) {
        router.push(backHref);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.error ?? "Failed to delete event.");
        setDeleting(false);
        setShowConfirm(false);
      }
    } catch {
      setDeleteError("Network error. Please try again.");
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  if (!canEdit && !canDelete) return null;

  if (variant === "row") {
    return (
      <>
        <div className="flex items-center gap-1">
          {canEdit && (
            <Link
              href={`/app/events/${eventId}/edit`}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary"
              title="Edit event"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
            </Link>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
              title="Delete event"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>

        {/* Confirm dialog */}
        {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-base font-semibold text-slate-800">Delete event?</h3>
              <p className="mt-2 text-sm text-slate-500">
                This will permanently delete the event and all its attendance records. This action cannot be undone.
              </p>
              {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {deleting && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  )}
                  {deleting ? "Deleting…" : "Yes, delete"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowConfirm(false); setDeleteError(""); }}
                  disabled={deleting}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // variant === "detail"
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Link
            href={`/app/events/${eventId}/edit`}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            Edit event
          </Link>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            Delete event
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-semibold text-slate-800">Delete this event?</h3>
            <p className="mt-2 text-sm text-slate-500">
              This will permanently delete the event and all its attendance records. This action cannot be undone.
            </p>
            {deleteError && <p className="mt-2 text-xs text-red-600">{deleteError}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {deleting ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                onClick={() => { setShowConfirm(false); setDeleteError(""); }}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
