import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyPaymentsTable, type MyPayment } from "./MyPaymentsTable";

export default async function MyPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/finance/my-payments");

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login?callbackUrl=/app/finance/my-payments");

  const raw = await prisma.payment.findMany({
    where:   { memberId: userId },
    orderBy: { datePaid: "desc" },
    include: {
      account:    { select: { code: true, name: true } },
      verifiedBy: { select: { name: true } },
    },
  });

  const payments: MyPayment[] = raw.map((p) => ({
    id:          p.id,
    mpesaCode:   p.mpesaCode,
    datePaid:    p.datePaid.toISOString(),
    amount:      p.amount.toString(),
    accountCode: p.account.code,
    accountName: p.account.name,
    payeeName:   p.payeeName,
    verified:    p.verified,
    verifiedBy:  p.verifiedBy?.name ?? null,
    verifiedAt:  p.verifiedAt?.toISOString() ?? null,
  }));

  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { name: true },
  });

  return (
    <div className="min-w-0">
      <div className="mb-5">
        <h1 className="page-heading">My Payments</h1>
        <p className="text-sm text-slate-500">
          {user?.name} · {payments.length} {payments.length === 1 ? "payment" : "payments"} recorded
        </p>
      </div>

      <MyPaymentsTable payments={payments} />
    </div>
  );
}
