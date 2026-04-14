import { prisma } from "@/lib/prisma";
import { getMemberBalances } from "@/lib/invoicing";

function toNum(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value) || 0;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", minimumFractionDigits: 0 }).format(amount);
}

const WG_COLORS  = ["#367C00", "#C4A634", "#0f766e", "#0369a1", "#b45309", "#7c3aed"];
const PAID_COLOR = "#367C00";
const UNPD_COLOR = "#e2e8f0";

function buildDonut(slices: { value: number }[], colors: string[]): string {
  const total = slices.reduce((s, i) => s + i.value, 0);
  if (total === 0) return "conic-gradient(#e2e8f0 0deg 360deg)";
  let acc = 0;
  const parts = slices.map((s, i) => {
    const start = (acc / total) * 360;
    acc += s.value;
    const end = (acc / total) * 360;
    return `${colors[i % colors.length]} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
  });
  return `conic-gradient(${parts.join(", ")})`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ label, accent }: { label: string; accent?: string }) {
  return (
    <div className="mt-6 mb-3 flex items-center gap-3">
      {accent && <span className="h-4 w-1 rounded-full" style={{ backgroundColor: accent }} />}
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</h2>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  );
}

function DonutChart({ gradient, centerLabel, centerSub, size = 96 }: {
  gradient: string; centerLabel: string; centerSub?: string; size?: number;
}) {
  return (
    <div className="relative shrink-0 rounded-full" style={{ width: size, height: size, background: gradient }} aria-hidden>
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white flex flex-col items-center justify-center" style={{ width: "58%", height: "58%" }}>
        <span className="text-[13px] font-bold leading-none text-slate-800">{centerLabel}</span>
        {centerSub && <span className="mt-0.5 text-[9px] leading-none text-slate-400">{centerSub}</span>}
      </div>
    </div>
  );
}

function LegendItem({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          <span className="truncate text-slate-600">{label}</span>
        </span>
        <span className="shrink-0 font-semibold text-slate-800">{count} <span className="font-normal text-slate-400">({pct}%)</span></span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </li>
  );
}

function StatCard({
  label, value, sub, accent = "#64748b", highlight = false, warn = false,
}: {
  label: string; value: string; sub?: string; accent?: string; highlight?: boolean; warn?: boolean;
}) {
  return (
    <div className="card relative overflow-hidden py-4 px-4">
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ backgroundColor: accent }} />
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-bold leading-none ${warn ? "text-amber-600" : highlight ? "text-primary" : "text-slate-800"}`}>
        {value}
      </p>
      {sub && <p className="mt-1 text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  const currentYear = new Date().getFullYear();
  const prevYear    = currentYear - 1;
  const yearStart   = new Date(`${currentYear}-01-01`);
  const yearEnd     = new Date(`${currentYear + 1}-01-01`);
  const prevStart   = new Date(`${prevYear}-01-01`);
  const prevEnd     = new Date(`${currentYear}-01-01`);

  const [
    allMemberIds,
    membersByWorkgroup,
    totalKittyExpensesThisYear,
    totalWelfareExpensesThisYear,
    collectedThisYear,
    collectedPrevYear,
    collectedWelfareThisYear,
    collectedWelfarePrevYear,
    budgetThisYear,
    pendingVerificationCount,
  ] = await Promise.all([
    prisma.memberProfile.findMany({
      where:  { user: { status: "Active" } },
      select: { userId: true },
    }).then((rows) => rows.map((r) => r.userId)),

    prisma.memberProfile.groupBy({
      by:    ["workgroupId"],
      where: { user: { status: "Active" } },
      _count: { userId: true },
    }).then(async (groups) => {
      const wgs = await prisma.workgroup.findMany({
        where:   { id: { in: groups.map((g) => g.workgroupId) } },
        select:  { id: true, name: true, abbreviation: true },
        orderBy: { abbreviation: "asc" },
      });
      const byId = Object.fromEntries(wgs.map((w) => [w.id, w]));
      return groups
        .map((g) => ({
          abbreviation: byId[g.workgroupId]?.abbreviation ?? "?",
          name:         byId[g.workgroupId]?.name         ?? g.workgroupId,
          count:        g._count.userId,
        }))
        .sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
    }),

    prisma.expense.aggregate({
      where: { categoryOrAccount: "CP-KITTY",  expenseDate: { gte: yearStart, lt: yearEnd } },
      _sum:  { amount: true },
    }).then((r) => toNum(r._sum?.amount)),

    prisma.expense.aggregate({
      where: { categoryOrAccount: "CP-WELFARE", expenseDate: { gte: yearStart, lt: yearEnd } },
      _sum:  { amount: true },
    }).then((r) => toNum(r._sum?.amount)),

    prisma.payment.aggregate({
      where: { verified: true, account: { code: "CP-KITTY" },  datePaid: { gte: yearStart, lt: yearEnd } },
      _sum:  { amount: true },
    }).then((r) => toNum(r._sum?.amount)),

    prisma.payment.aggregate({
      where: { verified: true, account: { code: "CP-KITTY" },  datePaid: { gte: prevStart,  lt: prevEnd  } },
      _sum:  { amount: true },
    }).then((r) => toNum(r._sum?.amount)),

    prisma.payment.aggregate({
      where: { verified: true, account: { code: "CP-WELFARE" }, datePaid: { gte: yearStart, lt: yearEnd } },
      _sum:  { amount: true },
    }).then((r) => toNum(r._sum?.amount)),

    prisma.payment.aggregate({
      where: { verified: true, account: { code: "CP-WELFARE" }, datePaid: { gte: prevStart,  lt: prevEnd  } },
      _sum:  { amount: true },
    }).then((r) => toNum(r._sum?.amount)),

    prisma.budgetForecast
      .findMany({ where: { date: { gte: yearStart, lt: yearEnd } } })
      .then((rows) => rows.reduce((s, r) => s + toNum(r.forecastAmount), 0)),

    prisma.payment.count({ where: { verified: false } }),
  ]);

  const totalMembers  = allMemberIds.length;
  const balances      = await getMemberBalances(allMemberIds);

  let cpKittyPaid = 0;
  let welfarePaid = 0;
  for (const bal of balances.values()) {
    if (bal.cpKitty >= 0) cpKittyPaid++;
    if (bal.welfare >= 0) welfarePaid++;
  }
  const cpKittyUnpaid = Math.max(0, totalMembers - cpKittyPaid);
  const welfareUnpaid = Math.max(0, totalMembers - welfarePaid);
  const cpKittyPct    = totalMembers > 0 ? Math.round((cpKittyPaid  / totalMembers) * 100) : 0;
  const welfarePct    = totalMembers > 0 ? Math.round((welfarePaid  / totalMembers) * 100) : 0;

  const kittyAtHand   = collectedPrevYear   + collectedThisYear   - totalKittyExpensesThisYear;
  const welfareAtHand = collectedWelfarePrevYear + collectedWelfareThisYear - totalWelfareExpensesThisYear;

  return (
    <div className="min-w-0">

      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="page-heading mb-0">Group Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">Active members &amp; finance overview</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-500">
          {currentYear}
        </span>
      </div>

      {/* ── Membership ───────────────────────────────────────────────── */}
      <SectionHeading label="Membership" accent="#367C00" />

      <div className="grid gap-4 lg:grid-cols-3">

        {/* Total members + workgroup distribution */}
        <div className="card py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Members</p>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{totalMembers} active</span>
          </div>
          {totalMembers === 0 ? (
            <p className="text-sm text-slate-400">No active members.</p>
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart
                gradient={buildDonut(membersByWorkgroup.map((w) => ({ value: w.count })), WG_COLORS)}
                centerLabel={String(totalMembers)}
                centerSub="members"
                size={96}
              />
              <ul className="min-w-0 flex-1 space-y-2">
                {membersByWorkgroup.map((w, i) => (
                  <LegendItem key={w.abbreviation} color={WG_COLORS[i % WG_COLORS.length]}
                    label={`${w.abbreviation} – ${w.name}`} count={w.count} total={totalMembers} />
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* CP Kitty paid-up */}
        <div className="card py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CP Kitty</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">paid-up {currentYear}</span>
          </div>
          {totalMembers === 0 ? (
            <p className="text-sm text-slate-400">No active members.</p>
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart
                gradient={buildDonut([{ value: cpKittyPaid }, { value: cpKittyUnpaid }], [PAID_COLOR, UNPD_COLOR])}
                centerLabel={`${cpKittyPct}%`}
                centerSub="paid up"
                size={96}
              />
              <ul className="min-w-0 flex-1 space-y-2">
                <LegendItem color={PAID_COLOR}  label="Paid up"      count={cpKittyPaid}   total={totalMembers} />
                <LegendItem color="#94a3b8"      label="Not paid up"  count={cpKittyUnpaid} total={totalMembers} />
              </ul>
            </div>
          )}
        </div>

        {/* Welfare paid-up */}
        <div className="card py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">CP Welfare</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">paid-up {currentYear}</span>
          </div>
          {totalMembers === 0 ? (
            <p className="text-sm text-slate-400">No active members.</p>
          ) : (
            <div className="flex items-center gap-5">
              <DonutChart
                gradient={buildDonut([{ value: welfarePaid }, { value: welfareUnpaid }], [PAID_COLOR, UNPD_COLOR])}
                centerLabel={`${welfarePct}%`}
                centerSub="paid up"
                size={96}
              />
              <ul className="min-w-0 flex-1 space-y-2">
                <LegendItem color={PAID_COLOR}  label="Paid up"      count={welfarePaid}   total={totalMembers} />
                <LegendItem color="#94a3b8"      label="Not paid up"  count={welfareUnpaid} total={totalMembers} />
              </ul>
            </div>
          )}
        </div>

      </div>

      {/* ── CP Kitty Finance ─────────────────────────────────────────── */}
      <SectionHeading label="CP Kitty" accent="#367C00" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={`Balance · ${prevYear}`}
          value={formatCurrency(collectedPrevYear)}
          accent="#94a3b8"
        />
        <StatCard
          label={`Collections · ${currentYear}`}
          value={formatCurrency(collectedThisYear)}
          accent="#367C00" highlight
        />
        <StatCard
          label={`Expenses · ${currentYear}`}
          value={formatCurrency(totalKittyExpensesThisYear)}
          accent="#f97316"
        />
        <StatCard
          label="Cash at Hand"
          value={formatCurrency(kittyAtHand)}
          accent="#367C00" highlight
          sub="prev balance + collections − expenses"
        />
        <StatCard
          label={`Budget · ${currentYear}`}
          value={formatCurrency(budgetThisYear)}
          accent="#0369a1"
        />
      </div>

      {/* ── CP Welfare Finance ───────────────────────────────────────── */}
      <SectionHeading label="CP Welfare" accent="#0369a1" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label={`Balance · ${prevYear}`}
          value={formatCurrency(collectedWelfarePrevYear)}
          accent="#94a3b8"
        />
        <StatCard
          label={`Collections · ${currentYear}`}
          value={formatCurrency(collectedWelfareThisYear)}
          accent="#0369a1" highlight
        />
        <StatCard
          label={`Expenses · ${currentYear}`}
          value={formatCurrency(totalWelfareExpensesThisYear)}
          accent="#f97316"
        />
        <StatCard
          label="Cash at Hand"
          value={formatCurrency(welfareAtHand)}
          accent="#0369a1" highlight
          sub="prev balance + collections − expenses"
        />
        <StatCard
          label="Pending Verification"
          value={String(pendingVerificationCount)}
          sub="payments (Kitty & Welfare)"
          accent="#f59e0b" warn
        />
      </div>

    </div>
  );
}
