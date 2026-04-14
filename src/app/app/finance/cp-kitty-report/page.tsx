import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { CpKittyReport, type MonthPayment, type ExpenseEntry } from "./CpKittyReport";

function toNum(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

export default async function CpKittyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/finance/cp-kitty-report");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "view")) {
    redirect("/app/dashboard");
  }

  const params       = await searchParams;
  const now          = new Date();
  const currentYear  = now.getFullYear();
  const selectedYear =
    Math.max(2000, Math.min(currentYear, parseInt(params.year ?? String(currentYear), 10))) ||
    currentYear;

  const yearStart = new Date(`${selectedYear}-01-01T00:00:00.000Z`);
  const yearEnd   = new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`);

  const cpKittyAccount = await prisma.paymentAccount.findFirst({
    where:  { code: "CP-KITTY" },
    select: { id: true },
  });

  const [
    paymentsThisYear,
    expensesThisYear,
    paymentsBefore,
    expensesBefore,
    earliestPayment,
    earliestExpense,
  ] = await Promise.all([
    cpKittyAccount
      ? prisma.payment.findMany({
          where:   { accountId: cpKittyAccount.id, datePaid: { gte: yearStart, lt: yearEnd } },
          select:  { datePaid: true, amount: true },
        })
      : Promise.resolve([]),

    prisma.expense.findMany({
      where:   { categoryOrAccount: "CP-KITTY", expenseDate: { gte: yearStart, lt: yearEnd } },
      orderBy: { expenseDate: "asc" },
      select:  { id: true, expenseDate: true, title: true, description: true, amount: true },
    }),

    cpKittyAccount
      ? prisma.payment.aggregate({
          where: { accountId: cpKittyAccount.id, datePaid: { lt: yearStart } },
          _sum:  { amount: true },
        })
      : Promise.resolve({ _sum: { amount: null } }),

    prisma.expense.aggregate({
      where: { categoryOrAccount: "CP-KITTY", expenseDate: { lt: yearStart } },
      _sum:  { amount: true },
    }),

    cpKittyAccount
      ? prisma.payment.findFirst({
          where:   { accountId: cpKittyAccount.id },
          orderBy: { datePaid: "asc" },
          select:  { datePaid: true },
        })
      : Promise.resolve(null),

    prisma.expense.findFirst({
      where:   { categoryOrAccount: "CP-KITTY" },
      orderBy: { expenseDate: "asc" },
      select:  { expenseDate: true },
    }),
  ]);

  // Balance carried forward
  const balanceBF =
    toNum(paymentsBefore._sum.amount) - toNum(expensesBefore._sum.amount);

  // Aggregate payments by month
  const paymentsByMonth = new Map<number, number>();
  for (const p of paymentsThisYear) {
    const m = new Date(p.datePaid).getUTCMonth() + 1;
    paymentsByMonth.set(m, (paymentsByMonth.get(m) ?? 0) + toNum(p.amount));
  }
  const payments: MonthPayment[] = Array.from(paymentsByMonth.entries()).map(
    ([month, total]) => ({ month, total }),
  );

  // Individual expenses
  const expenses: ExpenseEntry[] = expensesThisYear.map((e) => {
    const d = new Date(e.expenseDate);
    return {
      id:          e.id,
      month:       d.getUTCMonth() + 1,
      day:         d.getUTCDate(),
      dateLabel:   d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      title:       e.title ?? null,
      description: e.description,
      amount:      toNum(e.amount),
    };
  });

  // Available years for the selector
  const minYear = Math.min(
    earliestPayment ? new Date(earliestPayment.datePaid).getFullYear() : currentYear,
    earliestExpense ? new Date(earliestExpense.expenseDate).getFullYear() : currentYear,
    currentYear,
  );
  const availableYears = Array.from(
    { length: currentYear - minYear + 1 },
    (_, i) => currentYear - i,
  );

  return (
    <div className="min-w-0">
      <div className="mb-5">
        <h1 className="page-heading">CP Kitty Summary Report</h1>
        <p className="text-sm text-slate-500">
          Monthly payments collected and individual expenses charged to CP Kitty · {selectedYear}
        </p>
      </div>

      <CpKittyReport
        year={selectedYear}
        availableYears={availableYears}
        balanceBF={balanceBF}
        payments={payments}
        expenses={expenses}
      />
    </div>
  );
}
