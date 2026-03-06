"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { User } from "next-auth";
import { getMenuModules } from "@/lib/permissions";

type AppShellProps = { user: User & { id: string; modules?: unknown }; children: React.ReactNode };

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
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

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 border-r border-slate-200 bg-white">
        <div className="sticky top-0 flex h-screen flex-col p-4">
          <Link href="/app/dashboard" className="mb-6 text-lg font-semibold text-primary">
            CP Portal
          </Link>
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.code}
                  href={item.href}
                  className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? "bg-primary text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-slate-200 pt-4">
            <p className="truncate px-3 py-1 text-xs text-slate-500">{user.email}</p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-slate-50 p-6">{children}</main>
    </div>
  );
}
