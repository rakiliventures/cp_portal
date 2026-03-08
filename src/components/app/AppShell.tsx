"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useCallback, useEffect } from "react";
import type { User } from "next-auth";
import { getMenuModules } from "@/lib/permissions";

type AppShellProps = { user: User & { id: string; modules?: unknown }; children: React.ReactNode };

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-5 w-6">
      <span
        className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-200 ${
          open ? "top-2 rotate-45" : "top-1"
        }`}
      />
      <span
        className={`absolute left-0 top-2 block h-0.5 w-6 bg-current transition-all duration-200 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 block h-0.5 w-6 bg-current transition-all duration-200 ${
          open ? "top-2 -rotate-45" : "top-3"
        }`}
      />
    </span>
  );
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const modules = (user.modules ?? []) as Array<{
    code: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    validUntil: string | null;
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
      if (entry.type === "group" && entry.children.some((c) => pathname.startsWith(c.href.split("?")[0]))) {
        setExpandedGroups((prev) => (prev.has(entry.label) ? prev : new Set(prev).add(entry.label)));
      }
    });
  }, [pathname, menuItems]);

  // Close drawer on route change (mobile)
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer open on mobile
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [drawerOpen]);

  const navContent = (
    <>
      <Link
        href="/app/dashboard"
        onClick={closeDrawer}
        className="mb-6 text-lg font-semibold text-primary"
      >
        CP Portal
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto">
        {menuItems.map((entry) => {
          if (entry.type === "group") {
            const expanded = expandedGroups.has(entry.label);
            return (
              <div key={entry.label} className="pt-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(entry.label)}
                  className="flex min-h-[44px] w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                >
                  <span className="font-semibold uppercase tracking-wider text-slate-500">{entry.label}</span>
                  <svg
                    className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expanded &&
                  entry.children.map((child) => {
                    const active = pathname.startsWith(child.href.split("?")[0]);
                    return (
                      <Link
                        key={child.code + child.href}
                        href={child.href}
                        onClick={closeDrawer}
                        className={`flex min-h-[44px] items-center rounded-lg px-3 py-3 pl-5 text-sm font-medium ${
                          active ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
              </div>
            );
          }
          const active = pathname.startsWith(entry.href.split("?")[0]);
          return (
            <Link
              key={entry.code}
              href={entry.href}
              onClick={closeDrawer}
              className={`flex min-h-[44px] items-center rounded-lg px-3 py-3 text-sm font-medium ${
                active ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100 active:bg-slate-200"
              }`}
            >
              {entry.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 pt-4">
        <p className="truncate px-3 py-2 text-xs text-slate-500">{user.email}</p>
        <button
          type="button"
          onClick={() => {
            closeDrawer();
            signOut({ callbackUrl: "/" });
          }}
          className="mt-1 flex min-h-[44px] w-full items-center rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 active:bg-slate-200"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile: overlay when drawer open */}
      <button
        type="button"
        onClick={closeDrawer}
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden ${
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar: drawer on mobile, fixed sidebar on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white p-4 shadow-xl transition-transform duration-200 ease-out md:relative md:z-0 md:w-56 md:max-w-none md:translate-x-0 md:shadow-none ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full min-h-0 flex-col">{navContent}</div>
      </aside>

      {/* Main: mobile header + content */}
      <div className="flex min-h-screen flex-1 flex-col md:min-h-0">
        <header className="sticky top-0 z-30 flex min-h-[52px] items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 md:hidden">
          <button
            type="button"
            onClick={toggleDrawer}
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-primary hover:bg-slate-100 active:bg-slate-200"
          >
            <MenuIcon open={drawerOpen} />
          </button>
          <span className="text-lg font-semibold text-primary">CP Portal</span>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 p-4 sm:p-6">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
