"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useCallback, useEffect, useRef } from "react";
import type { User } from "next-auth";
import { getMenuModules } from "@/lib/permissions";
import { NavigationLoader } from "./NavigationLoader";
import { ErrorToast } from "@/components/ui/ErrorToast";

type AppShellProps = { user: User & { id: string; modules?: unknown }; children: React.ReactNode };

// ── Inline SVG icon ────────────────────────────────────────────────
const ICON_PATHS: Record<string, string> = {
  grid:        "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z",
  home:        "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  barchart:    "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  banknotes:   "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z",
  calculator:  "M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V13.5zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25V18zm2.498-6.75h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V13.5zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007V18zm2.504-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zm0 2.25h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V18zm2.498-6.75h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V13.5zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.652 4.5 4.756V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.756c0-1.104-.807-2.057-1.907-2.184A48.507 48.507 0 0012 2.25z",
  creditcard:  "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
  receipt:     "M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
  calendar:    "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H18v-.008zm0 2.25h.008v.008H18V15z",
  users:       "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  download:    "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3",
  inbox:       "M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z",
  cog:         "M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  bell:        "M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0",
  usercog:     "M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z",
  building:    "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z",
  logout:      "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
  dot:         "M12 12m-1 0a1 1 0 102 0 1 1 0 10-2 0",
};

function NavIcon({ name, className = "h-[18px] w-[18px] shrink-0" }: { name: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[name] ?? ICON_PATHS.dot} />
    </svg>
  );
}

// Map module code / label → icon name
const CODE_ICON: Record<string, string> = {
  PersonalDashboard:    "home",
  GroupWideReports:     "barchart",
  Events:               "calendar",
  Membership:           "users",
  Downloads:            "download",
  InquiriesManagement:  "inbox",
};

const GROUP_ICON: Record<string, string> = {
  Dashboard:  "grid",
  Finance:    "banknotes",
  Settings:   "cog",
  Events:     "calendar",
  Membership: "users",
};

const LABEL_ICON: Record<string, string> = {
  "My Payments":             "creditcard",
  "My Statement":            "receipt",
  "All Payments":              "banknotes",
  "CP Kitty Summary Report":   "barchart",
  "Welfare Summary Report":    "barchart",
  Budget:                    "calculator",
  Expenses:                  "receipt",
  "Notifications Settings":  "bell",
  "User Management":         "usercog",
  "Payment Accounts":        "building",
  "CP Events":               "calendar",
  "MGM Meetings":            "users",
  "Kachai":                  "building",
  "Current Members":         "users",
  "Deactivated Members":     "usercog",
};

// Hamburger icon for mobile
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-5 w-6">
      <span className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-200 ${open ? "top-2 rotate-45" : "top-1"}`} />
      <span className={`absolute left-0 top-2 block h-0.5 w-6 bg-current transition-all duration-200 ${open ? "opacity-0" : "opacity-100"}`} />
      <span className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-200 ${open ? "top-2 -rotate-45" : "top-3"}`} />
    </span>
  );
}

// ── Idle timeout constants ─────────────────────────────────────────
const IDLE_TIMEOUT_MS  = 20 * 60 * 1000; // 20 minutes
const IDLE_WARNING_MS  = 19 * 60 * 1000; // show warning at 19 minutes
const ACTIVITY_EVENTS  = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const;

