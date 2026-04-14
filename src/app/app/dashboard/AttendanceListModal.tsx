"use client";

import { useState } from "react";

type AttendedEvent = {
  id:            string;
  title:         string;
  date:          string;
  categoryLabel: string;
  venue:         string | null;
};

type Props = {
  events: AttendedEvent[];
};

export function AttendanceListModal({ events }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-xs text-slate-400 hover:text-primary hover:underline transition-colors"
      >
        View list →
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl" style={{ maxHeight: "80vh" }}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-base font-semibold text-slate-800">Activities Attended</h3>
                <p className="mt-0.5 text-xs text-slate-400">{events.length} {events.length === 1 ? "event" : "events"} total</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* List */}
            <div className="overflow-y-auto">
              {events.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-slate-400">No activities attended yet.</p>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {events.map((ev) => (
                    <li key={ev.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 leading-snug">{ev.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {ev.date}
                          {ev.venue && <> · {ev.venue}</>}
                        </p>
                      </div>
                      <span className="mt-0.5 shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        {ev.categoryLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-5 py-3 text-right">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
