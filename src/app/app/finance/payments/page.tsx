import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaymentsTable, type SerializedPayment } from "./PaymentsTable";

export default async function FinancePaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/finance/payments");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;

  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "view")) {
    redirect("/app/dashboard");
  }

  const canCreate = canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "create");
  const canEdit   = canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "edit");
  const canDelete = canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "delete");

  const raw = await prisma.payment.findMany({
    orderBy: { datePaid: "desc" },
    include: {
      account:    { select: { code: true, name: true } },
      member:     { select: { id: true, name: true, email: true } },
      createdBy:  { select: { id: true, name: true } },
      verifiedBy: { select: { id: true, name: true } },
    },
  });

  // Serialize: Decimal → string, Date → ISO string
  const payments: SerializedPayment[] = raw.map((p) => ({
    id:           p.id,
    mpesaCode:    p.mpesaCode,
    datePaid:     p.datePaid.toISOString(),
    amount:       p.amount.toString(),
    account:      p.account,
    member:       p.member,
    payeeName:    p.payeeName,
    createdById:  p.createdById,
    createdBy:    p.createdBy,
    verified:     p.verified,
    verifiedById: p.verifiedById,
    verifiedBy:   p.verifiedBy,
    verifiedAt:   p.verifiedAt?.toISOString() ?? null,
  }));

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-heading mb-0">Payments</h1>
          <p className="mt-1 text-sm text-slate-600">
            View member payments (CP-KITTY, CP-Welfare).
          </p>
        </div>
        {canCreate && (
          <div className="no-print flex flex-wrap gap-2">
            <Link
              href="/app/finance/payments/new"
              className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-5"
            >
              Add payment
            </Link>
            <Link
              href="/app/finance/payments/import"
              className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-5"
            >
              Import from report
            </Link>
          </div>
        )}
      </div>

      <PaymentsTable payments={payments} canEdit={canEdit} canDelete={canDelete} />
    </div>
  );
}
