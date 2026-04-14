import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaymentAccountForm } from "../../PaymentAccountForm";

export default async function EditPaymentAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/payment-accounts");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  const canEdit = canAccessModule(modules, isSuperAdmin, MODULE_CODES.PAYMENT_ACCOUNTS, "edit");
  if (!canEdit) redirect("/app/payment-accounts");

  const { id } = await params;
  const account = await prisma.paymentAccount.findUnique({ where: { id } });
  if (!account) notFound();

  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/app/payment-accounts"
          className="rounded-lg text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          ← Back to list
        </Link>
      </div>
      <h1 className="page-heading">Edit payment account</h1>
      <div className="card max-w-lg">
        <PaymentAccountForm
          account={{
            id: account.id,
            code: account.code,
            name: account.name,
            description: account.description,
            isActive: account.isActive,
          }}
        />
      </div>
    </div>
  );
}
