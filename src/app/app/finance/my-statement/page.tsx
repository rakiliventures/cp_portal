import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNum, CP_KITTY_TYPES, WELFARE_TYPES, buildInvoiceRow, buildPaymentRow, sortStatementRows } from "@/lib/statement";
import { StatementTable } from "./StatementTable";

export default async function MyStatementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/finance/my-statement");

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login?callbackUrl=/app/finance/my-statement");

  const [user, financialAccounts, memberPayments, cpKittyPaidAgg, welfarePaidAgg] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
      prisma.financialAccount.findMany({
        where:   { memberId: userId },
        orderBy: { yearOrMonth: "desc" },
        include: {
          createdBy:  { select: { name: true } },
          verifiedBy: { select: { name: true } },
        },
      }),
      prisma.payment.findMany({
        where:   { memberId: userId },
        include: {
          account:    { select: { code: true } },
          createdBy:  { select: { name: true } },
          verifiedBy: { select: { name: true } },
        },
        orderBy: { datePaid: "desc" },
      }),
      prisma.payment.aggregate({
        where: { memberId: userId, account: { code: "CP-KITTY" } },
        _sum:  { amount: true },
      }),
      prisma.payment.aggregate({
        where: { memberId: userId, account: { code: "CP-WELFARE" } },
        _sum:  { amount: true },
      }),
    ]);

  if (!user) redirect("/login?callbackUrl=/app/finance/my-statement");

  // ── Balances ────────────────────────────────────────────────────
  const cpKittyInvoiced = financialAccounts
    .filter((a) => CP_KITTY_TYPES.includes(a.type))
    .reduce((s, a) => s + toNum(a.amountExpected), 0);
  const welfareInvoiced = financialAccounts
    .filter((a) => WELFARE_TYPES.includes(a.type))
    .reduce((s, a) => s + toNum(a.amountExpected), 0);
  const cpKittyPaidTotal = toNum(cpKittyPaidAgg._sum?.amount);
  const welfarePaidTotal = toNum(welfarePaidAgg._sum?.amount);
  const cpKittyBalance   = cpKittyPaidTotal - cpKittyInvoiced;
  const welfareBalance   = welfarePaidTotal - welfareInvoiced;

  // ── Build statement rows ─────────────────────────────────────────
  // Members view their own statement read-only — no verify actions here, regardless
  // of any Finance permission they might otherwise hold.
  const invoiceRows = financialAccounts.map((acc) => buildInvoiceRow(acc, null, false, false));
  const paymentRows = memberPayments.map((pay) => buildPaymentRow(pay, null, false));
  const statementRows = sortStatementRows([...invoiceRows, ...paymentRows]);

  const generatedOn = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-w-0">
      <div className="mb-5">
        <h1 className="page-heading">My Statement</h1>
        <p className="text-sm text-slate-500">{user.name}</p>
      </div>

      <StatementTable
        rows={statementRows}
        balances={{ cpKitty: cpKittyBalance, welfare: welfareBalance }}
        memberName={user.name}
        generatedOn={generatedOn}
      />
    </div>
  );
}
