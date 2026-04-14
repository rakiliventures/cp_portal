import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PaymentAccountForm } from "../PaymentAccountForm";

export default async function NewPaymentAccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/payment-accounts");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: { code: string }[] }).modules;
  const canCreate = canAccessModule(modules, isSuperAdmin, MODULE_CODES.PAYMENT_ACCOUNTS, "create");
  if (!canCreate) redirect("/app/payment-accounts");

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
      <h1 className="page-heading">Add payment account</h1>
      <div className="card max-w-lg">
        <PaymentAccountForm />
      </div>
    </div>
  );
}
