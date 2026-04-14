import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaymentAccountActions } from "./PaymentAccountActions";

export default async function PaymentAccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/payment-accounts");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  const canView = canAccessModule(modules, isSuperAdmin, MODULE_CODES.PAYMENT_ACCOUNTS, "view");
  const canEdit = canAccessModule(modules, isSuperAdmin, MODULE_CODES.PAYMENT_ACCOUNTS, "edit");
  const canCreate = canAccessModule(modules, isSuperAdmin, MODULE_CODES.PAYMENT_ACCOUNTS, "create");
  const canDelete = canAccessModule(modules, isSuperAdmin, MODULE_CODES.PAYMENT_ACCOUNTS, "delete");

  if (!canView) {
    redirect("/app/dashboard");
  }

  type AccountRow = { id: string; code: string; name: string; description: string | null; isActive: boolean };
  let accounts: AccountRow[] = [];
  const paymentAccountDelegate = (prisma as { paymentAccount?: { findMany: (args: unknown) => Promise<AccountRow[]> } }).paymentAccount;
  if (paymentAccountDelegate && typeof paymentAccountDelegate.findMany === "function") {
    try {
      accounts = await paymentAccountDelegate.findMany({ orderBy: { code: "asc" } });
    } catch (e) {
      console.error("PaymentAccount findMany failed (run: npx prisma generate && npx prisma db push)", e);
    }
  }

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-heading mb-0">Payment Accounts</h1>
        {canCreate && (
          <Link
            href="/app/payment-accounts/new"
            className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-5"
          >
            Add account
          </Link>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">Code</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Description</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                {(canEdit || canDelete) && (
                  <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {accounts.length === 0 ? (
                <tr>
                  <td colSpan={canEdit || canDelete ? 5 : 4} className="px-4 py-8 text-center text-slate-500">
                    No payment accounts yet. Click &quot;Add account&quot; to create one.
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{account.code}</td>
                    <td className="px-4 py-3 text-slate-800">{account.name}</td>
                    <td className="px-4 py-3 text-slate-600">{account.description ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          account.isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {account.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <PaymentAccountActions
                        id={account.id}
                        name={account.name}
                        canEdit={canEdit}
                        canDelete={canDelete}
                      />
                    )}
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
