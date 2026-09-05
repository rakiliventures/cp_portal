import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { buildInvoiceRow } from "@/lib/statement";
import { InvoicesTable } from "./InvoicesTable";

export default async function AllInvoicesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/finance/invoices");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules      = (session.user as { modules?: ModuleAssignment[] }).modules;
  const viewerId     = (session.user as { id?: string }).id ?? null;

  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "view")) {
    redirect("/app/dashboard");
  }

  const canVerify = canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "edit");
  const canEdit   = canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "edit");

  const financialAccounts = await prisma.financialAccount.findMany({
    orderBy: { yearOrMonth: "desc" },
    include: {
      member:     { select: { name: true, email: true } },
      createdBy:  { select: { name: true } },
      verifiedBy: { select: { name: true } },
    },
  });

  const rows = financialAccounts.map((acc) => ({
    ...buildInvoiceRow(acc, viewerId, canVerify, canEdit),
    memberEmail: acc.member.email,
  }));

  const unverifiedManualCount = financialAccounts.filter(
    (a) => (a.type === "MANUAL_CP_KITTY" || a.type === "MANUAL_WELFARE") && !a.verified
  ).length;

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="page-heading mb-0">All Invoices</h1>
        <p className="mt-1 text-sm text-slate-600">
          Every CP Kitty and Welfare invoice across all members — auto-generated dues and manual entries.
        </p>
      </div>

      <InvoicesTable rows={rows} unverifiedManualCount={unverifiedManualCount} />
    </div>
  );
}
