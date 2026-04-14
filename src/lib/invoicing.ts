import { prisma } from "@/lib/prisma";

const CP_KITTY_ACCOUNTS = ["CP_KITTY_ANNUAL", "CP_KITTY_MONTHLY", "MANUAL_CP_KITTY"] as const;
const WELFARE_ACCOUNTS  = ["WELFARE_MONTHLY", "MANUAL_WELFARE"] as const;

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

type InvoiceRecord = {
  memberId:       string;
  type:           string;
  yearOrMonth:    string;
  amountExpected: number;
};

/** Builds all invoice records a member should have, from joinDate up to and including today. */
export function buildInvoiceRecords(memberId: string, joinDate: Date): InvoiceRecord[] {
  const today        = new Date();
  const currentYear  = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const joinYear     = joinDate.getFullYear();
  const joinMonth    = joinDate.getMonth(); // 0-indexed

  const records: InvoiceRecord[] = [];

  // CP Kitty Annual — 1 000 KES per calendar year, from join year to current year
  for (let yr = joinYear; yr <= currentYear; yr++) {
    records.push({ memberId, type: "CP_KITTY_ANNUAL", yearOrMonth: String(yr), amountExpected: 1000 });
  }

  // CP Kitty Monthly + Welfare Monthly — 300 KES each, from join month to current month
  let y = joinYear;
  let m = joinMonth;
  for (;;) {
    const ym = `${y}-${String(m + 1).padStart(2, "0")}`;
    records.push({ memberId, type: "CP_KITTY_MONTHLY",  yearOrMonth: ym, amountExpected: 300 });
    records.push({ memberId, type: "WELFARE_MONTHLY",   yearOrMonth: ym, amountExpected: 300 });
    if (y === currentYear && m === currentMonth) break;
    m++;
    if (m > 11) { m = 0; y++; }
  }

  return records;
}

/** Idempotently generates all missing auto-invoices for a single member. */
export async function generateMemberInvoices(memberId: string, joinDate: Date): Promise<void> {
  const expected = buildInvoiceRecords(memberId, joinDate);

  const existing = await prisma.financialAccount.findMany({
    where: {
      memberId,
      type: { in: ["CP_KITTY_ANNUAL", "CP_KITTY_MONTHLY", "WELFARE_MONTHLY"] },
    },
    select: { type: true, yearOrMonth: true },
  });

  const existingKeys = new Set(existing.map((r) => `${r.type}|${r.yearOrMonth}`));
  const toCreate = expected.filter((r) => !existingKeys.has(`${r.type}|${r.yearOrMonth}`));

  if (toCreate.length > 0) {
    await prisma.financialAccount.createMany({ data: toCreate, skipDuplicates: true });
  }
}

/** Idempotently generates all missing auto-invoices for every member. */
export async function generateAllInvoices(): Promise<void> {
  const members = await prisma.memberProfile.findMany({
    where:  { user: { status: "Active" } },
    select: { userId: true, joinDate: true },
  });

  if (members.length === 0) return;

  const allExpected: InvoiceRecord[] = [];
  for (const mp of members) {
    allExpected.push(...buildInvoiceRecords(mp.userId, mp.joinDate));
  }

  const existing = await prisma.financialAccount.findMany({
    where: { type: { in: ["CP_KITTY_ANNUAL", "CP_KITTY_MONTHLY", "WELFARE_MONTHLY"] } },
    select: { memberId: true, type: true, yearOrMonth: true },
  });

  const existingKeys = new Set(existing.map((r) => `${r.memberId}|${r.type}|${r.yearOrMonth}`));
  const toCreate = allExpected.filter((r) => !existingKeys.has(`${r.memberId}|${r.type}|${r.yearOrMonth}`));

  if (toCreate.length > 0) {
    await prisma.financialAccount.createMany({ data: toCreate, skipDuplicates: true });
  }
}

export type MemberBalance = { cpKitty: number; welfare: number };

/**
 * Returns the balance for each member:
 *   balance = total payments - total invoiced
 * Positive = credit; negative = in arrears.
 */
export async function getMemberBalances(
  memberIds: string[]
): Promise<Map<string, MemberBalance>> {
  if (memberIds.length === 0) return new Map();

  const [cpPayments, welfarePayments, cpInvoices, welfareInvoices] = await Promise.all([
    prisma.payment.groupBy({
      by:    ["memberId"],
      where: { account: { code: "CP-KITTY" }, memberId: { in: memberIds } },
      _sum:  { amount: true },
    }),
    prisma.payment.groupBy({
      by:    ["memberId"],
      where: { account: { code: "CP-WELFARE" }, memberId: { in: memberIds } },
      _sum:  { amount: true },
    }),
    prisma.financialAccount.groupBy({
      by:    ["memberId"],
      where: { type: { in: [...CP_KITTY_ACCOUNTS] }, memberId: { in: memberIds } },
      _sum:  { amountExpected: true },
    }),
    prisma.financialAccount.groupBy({
      by:    ["memberId"],
      where: { type: { in: [...WELFARE_ACCOUNTS] }, memberId: { in: memberIds } },
      _sum:  { amountExpected: true },
    }),
  ]);

  const cpPaidMap     = new Map(cpPayments.map((r)     => [r.memberId, toNum(r._sum.amount)]));
  const welfarePaidMap= new Map(welfarePayments.map((r) => [r.memberId, toNum(r._sum.amount)]));
  const cpInvMap      = new Map(cpInvoices.map((r)     => [r.memberId, toNum(r._sum.amountExpected)]));
  const welfareInvMap = new Map(welfareInvoices.map((r) => [r.memberId, toNum(r._sum.amountExpected)]));

  const result = new Map<string, MemberBalance>();
  for (const id of memberIds) {
    result.set(id, {
      cpKitty: (cpPaidMap.get(id) ?? 0)      - (cpInvMap.get(id)      ?? 0),
      welfare: (welfarePaidMap.get(id) ?? 0) - (welfareInvMap.get(id) ?? 0),
    });
  }
  return result;
}