// ── Idle Warning Modal ─────────────────────────────────────────────
function IdleWarningModal({ secondsLeft, onStayLoggedIn }: { secondsLeft: number; onStayLoggedIn: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <svg className="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h2 className="text-base font-semibold text-slate-800">Session Expiring</h2>
        </div>
        <div className="px-5 py-5">
          <p className="mb-1 text-sm text-slate-600">
            You&apos;ve been inactive for a while. You will be signed out automatically in:
          </p>
          <p className="my-3 text-center text-4xl font-bold tabular-nums text-red-600">
            {secondsLeft}s
          </p>
          <p className="mb-5 text-center text-xs text-slate-400">Move your mouse or press any key to stay signed in.</p>
          <button
            type="button"
            onClick={onStayLoggedIn}
            className="inline-flex w-full min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Change Password Modal ──────────────────────────────────────────
function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent]   = useState("");
  const [next, setNext]         = useState("");
  const [confirm, setConfirm]   = useState("");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);
  const [saving, setSaving]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (next !== confirm) { setError("New passwords do not match."); return; }
    if (next.length < 8)  { setError("New password must be at least 8 characters."); return; }
    setSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to change password.");
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Change Password</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="px-5 py-5">
          {success ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-slate-700">Your password has been updated successfully.</p>
              <button type="button" onClick={onClose} className="btn-primary w-full">Done</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Current password</label>
                <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="input" required autoComplete="current-password" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">New password</label>
                <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="input" required autoComplete="new-password" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Confirm new password</label>
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" required autoComplete="new-password" />
              </div>
              <ErrorToast message={error} onClose={() => setError("")} />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">{saving ? "Saving…" : "Update password"}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── User dropdown (top-left sidebar) ──────────────────────────────
function UserMenu({ initials, name, email }: { initials: string; name?: string | null; email?: string | null }) {
  const [open, setOpen]               = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {showChangePw && <ChangePasswordModal onClose={() => setShowChangePw(false)} />}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-100 active:bg-slate-200"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
            {initials}
          </span>
          <span className="hidden min-w-0 sm:block">
            <span className="block truncate text-sm font-medium text-slate-700 leading-tight">{name ?? email}</span>
            {name && email && <span className="block truncate text-[11px] text-slate-400 leading-tight">{email}</span>}
          </span>
          <svg className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <button
              type="button"
              onClick={() => { setOpen(false); setShowChangePw(true); }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              Change Password
            </button>
            <div className="border-t border-slate-100" />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Idle timeout ───────────────────────────────────────────────────
  const [idleWarning, setIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(60);
  const idleTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = useCallback(() => {
    if (idleTimerRef.current)    clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearInterval(warningTimerRef.current);
  }, []);

  const startIdleTimer = useCallback(() => {
    clearTimers();
    setIdleWarning(false);

    // Show warning at 19 min
    idleTimerRef.current = setTimeout(() => {
      setIdleWarning(true);
      setIdleCountdown(60);
      warningTimerRef.current = setInterval(() => {
        setIdleCountdown((s) => {
          if (s <= 1) {
            signOut({ callbackUrl: "/login" });
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }, IDLE_WARNING_MS);
  }, [clearTimers]);

  useEffect(() => {
    startIdleTimer();
    const reset = () => startIdleTimer();
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, reset, { passive: true }));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, reset));
    };
  }, [startIdleTimer, clearTimers]);

  const modules = (user.modules ?? []) as Array<{
    code: string; canView: boolean; canCreate: boolean; canEdit: boolean;
    canDelete: boolean; validUntil: string | null;
  }>;
  const isSuperAdmin = (user as { isSuperAdmin?: boolean }).isSuperAdmin ?? false;
  const menuItems = getMenuModules(modules, isSuperAdmin);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((o) => !o), []);

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    const set = new Set<string>();
    menuItems.forEach((entry) => {
      if (entry.type === "group" && entry.children.some((c) => pathname.startsWith(c.href.split("?")[0]))) {
        set.add(entry.label);
      }
    });
    return set;
  });

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  useEffect(() => {
    menuItems.forEach((entry) => {
      if (
        entry.type === "group" &&
        entry.children.some((c) => pathname.startsWith(c.href.split("?")[0]))
      ) {
        setExpandedGroups((prev) =>
          prev.has(entry.label) ? prev : new Set(prev).add(entry.label)
        );
      }
    });
  }, [pathname, menuItems]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    document.body.style.touchAction = drawerOpen ? "none" : "";
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [drawerOpen]);

  // Separate Settings group from main items
  const mainItems = menuItems.filter(
    (e) => !(e.type === "group" && e.label === "Settings")
  );
  const settingsGroup = menuItems.find(
    (e) => e.type === "group" && e.label === "Settings"
  );

  // ── Reusable renderers ──────────────────────────────────────────
  const renderGroup = (entry: Extract<typeof menuItems[number], { type: "group" }>) => {
    const expanded = expandedGroups.has(entry.label);
    const iconName = GROUP_ICON[entry.label] ?? "dot";
    return (
      <div key={entry.label}>
        <button
          type="button"
          onClick={() => toggleGroup(entry.label)}
          className="flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white active:bg-white/10"
        >
          <NavIcon name={iconName} />
          <span className="flex-1">{entry.label}</span>
          {/* Side arrow: right when collapsed, down when expanded */}
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
        {expanded && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-3">
            {entry.children.map((child) => {
              const active = pathname.startsWith(child.href.split("?")[0]);
              const childIcon = LABEL_ICON[child.label] ?? CODE_ICON[child.code] ?? "dot";
              return (
                <Link
                  key={child.code + child.href}
                  href={child.href}
                  onClick={closeDrawer}
                  className={`flex min-h-[38px] items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary/20 font-medium text-primary"
                      : "font-normal text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <NavIcon name={childIcon} className="h-4 w-4 shrink-0" />
                  {child.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderItem = (entry: Extract<typeof menuItems[number], { type: "item" }>) => {
    const active = pathname.startsWith(entry.href.split("?")[0]);
    const iconName = CODE_ICON[entry.code] ?? "dot";
    return (
      <Link
        key={entry.code}
        href={entry.href}
        onClick={closeDrawer}
        className={`flex min-h-[42px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "bg-primary/20 text-primary"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        }`}
      >
        <NavIcon name={iconName} />
        {entry.label}
      </Link>
    );
  };

  // ── User initials avatar ─────────────────────────────────────────
  const initials = (user.name ?? user.email ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // ── Sidebar content ─────────────────────────────────────────────
  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col bg-[#1a2035] px-3 py-4">
      {/* Logo */}
      <Link
        href="/app/dashboard"
        onClick={closeDrawer}
        className="mb-6 flex items-center gap-2.5 px-2"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
          CP
        </span>
        <span className="text-base font-semibold text-white">CP Portal</span>
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {mainItems.map((entry) =>
          entry.type === "group" ? renderGroup(entry) : renderItem(entry)
        )}
      </nav>

      {/* SETTING section */}
      {settingsGroup && settingsGroup.type === "group" && (
        <>
          <div className="my-3 border-t border-white/10" />
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Setting
          </p>
          <div className="space-y-0.5">{renderGroup(settingsGroup)}</div>
        </>
      )}
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <NavigationLoader />
      {idleWarning && (
        <IdleWarningModal
          secondsLeft={idleCountdown}
          onStayLoggedIn={startIdleTimer}
        />
      )}
      {/* Mobile overlay */}
      <button
        type="button"
        onClick={closeDrawer}
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 md:hidden ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] shadow-2xl transition-transform duration-200 ease-out md:relative md:z-0 md:w-56 md:max-w-none md:translate-x-0 md:shadow-none md:h-screen ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Right column: top bar + main content */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="no-print flex shrink-0 min-h-[52px] items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          {/* Left: hamburger (mobile) + title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleDrawer}
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 md:hidden"
            >
              <HamburgerIcon open={drawerOpen} />
            </button>
            <span className="text-sm font-semibold text-slate-700 md:hidden">CP Portal</span>
          </div>

          {/* Right: user dropdown */}
          <UserMenu initials={initials} name={user.name} email={user.email} />
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
