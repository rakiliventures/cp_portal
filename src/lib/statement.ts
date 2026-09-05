import { MONTH_NAMES } from "@/lib/birthday";

export function toNum(value: unknown): number {
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

export const CP_KITTY_TYPES = ["CP_KITTY_ANNUAL", "CP_KITTY_MONTHLY", "MANUAL_CP_KITTY"];
export const WELFARE_TYPES  = ["WELFARE_MONTHLY", "MANUAL_WELFARE"];

export type StatementRow = {
  key:           string;
  rowType:       "invoice" | "payment";
  rawId:         string;
  dateLabel:     string;
  description:   string;
  source?:       string;  // "System" / "Imported" / the admin's name
  verifiedLabel?: string; // undefined = not applicable (system-generated dues)
  canVerify?:    boolean; // whether the current viewer may verify this row
  canEdit?:      boolean; // whether the current viewer may edit this row (invoices only, creator-only)
  rawAmountExpected?: number;             // signed — negative means a credit
  rawKitty?:          "CP_KITTY" | "WELFARE";
  rawNotes?:          string;
  account:       "CP Kitty" | "Welfare";
  debit:         number;
  credit:        number;
};

type RowWithSort = StatementRow & { sortKey: string };

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
  if (type === "MANUAL_CP_KITTY") return "Manual CP Kitty Entry";
  if (type === "MANUAL_WELFARE")  return "Manual Welfare Entry";
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

export type StatementFinancialAccount = {
  id:             string;
  type:           string;
  yearOrMonth:    string;
  amountExpected: unknown;
  notes:          string | null;
  createdById:    string | null;
  createdBy:      { name: string } | null;
  verified:       boolean;
  verifiedBy:     { name: string } | null;
};

export type StatementPayment = {
  id:          string;
  mpesaCode:   string;
  datePaid:    Date | string;
  amount:      unknown;
  account:     { code: string };
  createdById: string | null;
  createdBy:   { name: string } | null;
  verified:    boolean;
  verifiedBy:  { name: string } | null;
};

/**
 * viewerId + canVerifyPermission together decide `canVerify`: the viewer must have
 * permission AND must not be the person who created the entry (self-verification is
 * not allowed). canEdit is the opposite pairing: only the original creator — and only
 * while unverified — may edit; canEditPermission is their current Membership-edit right.
 */
export function buildInvoiceRow(
  acc: StatementFinancialAccount, viewerId: string | null, canVerifyPermission: boolean, canEditPermission: boolean
): RowWithSort {
  const expected = toNum(acc.amountExpected);
  const isManual = acc.type === "MANUAL_CP_KITTY" || acc.type === "MANUAL_WELFARE";
  const isOwn    = !!acc.createdById && acc.createdById === viewerId;
  return {
    key:         `inv-${acc.id}`,
    rowType:     "invoice",
    rawId:       acc.id,
    sortKey:     invoiceSortDate(acc.type, acc.yearOrMonth),
    dateLabel:   invoiceDateLabel(acc.type, acc.yearOrMonth),
    description: acc.notes?.trim() || invoiceDescription(acc.type, acc.yearOrMonth),
    source:      isManual ? (acc.createdBy?.name ?? "Admin") : "System",
    verifiedLabel: isManual
      ? (acc.verified ? `Verified by ${acc.verifiedBy?.name ?? "Admin"}` : "Pending verification")
      : undefined,
    canVerify:   isManual && !acc.verified && canVerifyPermission && !isOwn,
    canEdit:     isManual && !acc.verified && isOwn && canEditPermission,
    rawAmountExpected: expected,
    rawKitty:    acc.type === "MANUAL_CP_KITTY" ? "CP_KITTY" : acc.type === "MANUAL_WELFARE" ? "WELFARE" : undefined,
    rawNotes:    acc.notes ?? "",
    account:     CP_KITTY_TYPES.includes(acc.type) ? "CP Kitty" : "Welfare",
    // A negative amountExpected is a manual credit (e.g. an overpayment/opening
    // balance) — it belongs in the Paid column, not a negative Invoiced amount.
    debit:       Math.max(expected, 0),
    credit:      Math.max(-expected, 0),
  };
}

export function buildPaymentRow(
  pay: StatementPayment, viewerId: string | null, canVerifyPermission: boolean
): RowWithSort {
  const isOwn = !!pay.createdById && pay.createdById === viewerId;
  return {
    key:         `pay-${pay.id}`,
    rowType:     "payment",
    rawId:       pay.id,
    sortKey:     new Date(pay.datePaid).toISOString(),
    dateLabel:   new Date(pay.datePaid).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
    description: `M-PESA Payment (${pay.mpesaCode})`,
    source:      pay.createdById === null ? "Imported" : (pay.createdBy?.name ?? "Admin"),
    verifiedLabel: pay.verified ? `Verified by ${pay.verifiedBy?.name ?? "Admin"}` : "Pending verification",
    canVerify:   !pay.verified && canVerifyPermission && !isOwn,
    account:     pay.account.code === "CP-WELFARE" ? "Welfare" : "CP Kitty",
    debit:       0,
    credit:      toNum(pay.amount),
  };
}

export function sortStatementRows(rows: RowWithSort[]): StatementRow[] {
  return rows
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .map(({ sortKey: _sk, ...row }) => row);
}
