import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContactCard } from "./ContactCard";
import { AttendanceListModal } from "./AttendanceListModal";

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(Math.abs(amount));
}

function yearsInCP(joinDate: Date): number {
  return Math.max(0, new Date().getFullYear() - new Date(joinDate).getFullYear());
}

const CATEGORY_LABELS: Record<string, string> = {
  CP_EVENT: "CP Events",
  MGM:      "MGM Meetings",
  KACHAI:   "Kachai",
};

const CP_KITTY_TYPES  = ["CP_KITTY_ANNUAL", "CP_KITTY_MONTHLY", "MANUAL_CP_KITTY"];
const WELFARE_TYPES   = ["WELFARE_MONTHLY", "MANUAL_WELFARE"];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/dashboard");

  const userId = (session.user as { id?: string }).id;
  if (!userId) redirect("/login?callbackUrl=/app/dashboard");

  const now       = new Date();
  const currentYear = now.getFullYear();
  const yearStart = new Date(`${currentYear}-01-01`);

  // Batch 1: user identity + event data (4 queries)
  const [user, allPastEvents, allAttendedRaw, menteeProfiles] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberProfile: {
          include: {
            workgroup: true,
            mentor: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
    // Past events in the current year only
    prisma.event.findMany({
      where:  { date: { gte: yearStart, lt: now } },
      select: { category: true, date: true },
    }),
    // All attended events (all time) — this-year filter applied in JS
    prisma.eventAttendance.findMany({
      where:   { memberId: userId },
      include: { event: { select: { id: true, title: true, date: true, category: true, venue: true } } },
    }),
    prisma.memberProfile.findMany({
      where:   { mentorId: userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  if (!user) redirect("/login?callbackUrl=/app/dashboard");

  // Batch 2: financial data (3 queries) — run after user check
  const [financialAccounts, cpKittyPaidAgg, welfarePaidAgg] = await Promise.all([
    prisma.financialAccount.findMany({
      where:   { memberId: userId },
      orderBy: { yearOrMonth: "desc" },
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

  // allPastEvents is already scoped to the current year
  const pastEventsThisYear = allPastEvents;

  const profile = user.memberProfile;

  // ── Financial balances ──────────────────────────────────────────
  const cpKittyInvoiced  = financialAccounts
    .filter((a) => CP_KITTY_TYPES.includes(a.type))
    .reduce((s, a) => s + toNum(a.amountExpected), 0);
  const welfareInvoiced  = financialAccounts
    .filter((a) => WELFARE_TYPES.includes(a.type))
    .reduce((s, a) => s + toNum(a.amountExpected), 0);
  const cpKittyPaidTotal  = toNum(cpKittyPaidAgg._sum?.amount);
  const welfarePaidTotal  = toNum(welfarePaidAgg._sum?.amount);
  const cpKittyBalance    = cpKittyPaidTotal  - cpKittyInvoiced;
  const welfareBalance    = welfarePaidTotal  - welfareInvoiced;
  const cpKittyCompliant  = cpKittyBalance >= 0;
  const welfareCompliant  = welfareBalance >= 0;

  // ── Attendance by category ──────────────────────────────────────
  // Count total past events this year per category from the flat list
  const totalByCategory: Record<string, number> = {};
  for (const ev of pastEventsThisYear) {
    totalByCategory[ev.category] = (totalByCategory[ev.category] ?? 0) + 1;
  }
  // Count member's attended events this year (filter all-time list)
  const attendedByCategory: Record<string, number> = {};
  for (const a of allAttendedRaw) {
    if (!a.event) continue;
    const evDate = new Date(a.event.date);
    if (evDate >= yearStart && evDate < now) {
      const cat = a.event.category;
      attendedByCategory[cat] = (attendedByCategory[cat] ?? 0) + 1;
    }
  }
  const categories = ["CP_EVENT", "MGM", "KACHAI"];
  const attendanceRows = categories.map((cat) => ({
    category:  cat,
    label:     CATEGORY_LABELS[cat],
    attended:  attendedByCategory[cat] ?? 0,
    total:     totalByCategory[cat]    ?? 0,
  }));

  // ── CP Score ────────────────────────────────────────────────────
  const totalAttendedAllCats = Object.values(attendedByCategory).reduce((s, n) => s + n, 0);
  const totalEventsAllCats   = Object.values(totalByCategory).reduce((s, n) => s + n, 0);
  const attendanceIndex = totalEventsAllCats > 0
    ? Math.round((totalAttendedAllCats / totalEventsAllCats) * 100)
    : 0;
  const kittyCompliance   = cpKittyInvoiced > 0
    ? Math.min(100, Math.round((cpKittyPaidTotal / cpKittyInvoiced) * 100))
    : 100;
  const welfareCompliance = welfareInvoiced > 0
    ? Math.min(100, Math.round((welfarePaidTotal / welfareInvoiced) * 100))
    : 100;
  const mentorshipScore = (profile?.mentorId ? 5 : 0) + (menteeProfiles.length > 0 ? 5 : 0);
  const cpScore = Math.min(
    100,
    Math.round(
      attendanceIndex * 0.5 +
      ((kittyCompliance + welfareCompliance) / 2) * 0.4 +
      mentorshipScore
    )
  );

  // ── Profile display ─────────────────────────────────────────────
  const displayName = profile?.preferredName ?? user.name;
  const joinDate    = profile?.joinDate ? new Date(profile.joinDate) : null;
  const years       = joinDate ? yearsInCP(joinDate) : 0;

  // ── Donut chart (CP Score) ──────────────────────────────────────
  const dR = 50, dCx = 70, dCy = 70;
  const dCirc = 2 * Math.PI * dR;
  const attendContrib  = Math.min(attendanceIndex * 0.5, 50);
  const financeContrib = Math.min(((kittyCompliance + welfareCompliance) / 2) * 0.4, 40);
  const mentorContrib  = Math.min(mentorshipScore, 10);
  const emptyContrib   = Math.max(0, 100 - attendContrib - financeContrib - mentorContrib);
  const dLen = (v: number) => (v / 100) * dCirc;
  const dRot = (v: number) => (v / 100) * 360;
  const d1Len = dLen(attendContrib);
  const d2Len = dLen(financeContrib);
  const d3Len = dLen(mentorContrib);
  const r1 = -90;
  const r2 = r1 + dRot(attendContrib);
  const r3 = r2 + dRot(financeContrib);

  // Serialize attended events for the modal (all-time, sorted newest first)
  const attendedEvents = allAttendedRaw
    .filter((a) => a.event)
    .sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime())
    .map((a) => ({
      id:            a.event.id,
      title:         a.event.title,
      date:          new Date(a.event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
      categoryLabel: CATEGORY_LABELS[a.event.category] ?? a.event.category,
      venue:         a.event.venue ?? null,
    }));

  // Initials for avatar
  const initials = (displayName ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const cpScoreLabel =
    cpScore >= 80 ? "Excellent" :
    cpScore >= 60 ? "Good" :
    cpScore >= 40 ? "Fair" : "Needs work";

  const cpScoreColor =
    cpScore >= 80 ? "text-green-600" :
    cpScore >= 60 ? "text-primary" :
    cpScore >= 40 ? "text-amber-600" : "text-red-600";

  return (
    <div className="min-w-0">

      {/* ── Hero header ──────────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl border border-slate-100 bg-gradient-to-br from-primary/5 via-white to-slate-50 px-5 py-5">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-sm">
            {initials}
          </div>
          {/* Identity */}
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">My Dashboard</p>
            <h1 className="mt-0.5 text-xl font-bold leading-tight text-slate-800">{displayName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {profile && (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {profile.workgroup.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {!profile && (
        <div className="card border-amber-200 bg-amber-50">
          <p className="text-sm text-amber-800">
            You don&apos;t have a member profile yet. Contact an administrator to be added as a
            member and see your dashboard details.
          </p>
        </div>
      )}

      {profile && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* ── 1: Contribution Compliance ─────────────────────── */}
          <div className="card flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Contribution Compliance</p>

            {(
              [
                { label: "CP Kitty",     compliant: cpKittyCompliant,  balance: cpKittyBalance  },
                { label: "Welfare Kitty", compliant: welfareCompliant, balance: welfareBalance   },
              ] as const
            ).map(({ label, compliant, balance }) => (
              <div
                key={label}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${
                  compliant ? "bg-green-50 border border-green-100" : "bg-red-50 border border-red-100"
                }`}
              >
                <div className="min-w-0">
                  <p className={`text-[10px] font-semibold uppercase tracking-wider ${compliant ? "text-green-600" : "text-red-500"}`}>
                    {label}
                  </p>
                  <p className={`mt-0.5 text-xl font-bold tabular-nums leading-none ${compliant ? "text-green-700" : "text-red-600"}`}>
                    {compliant ? "+" : "−"}{formatCurrency(Math.abs(balance))}
                  </p>
                  <p className={`mt-1 text-[11px] font-medium ${compliant ? "text-green-600" : "text-red-500"}`}>
                    {compliant ? "Compliant" : "In arrears"}
                  </p>
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${compliant ? "bg-green-100" : "bg-red-100"}`}>
                  {compliant ? (
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── 2: Activity Attendance ─────────────────────────── */}
          <div className="card flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Activity Attendance</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{currentYear}</span>
            </div>
            {pastEventsThisYear.length === 0 ? (
              <p className="flex flex-1 items-center justify-center text-sm text-slate-400">No past events this year.</p>
            ) : (
              <div className="flex flex-1 flex-col justify-center gap-4">
                {attendanceRows.map((row) => {
                  const isLow    = row.total > 0 && row.attended / row.total < 0.5;
                  const pct      = row.total > 0 ? Math.round((row.attended / row.total) * 100) : 0;
                  const barColor = isLow ? "#dc2626" : "#367C00";
                  return (
                    <div key={row.category}>
                      <div className="flex items-baseline justify-between gap-2 mb-1.5">
                        <span className="text-sm font-medium text-slate-700">{row.label}</span>
                        <span className={`shrink-0 text-xs font-bold tabular-nums ${isLow ? "text-red-600" : "text-green-700"}`}>
                          {row.attended}/{row.total} <span className="font-normal text-slate-400">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <AttendanceListModal events={attendedEvents} />
            </div>
          </div>

          {/* ── 3: CP Score ────────────────────────────────────── */}
          <div className="card flex flex-col">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">CP Score</p>
            <div className="flex flex-1 items-center gap-5">
              {/* Donut */}
              <div className="relative shrink-0">
                <svg viewBox="0 0 140 140" className="w-28">
                  <circle cx={dCx} cy={dCy} r={dR} fill="none" stroke="#e2e8f0" strokeWidth="16" />
                  {emptyContrib > 0 && (
                    <circle cx={dCx} cy={dCy} r={dR} fill="none" stroke="#f1f5f9" strokeWidth="16"
                      strokeDasharray={`${dLen(emptyContrib)} ${dCirc - dLen(emptyContrib)}`}
                      transform={`rotate(${r3 + dRot(mentorContrib)},${dCx},${dCy})`} />
                  )}
                  {d3Len > 0 && (
                    <circle cx={dCx} cy={dCy} r={dR} fill="none" stroke="#0369a1" strokeWidth="16"
                      strokeDasharray={`${d3Len} ${dCirc - d3Len}`}
                      transform={`rotate(${r3},${dCx},${dCy})`} />
                  )}
                  {d2Len > 0 && (
                    <circle cx={dCx} cy={dCy} r={dR} fill="none" stroke="#C4A634" strokeWidth="16"
                      strokeDasharray={`${d2Len} ${dCirc - d2Len}`}
                      transform={`rotate(${r2},${dCx},${dCy})`} />
                  )}
                  {d1Len > 0 && (
                    <circle cx={dCx} cy={dCy} r={dR} fill="none" stroke="#367C00" strokeWidth="16"
                      strokeDasharray={`${d1Len} ${dCirc - d1Len}`}
                      transform={`rotate(${r1},${dCx},${dCy})`} />
                  )}
                  <text x={dCx} y={dCy - 4} textAnchor="middle" fill="#1e293b" fontSize="24" fontWeight="bold">{cpScore}</text>
                  <text x={dCx} y={dCy + 13} textAnchor="middle" fill="#94a3b8" fontSize="10">/ 100</text>
                </svg>
              </div>
              {/* Legend + label */}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold ${cpScoreColor}`}>{cpScoreLabel}</p>
                <div className="mt-2.5 space-y-2">
                  {[
                    { color: "#367C00", label: "Attendance",   value: `${attendanceIndex}%` },
                    { color: "#C4A634", label: "Finance",      value: `${Math.round((kittyCompliance + welfareCompliance) / 2)}%` },
                    { color: "#0369a1", label: "Mentorship",   value: `${mentorshipScore}/10` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <span className="font-semibold text-slate-700 tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── 4: Years in CP ─────────────────────────────────── */}
          <div className="card flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-3xl font-bold leading-none text-slate-800 tabular-nums">{years}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {years === 1 ? "Year" : "Years"} in CP
              </p>
              {joinDate && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Since {joinDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              )}
            </div>
          </div>

          {/* ── 5: Mentorship ──────────────────────────────────── */}
          <div className="card flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mentorship</p>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-3xl font-bold leading-none text-slate-800 tabular-nums">{menteeProfiles.length}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {menteeProfiles.length === 1 ? "Member" : "Members"} Mentored
                </p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[11px] text-slate-400">
                My mentor:{" "}
                <span className={profile.mentor?.name ? "font-medium text-slate-600" : "text-slate-400"}>
                  {profile.mentor?.name ?? "Not assigned"}
                </span>
              </p>
            </div>
          </div>

          {/* ── 6: Contacts ────────────────────────────────────── */}
          <ContactCard email={user.email} phone={user.phone ?? null} />

        </div>
      )}
    </div>
  );
}

