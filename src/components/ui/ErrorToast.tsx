"use client";

import { useEffect } from "react";

/**
 * Fixed-position error toast that auto-dismisses after 5 seconds.
 * Renders on top of modals (z-[60]).
 */
export function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-5 left-1/2 z-[60] -translate-x-1/2 w-full max-w-sm px-4">
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 shadow-lg">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
          <svg className="h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="flex-1 text-sm font-medium text-red-700">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded p-0.5 text-red-400 hover:bg-red-100 hover:text-red-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
