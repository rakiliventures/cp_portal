import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { BudgetClient, type BudgetItem } from "./BudgetClient";

export default async function FinanceBudgetPage() {
  const session      = await getServerSession(authOptions);
  const isSuperAdmin = !!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin;
  const modules      = (session?.user as { modules?: ModuleAssignment[] })?.modules;
  const canCreate    = canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "create");
  const canEdit      = canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "edit");
  const canDelete    = canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "delete");

  const raw = await prisma.budgetForecast.findMany({
    orderBy: { date: "desc" },
    include: { recordedBy: { select: { name: true } } },
  });

  const items: BudgetItem[] = raw.map((i) => ({
    id:             i.id,
    title:          i.title,
    date:           i.date.toISOString(),
    forecastAmount: i.forecastAmount.toString(),
    recordedBy:     i.recordedBy,
    createdAt:      i.createdAt.toISOString(),
  }));

  return (
    <div className="min-w-0">
      <BudgetClient
        initialItems={items}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    </div>
  );
}
