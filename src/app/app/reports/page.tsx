import { prisma } from "@/lib/prisma";

function toNum(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);
}

export default async function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const [
    totalMembers,
    paidUpMembers,
    membersByWorkgroup,
    totalExpensesThisYear,
    collectedThisYear,
    collectedPrevYear,
    budgetThisYear,
  ] = await Promise.all([
    prisma.memberProfile.count(),
    prisma.financialAccount
      .findMany({
        where: { type: "AnnualFee", yearOrMonth: String(currentYear) },
        select: { memberId: true, amountExpected: true, amountPaid: true },
      })
      .then((rows) => rows.filter((r) => toNum(r.amountPaid) >= toNum(r.amountExpected)).length),
    prisma.memberProfile.groupBy({
      by: ["workgroupId"],
      _count: { userId: true },
      orderBy: { _count: { userId: "desc" } },
    }).then(async (groups) => {
      const workgroups = await prisma.workgroup.findMany({ where: { id: { in: groups.map((g) => g.workgroupId) } } });
      const nameById = Object.fromEntries(workgroups.map((w) => [w.id, w.name]));
      return groups.map((g) => ({ workgroup: nameById[g.workgroupId] ?? g.workgroupId, count: g._count.userId }));
    }),
    prisma.expense.aggregate({
      where: {
        expenseDate: { gte: new Date(`${currentYear}-01-01`), lt: new Date(`${currentYear + 1}-01-01`) },
      },
      _sum: { amount: true },
    }).then((r) => toNum(r._sum?.amount)),
    prisma.transaction.aggregate({
      where: {
        transactionDate: { gte: new Date(`${currentYear}-01-01`), lt: new Date(`${currentYear + 1}-01-01`) },
      },
      _sum: { amount: true },
    }).then((r) => toNum(r._sum?.amount)),
    prisma.transaction.aggregate({
      where: {
        transactionDate: { gte: new Date(`${prevYear}-01-01`), lt: new Date(`${prevYear + 1}-01-01`) },
      },
      _sum: { amount: true },
    }).then((r) => toNum(r._sum?.amount)),
    prisma.budgetForecast
      .findMany({ where: { period: { startsWith: String(currentYear) } } })
      .then((rows) => rows.reduce((sum, r) => sum + toNum(r.forecastAmount), 0)),
  ]);

  return (
    <div className="min-w-0">
      <h1 className="page-heading">Group Dashboard</h1>
      <p className="mb-6 text-sm text-slate-600">
        Summary of membership, finances, and budget for the group. View only.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Total members</p>
          <p className="mt-1 text-2xl font-bold text-primary">{totalMembers}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Paid up ({currentYear})</p>
          <p className="mt-1 text-2xl font-bold text-primary">{paidUpMembers}</p>
          <p className="mt-1 text-xs text-slate-500">Members with current year annual fee paid</p>
        </div>
        <div className="card sm:col-span-2 lg:col-span-1">
          <p className="text-sm font-medium text-slate-500">Members per workgroup</p>
          <ul className="mt-2 space-y-1">
            {membersByWorkgroup.length === 0 ? (
              <li className="text-slate-500">—</li>
            ) : (
              membersByWorkgroup.map((w) => (
                <li key={w.workgroup} className="flex justify-between text-sm">
                  <span className="text-slate-700">{w.workgroup}</span>
                  <span className="font-medium text-slate-900">{w.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Total expenses ({currentYear})</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(totalExpensesThisYear)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Collected ({currentYear})</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatCurrency(collectedThisYear)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Collected (previous year)</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(collectedPrevYear)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-slate-500">Budget ({currentYear})</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(budgetThisYear)}</p>
        </div>
      </div>
    </div>
  );
}
