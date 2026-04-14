import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { ExpensesClient, type SerializedExpense } from "./ExpensesClient";

export default async function FinanceExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/finance/expenses");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;

  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "view")) {
    redirect("/app/dashboard");
  }

  const canCreate = canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "create");

  const [raw, paymentAccounts] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { expenseDate: "desc" },
      include: { recordedBy: { select: { id: true, name: true } } },
    }),
    prisma.paymentAccount.findMany({
      where:   { isActive: true },
      orderBy: { name: "asc" },
      select:  { id: true, code: true, name: true },
    }),
  ]);

  const expenses: SerializedExpense[] = raw.map((e) => ({
    id:                e.id,
    title:             e.title ?? null,
    description:       e.description,
    amount:            e.amount.toString(),
    expenseDate:       e.expenseDate.toISOString(),
    categoryOrAccount: e.categoryOrAccount ?? null,
    recordedBy:        e.recordedBy,
    createdAt:         e.createdAt.toISOString(),
  }));

  return (
    <div className="min-w-0">
      <div className="mb-5">
        <h1 className="page-heading">Expenses</h1>
        <p className="text-sm text-slate-500">All recorded expenses across CP Kitty and Welfare Kitty accounts.</p>
      </div>

      <ExpensesClient expenses={expenses} canCreate={canCreate} paymentAccounts={paymentAccounts} />
    </div>
  );
}
