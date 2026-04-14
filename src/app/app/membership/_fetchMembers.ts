import { prisma } from "@/lib/prisma";
import { generateAllInvoices, getMemberBalances } from "@/lib/invoicing";

export async function fetchMemberPageData(statusFilter: "Active" | "Paused") {
  if (statusFilter === "Active") {
    await generateAllInvoices();
  }

  const now       = new Date();
  const yearStart = new Date(`${now.getFullYear()}-01-01T00:00:00.000Z`);
  const yearEnd   = new Date(`${now.getFullYear() + 1}-01-01T00:00:00.000Z`);

  const [members, workgroups, yearEvents, yearAttendances] = await Promise.all([
    prisma.user.findMany({
      where:   { memberProfile: { isNot: null }, status: statusFilter },
      include: {
        memberProfile: {
          include: {
            workgroup: true,
            mentor: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: statusFilter === "Paused" ? { deactivatedAt: "desc" } : { name: "asc" },
    }),
    prisma.workgroup.findMany({
      where:   { status: "active" },
      orderBy: { abbreviation: "asc" },
      include: { _count: { select: { memberProfiles: true } } },
    }),
    prisma.event.findMany({
      where:  { date: { gte: yearStart, lt: yearEnd, lte: now } },
      select: { id: true, category: true, workgroupAssignedId: true },
    }),
    prisma.eventAttendance.findMany({
      where:  {
        attendeeType: "Member",
        event:        { date: { gte: yearStart, lt: yearEnd, lte: now } },
      },
      select: { memberId: true, event: { select: { category: true, workgroupAssignedId: true } } },
    }),
  ]);

  const totalByCategory = { CP_EVENT: 0, MGM: 0, KACHAI: 0 };
  // Kachai totals keyed by workgroupId (only Kachai events are workgroup-specific)
  const kachaiTotalByWorkgroup = new Map<string, number>();
  for (const ev of yearEvents) {
    const cat = ev.category as keyof typeof totalByCategory;
    if (cat in totalByCategory) totalByCategory[cat]++;
    if (ev.category === "KACHAI" && ev.workgroupAssignedId) {
      kachaiTotalByWorkgroup.set(
        ev.workgroupAssignedId,
        (kachaiTotalByWorkgroup.get(ev.workgroupAssignedId) ?? 0) + 1,
      );
    }
  }

  // Build a quick memberId → workgroupId lookup for Kachai filtering
  const memberWorkgroupMap = new Map<string, string>();
  for (const u of members) {
    if (u.memberProfile?.workgroupId) {
      memberWorkgroupMap.set(u.id, u.memberProfile.workgroupId);
    }
  }

  type AttendanceCount = { CP_EVENT: number; MGM: number; KACHAI: number };
  const attendanceMap = new Map<string, AttendanceCount>();
  for (const a of yearAttendances) {
    if (!a.memberId) continue;
    const cat = a.event.category as keyof AttendanceCount;
    if (!(cat in totalByCategory)) continue;
    // For Kachai, only count if the event belongs to the member's own workgroup
    if (cat === "KACHAI") {
      const memberWg = memberWorkgroupMap.get(a.memberId);
      if (!memberWg || memberWg !== a.event.workgroupAssignedId) continue;
    }
    if (!attendanceMap.has(a.memberId)) {
      attendanceMap.set(a.memberId, { CP_EVENT: 0, MGM: 0, KACHAI: 0 });
    }
    attendanceMap.get(a.memberId)![cat]++;
  }

  const memberIds = members.map((u) => u.id);
  const balances  = await getMemberBalances(memberIds);

  const serializedMembers = members.map((u) => {
    const bal = balances.get(u.id) ?? { cpKitty: 0, welfare: 0 };
    const att = attendanceMap.get(u.id) ?? { CP_EVENT: 0, MGM: 0, KACHAI: 0 };
    return {
      id:              u.id,
      name:            u.name,
      email:           u.email,
      phone:           u.phone ?? null,
      status:          u.status as string,
      workgroupId:     u.memberProfile?.workgroupId ?? null,
      workgroupAbbrev: u.memberProfile?.workgroup?.abbreviation ?? null,
      workgroupName:   u.memberProfile?.workgroup?.name ?? null,
      mentorId:        u.memberProfile?.mentorId ?? null,
      mentorName:      u.memberProfile?.mentor?.name ?? null,
      joinDate:        u.memberProfile?.joinDate
        ? new Date(u.memberProfile.joinDate).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          })
        : null,
      cpKittyBalance:  bal.cpKitty,
      welfareBalance:  bal.welfare,
      hasArrears:      bal.cpKitty < 0 || bal.welfare < 0,
      attendance:      {
        cpEvents:    att.CP_EVENT,
        mgm:         att.MGM,
        kachai:      att.KACHAI,
        kachaiTotal: kachaiTotalByWorkgroup.get(u.memberProfile?.workgroupId ?? "") ?? 0,
      },
      deactivatedAt:   u.deactivatedAt
        ? new Date(u.deactivatedAt).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          })
        : null,
    };
  });

  const workgroupCounts = workgroups.map((wg) => ({
    id:           wg.id,
    abbreviation: wg.abbreviation,
    name:         wg.name,
    count:        wg._count.memberProfiles,
  }));

  return {
    serializedMembers,
    workgroupCounts,
    attendanceYear:   now.getFullYear(),
    attendanceTotals: {
      cpEvents: totalByCategory.CP_EVENT,
      mgm:      totalByCategory.MGM,
      kachai:   totalByCategory.KACHAI,
    },
  };
}
