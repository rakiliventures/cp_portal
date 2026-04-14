import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatementTable, type StatementRow } from "./StatementTable";

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

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CP_KITTY_TYPES = ["CP_KITTY_ANNUAL", "CP_KITTY_MONTHLY", "MANUAL_CP_KITTY"];
const WELFARE_TYPES  = ["WELFARE_MONTHLY", "MANUAL_WELFARE"];

function invoiceDescription(type: string, yearOrMonth: string): string {
  if (type === "CP_KITTY_ANNUAL") {
    return `Annual Subscription ${yearOrMonth}`;
  }
  if (type === "CP_KITTY_MONTHLY" || type === "WELFARE_MONTHLY") {
    // yearOrMonth = "YYYY-MM"
    const parts = yearOrMonth.split("-");
    const yr    = parts[0];
    const mo    = parseInt(parts[1] ?? "1", 10) - 1;
    const label = MONTH_NAMES[mo] ?? parts[1];
    const prefix = type === "WELFARE_MONTHLY" ? "Welfare Monthly Contribution" : "Monthly Contribution";
    return `${prefix} — ${label} ${yr}`;
  }
  if (type === "MANUAL_CP_KITTY") return "Manual CP Kitty Invoice";
  if (type === "MANUAL_WELFARE")  return "Manual Welfare Invoice";
  return "Invoice";
}

/** Returns a date string (ISO or comparable) used only for sorting. */
function invoiceSortDate(type: string, yearOrMonth: string): string {
  if (type === "CP_KITTY_ANNUAL")   return `${yearOrMonth}-01-01`;
  if (type === "CP_KITTY_MONTHLY" || type === "WELFARE_MONTHLY") return `${yearOrMonth}-01`;
  // MANUAL_* — yearOrMonth is an ISO timestamp
  return yearOrMonth;
}

function invoiceDateLabel(type: string, yearOrMonth: string): string {
  if (type === "CP_KITTY_ANNUAL")   return `Jan ${yearOrMonth}`;
  if (type === "CP_KITTY_MONTHLY" || type === "WELFARE_MONTHLY") {
    const parts = yearOrMonth.split("-");
    const yr    = parts[0];
    const mo    = parseInt(parts[1] ?? "1", 10) - 1;
    return `${MONTH_NAMES[mo] ?? parts[1]} ${yr}`;
  }
  // MANUAL_* — yearOrMonth is an ISO timestamp, format it nicely
  try {
    const d = new Date(yearOrMonth);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return yearOrMonth;
  }
}

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
      }),
      prisma.payment.findMany({
        where:   { memberId: userId },
        include: { account: { select: { code: true } } },
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
  type RowWithSort = StatementRow & { sortKey: string };

  const invoiceRows: RowWithSort[] = financialAccounts.map((acc) => ({
    key:         `inv-${acc.id}`,
    sortKey:     invoiceSortDate(acc.type, acc.yearOrMonth),
    dateLabel:   invoiceDateLabel(acc.type, acc.yearOrMonth),
    description: invoiceDescription(acc.type, acc.yearOrMonth),
    account:     CP_KITTY_TYPES.includes(acc.type) ? "CP Kitty" : "Welfare",
    debit:       toNum(acc.amountExpected),
    credit:      0,
  }));

  const paymentRows: RowWithSort[] = memberPayments.map((pay) => ({
    key:         `pay-${pay.id}`,
    sortKey:     new Date(pay.datePaid).toISOString(),
    dateLabel:   new Date(pay.datePaid).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    description: `M-PESA Payment (${pay.mpesaCode})`,
    account:     pay.account.code === "CP-WELFARE" ? "Welfare" : "CP Kitty",
    debit:       0,
    credit:      toNum(pay.amount),
  }));

  const statementRows: StatementRow[] = [...invoiceRows, ...paymentRows]
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .map(({ sortKey: _sk, ...row }) => row);

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
