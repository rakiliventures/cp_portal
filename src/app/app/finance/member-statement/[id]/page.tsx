import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { toNum, CP_KITTY_TYPES, WELFARE_TYPES, buildInvoiceRow, buildPaymentRow, sortStatementRows } from "@/lib/statement";
import { StatementTable } from "../../my-statement/StatementTable";

type Params = { params: Promise<{ id: string }> };

export default async function MemberStatementPage({ params }: Params) {
  const { id: memberId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules      = (session.user as { modules?: ModuleAssignment[] }).modules;
  const viewerId     = (session.user as { id?: string }).id ?? null;

  // Viewing any member's statement requires BOTH Membership and Finance access
  // (or superadmin, which bypasses everything).
  const canView =
    isSuperAdmin ||
    (canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "view") &&
     canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "view"));
  if (!canView) redirect("/app/dashboard");

  const canVerify = canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "edit");
  const canEdit   = canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "edit");

  const [user, financialAccounts, memberPayments, cpKittyPaidAgg, welfarePaidAgg] =
    await Promise.all([
      prisma.user.findUnique({
        where:  { id: memberId },
        select: { id: true, name: true, email: true, memberProfile: { select: { userId: true } } },
      }),
      prisma.financialAccount.findMany({
        where:   { memberId },
        orderBy: { yearOrMonth: "desc" },
        include: {
          createdBy:  { select: { name: true } },
          verifiedBy: { select: { name: true } },
        },
      }),
      prisma.payment.findMany({
        where:   { memberId },
        include: {
          account:    { select: { code: true } },
          createdBy:  { select: { name: true } },
          verifiedBy: { select: { name: true } },
        },
        orderBy: { datePaid: "desc" },
      }),
      prisma.payment.aggregate({
        where: { memberId, account: { code: "CP-KITTY" } },
        _sum:  { amount: true },
      }),
      prisma.payment.aggregate({
        where: { memberId, account: { code: "CP-WELFARE" } },
        _sum:  { amount: true },
      }),
    ]);

  if (!user || !user.memberProfile) notFound();

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
  const invoiceRows = financialAccounts.map((acc) => buildInvoiceRow(acc, viewerId, canVerify, canEdit));
  const paymentRows = memberPayments.map((pay) => buildPaymentRow(pay, viewerId, canVerify));
  const statementRows = sortStatementRows([...invoiceRows, ...paymentRows]);

  const generatedOn = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-w-0">
      <div className="mb-5">
        <Link href="/app/membership/current" className="no-print mb-2 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Membership
        </Link>
        <h1 className="page-heading">Member Statement</h1>
        <p className="text-sm text-slate-500">{user.name} · {user.email}</p>
      </div>

      <StatementTable
        rows={statementRows}
        balances={{ cpKitty: cpKittyBalance, welfare: welfareBalance }}
        memberName={user.name ?? ""}
        generatedOn={generatedOn}
        memberId={memberId}
      />
    </div>
  );
}
