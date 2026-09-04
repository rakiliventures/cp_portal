"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ErrorToast } from "@/components/ui/ErrorToast";

export type ModuleOption = { code: string; name: string };

export type SerializedUser = {
  id:           string;
  name:         string;
  email:        string;
  isSuperAdmin: boolean;
  status:       string;
  modules: Array<{
    code:       string;
    name:       string;
    canView:    boolean;
    canCreate:  boolean;
    canEdit:    boolean;
    canDelete:  boolean;
    validUntil: string | null;
  }>;
};

type Props = {
  users:         SerializedUser[];
  modules:       ModuleOption[];
  currentUserId: string;
};

type ModuleFormState = Record<string, {
  canView: boolean; canCreate: boolean; canEdit: boolean; canDelete: boolean; validUntil: string;
}>;

function isAdmin(u: SerializedUser): boolean {
  return u.isSuperAdmin || u.modules.length > 0;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

// ── Manage roles modal ──────────────────────────────────────────────────────

function RoleModal({
  user, modules, onClose, onSuccess,
}: {
  user:      SerializedUser;
  modules:   ModuleOption[];
  onClose:   () => void;
  onSuccess: () => void;
}) {
  const [isSuperAdmin, setIsSuperAdmin] = useState(user.isSuperAdmin);
  const [form, setForm] = useState<ModuleFormState>(() => {
    const initial: ModuleFormState = {};
    for (const mod of modules) {
      const existing = user.modules.find((m) => m.code === mod.code);
      initial[mod.code] = {
        canView:    existing?.canView    ?? false,
        canCreate:  existing?.canCreate  ?? false,
        canEdit:    existing?.canEdit    ?? false,
        canDelete:  existing?.canDelete  ?? false,
        validUntil: existing?.validUntil ?? "",
      };
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  function toggle(code: string, key: "canView" | "canCreate" | "canEdit" | "canDelete") {
    setForm((f) => {
      const row = { ...f[code], [key]: !f[code][key] };
      // Create/Edit/Delete imply View, so the assignment isn't silently invisible.
      if (key !== "canView" && row[key]) row.canView = true;
      return { ...f, [code]: row };
    });
  }

  function setExpiry(code: string, value: string) {
    setForm((f) => ({ ...f, [code]: { ...f[code], validUntil: value } }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          isSuperAdmin,
          modules: modules.map((mod) => ({
            code:       mod.code,
            canView:    form[mod.code].canView,
            canCreate:  form[mod.code].canCreate,
            canEdit:    form[mod.code].canEdit,
            canDelete:  form[mod.code].canDelete,
            validUntil: form[mod.code].validUntil || null,
          })),
        }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to save roles.");
        setSaving(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Manage roles</h3>
            <p className="mt-0.5 text-xs text-slate-400">{user.name} · {user.email}</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {/* Superadmin toggle */}
          <label className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition ${
            isSuperAdmin ? "border-primary bg-primary/5" : "border-slate-200 bg-slate-50"
          }`}>
            <input type="checkbox" checked={isSuperAdmin} onChange={(e) => setIsSuperAdmin(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" />
            <span>
              <span className="block text-sm font-semibold text-slate-800">Superadmin</span>
              <span className="block text-xs text-slate-500">
                Grants every permission automatically, including User Management access. Individual module permissions below become unnecessary.
              </span>
            </span>
          </label>

          {/* Module permission grid */}
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Module permissions</p>
            <div className="space-y-2">
              {modules.map((mod) => {
                const row = form[mod.code];
                return (
                  <div key={mod.code} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700">{mod.name}</span>
                      <div className="flex items-center gap-3">
                        {(["canView", "canCreate", "canEdit", "canDelete"] as const).map((key) => (
                          <label key={key} className="flex items-center gap-1 text-xs text-slate-500">
                            <input type="checkbox" checked={row[key]} onChange={() => toggle(mod.code, key)}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-primary focus:ring-primary" />
                            {key === "canView" ? "View" : key === "canCreate" ? "Create" : key === "canEdit" ? "Edit" : "Delete"}
                          </label>
                        ))}
                      </div>
                    </div>
                    {(row.canView || row.canCreate || row.canEdit || row.canDelete) && (
                      <div className="mt-2 flex items-center gap-2">
                        <label className="text-xs text-slate-500">Expires</label>
                        <input type="date" value={row.validUntil} min={todayIso()}
                          onChange={(e) => setExpiry(mod.code, e.target.value)}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                        <span className="text-xs text-slate-400">(optional — leave blank for permanent access)</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <ErrorToast message={error} onClose={() => setError("")} />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-60">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-light disabled:opacity-60">
            {saving ? "Saving…" : "Save roles"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main client ──────────────────────────────────────────────────────────────

export function UserManagementClient({ users, modules, currentUserId }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [managingUser, setManagingUser] = useState<SerializedUser | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users.filter(isAdmin);
    return users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, query]);

  const adminCount = users.filter(isAdmin).length;

  return (
    <div>
      {managingUser && (
        <RoleModal
          user={managingUser}
          modules={modules}
          onClose={() => setManagingUser(null)}
          onSuccess={() => { setManagingUser(null); router.refresh(); }}
        />
      )}

      {/* Search */}
      <div className="mb-4 relative max-w-sm">
        <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input type="search" placeholder="Search any user by name or email…"
          value={query} onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <p className="mb-2 text-xs text-slate-500">
        {query.trim()
          ? `${filtered.length} user${filtered.length !== 1 ? "s" : ""} matching “${query}”`
          : `${adminCount} user${adminCount !== 1 ? "s" : ""} with admin roles`}
      </p>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">User</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Roles</th>
                <th className="px-4 py-3 font-semibold text-slate-700"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    {query.trim() ? "No users match your search." : "No users have been granted admin roles yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {u.name}
                        {u.id === currentUserId && <span className="ml-1.5 text-xs font-normal text-slate-400">(you)</span>}
                        {u.status !== "Active" && (
                          <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                            {u.status}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {u.isSuperAdmin && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                            Superadmin
                          </span>
                        )}
                        {!u.isSuperAdmin && u.modules.length === 0 && (
                          <span className="text-xs text-slate-400">No roles</span>
                        )}
                        {!u.isSuperAdmin && u.modules.map((m) => (
                          <span key={m.code} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {m.name}
                            {m.validUntil && <span className="text-slate-400"> · until {m.validUntil}</span>}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setManagingUser(u)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
                        Manage roles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
