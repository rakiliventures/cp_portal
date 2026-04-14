import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaymentForm } from "../PaymentForm";

export default async function NewPaymentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/finance/payments/new");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "create")) {
    redirect("/app/finance/payments");
  }

  const [accounts, members] = await Promise.all([
    prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.user.findMany({
      where: { memberProfile: { isNot: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <Link
          href="/app/finance/payments"
          className="text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        >
          ← Back to Payments
        </Link>
      </div>
      <h1 className="page-heading">Add payment</h1>
      <div className="card max-w-xl">
        <PaymentForm accounts={accounts} members={members} />
      </div>
    </div>
  );
}
