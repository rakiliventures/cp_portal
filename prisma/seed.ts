import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const MODULES = [
  { code: "PersonalDashboard", name: "Personal Dashboard", description: "My dashboard" },
  { code: "Membership", name: "Membership", description: "Add member, view list, transfer workgroup, assign mentor" },
  { code: "Finance", name: "Finance", description: "Expenses, budget, payments" },
  { code: "Events", name: "Events", description: "Events summary, past/upcoming" },
  { code: "GroupWideReports", name: "Group Wide Reports", description: "Group dashboard and reports" },
  { code: "PastEvents", name: "Past Events", description: "Past events listing" },
  { code: "Calendar", name: "Calendar", description: "Upcoming events" },
  { code: "Attendance", name: "Attendance", description: "Event attendance" },
  { code: "Downloads", name: "Downloads", description: "Document downloads" },
  { code: "RemindersConfiguration", name: "Notifications Settings", description: "Monthly reminder config" },
  { code: "InquiriesManagement", name: "Inquiries Management", description: "Guest inquiries" },
  { code: "UserManagement", name: "User Management", description: "Assign modules and permissions" },
];

async function main() {
  for (const m of MODULES) {
    await prisma.module.upsert({
      where: { code: m.code },
      create: m,
      update: { name: m.name, description: m.description ?? undefined },
    });
  }

  // Seed workgroups (abbreviation unique, status active)
  const workgroupsData = [
    { name: "Community Outreach", abbreviation: "COR", status: "active", description: "Community Outreach workgroup" },
    { name: "Spiritual Development", abbreviation: "SPIRI", status: "active", description: "Spiritual Development workgroup" },
    { name: "Team Building", abbreviation: "TB", status: "active", description: "Team Building workgroup" },
  ];
  for (const wg of workgroupsData) {
    await prisma.workgroup.upsert({
      where: { abbreviation: wg.abbreviation },
      create: wg,
      update: { name: wg.name, status: wg.status, description: wg.description ?? undefined },
    });
  }
  const communityOutreach = await prisma.workgroup.findUnique({ where: { abbreviation: "COR" } });
  const spiritualDev = await prisma.workgroup.findUnique({ where: { abbreviation: "SPIRI" } });
  const teamBuilding = await prisma.workgroup.findUnique({ where: { abbreviation: "TB" } });

  // Create super-admin (also a member: has workgroup, mentor, mentees)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cp.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  let admin = await prisma.user.findUnique({ where: { email: adminEmail }, include: { memberProfile: true } });
  if (!admin) {
    const passwordHash = await hash(adminPassword, 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "CP Admin",
        phone: "+254700000001",
        isSuperAdmin: true,
      },
    });
    console.log("Created super-admin:", admin.email);
  }

  const personalDashboard = await prisma.module.findUnique({ where: { code: "PersonalDashboard" } });
  const groupReports = await prisma.module.findUnique({ where: { code: "GroupWideReports" } });
  const pastEvents = await prisma.module.findUnique({ where: { code: "PastEvents" } });
  const calendar = await prisma.module.findUnique({ where: { code: "Calendar" } });
  const downloads = await prisma.module.findUnique({ where: { code: "Downloads" } });

  if (personalDashboard && groupReports && pastEvents && calendar && downloads) {
    const defaultMemberEmail = process.env.SEED_MEMBER_EMAIL ?? "member@cp.local";
    let memberUser = await prisma.user.findUnique({ where: { email: defaultMemberEmail } });
    if (!memberUser) {
      const memberPassword = await hash(process.env.SEED_MEMBER_PASSWORD ?? "Member123!", 10);
      memberUser = await prisma.user.create({
        data: {
          email: defaultMemberEmail,
          passwordHash: memberPassword,
          name: "Demo Member",
        },
      });
      const defaultWorkgroup = communityOutreach ?? (await prisma.workgroup.findFirst());
      if (defaultWorkgroup) {
        await prisma.memberProfile.create({
          data: {
            userId: memberUser.id,
            workgroupId: defaultWorkgroup.id,
            joinDate: new Date(),
          },
        });
        for (const mod of [personalDashboard, groupReports, pastEvents, calendar, downloads]) {
          await prisma.userModuleAssignment.create({
            data: {
              userId: memberUser!.id,
              moduleId: mod.id,
              canView: true,
            },
          });
        }
        console.log("Created default member with view-only modules:", memberUser.email);
      }
    }
  }

  // Sample members: 9 members across 3 workgroups (3 per group)
  if (!communityOutreach || !teamBuilding || !spiritualDev) {
    console.log("Workgroups not found; skipping sample members.");
  } else {
    const defaultModules = await prisma.module.findMany({
      where: { code: { in: ["PersonalDashboard", "GroupWideReports", "PastEvents", "Calendar", "Downloads"] } },
    });
    const sampleMembers: Array<{ name: string; email: string; phone: string; workgroupId: string; joinDate: Date }> = [
      { name: "Jane Wanjiku", email: "jane.wanjiku@cp.local", phone: "+254700111001", workgroupId: communityOutreach.id, joinDate: new Date("2023-01-15") },
      { name: "Peter Kamau", email: "peter.kamau@cp.local", phone: "+254700111002", workgroupId: communityOutreach.id, joinDate: new Date("2023-03-20") },
      { name: "Mary Akinyi", email: "mary.akinyi@cp.local", phone: "+254700111003", workgroupId: communityOutreach.id, joinDate: new Date("2023-06-10") },
      { name: "James Ochieng", email: "james.ochieng@cp.local", phone: "+254700111004", workgroupId: teamBuilding.id, joinDate: new Date("2023-02-01") },
      { name: "Grace Muthoni", email: "grace.muthoni@cp.local", phone: "+254700111005", workgroupId: teamBuilding.id, joinDate: new Date("2023-05-12") },
      { name: "David Kipchoge", email: "david.kipchoge@cp.local", phone: "+254700111006", workgroupId: teamBuilding.id, joinDate: new Date("2023-08-22") },
      { name: "Lucy Njeri", email: "lucy.njeri@cp.local", phone: "+254700111007", workgroupId: spiritualDev.id, joinDate: new Date("2023-04-05") },
      { name: "Joseph Odhiambo", email: "joseph.odhiambo@cp.local", phone: "+254700111008", workgroupId: spiritualDev.id, joinDate: new Date("2023-07-18") },
      { name: "Anne Wambui", email: "anne.wambui@cp.local", phone: "+254700111009", workgroupId: spiritualDev.id, joinDate: new Date("2023-09-30") },
    ];
    const defaultPassword = await hash("Member123!", 10);
    for (const m of sampleMembers) {
      const existing = await prisma.user.findUnique({ where: { email: m.email } });
      if (existing) continue;
      const user = await prisma.user.create({
        data: {
          email: m.email,
          passwordHash: defaultPassword,
          name: m.name,
          phone: m.phone,
        },
      });
      await prisma.memberProfile.create({
        data: {
          userId: user.id,
          workgroupId: m.workgroupId,
          joinDate: m.joinDate,
        },
      });
      await prisma.memberWorkgroupHistory.create({
        data: {
          memberId: user.id,
          workgroupId: m.workgroupId,
          effectiveFrom: m.joinDate,
          effectiveTo: null,
        },
      });
      for (const mod of defaultModules) {
        await prisma.userModuleAssignment.create({
          data: {
            userId: user.id,
            moduleId: mod.id,
            canView: true,
          },
        });
      }
    }
    console.log("Created 9 sample members across Community Outreach, Team Building, Spiritual Development.");
  }

  // Admin as member: assign workgroup, mentor, and mentees
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { memberProfile: true },
  });
  const spiritualDevForAdmin = spiritualDev ?? await prisma.workgroup.findFirst({ where: { abbreviation: "SPIRI" } });

  if (adminUser && !adminUser.memberProfile && spiritualDevForAdmin) {
    const adminJoinDate = new Date("2022-06-01");
    await prisma.memberProfile.create({
      data: {
        userId: adminUser.id,
        workgroupId: spiritualDevForAdmin.id,
        joinDate: adminJoinDate,
      },
    });
    await prisma.memberWorkgroupHistory.create({
      data: {
        memberId: adminUser.id,
        workgroupId: spiritualDevForAdmin.id,
        effectiveFrom: adminJoinDate,
        effectiveTo: null,
      },
    });

    const lucy = await prisma.user.findFirst({ where: { email: "lucy.njeri@cp.local" } });
    if (lucy) {
      await prisma.memberProfile.update({
        where: { userId: adminUser.id },
        data: { mentorId: lucy.id },
      });
    }

    const jane = await prisma.user.findFirst({ where: { email: "jane.wanjiku@cp.local" } });
    const peter = await prisma.user.findFirst({ where: { email: "peter.kamau@cp.local" } });
    if (jane) {
      await prisma.memberProfile.update({
        where: { userId: jane.id },
        data: { mentorId: adminUser.id },
      });
    }
    if (peter) {
      await prisma.memberProfile.update({
        where: { userId: peter.id },
        data: { mentorId: adminUser.id },
      });
    }
    console.log("Admin assigned to Spiritual Development; mentor: Lucy Njeri; mentees: Jane Wanjiku, Peter Kamau.");
  }

  // Sample finance/payments and past-event attendance for admin
  const adminForSeed = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { memberProfile: true },
  });
  if (adminForSeed?.memberProfile) {
    const batchId = "seed-batch-1";

    const existingTxCount = await prisma.transaction.count({ where: { memberId: adminForSeed.id } });
    if (existingTxCount === 0) {
      const payments: Array<{ accountType: string; amount: number; date: Date }> = [
        { accountType: "CP-KITTY", amount: 300, date: new Date("2024-01-05") },
        { accountType: "CP-Welfare", amount: 300, date: new Date("2024-01-05") },
        { accountType: "CP-KITTY", amount: 300, date: new Date("2024-02-10") },
        { accountType: "CP-Welfare", amount: 300, date: new Date("2024-02-10") },
        { accountType: "CP-KITTY", amount: 300, date: new Date("2024-03-08") },
        { accountType: "CP-Welfare", amount: 300, date: new Date("2024-03-08") },
        { accountType: "CP-KITTY", amount: 3600, date: new Date("2024-04-01") },
        { accountType: "CP-Welfare", amount: 3600, date: new Date("2024-04-01") },
        { accountType: "CP-KITTY", amount: 300, date: new Date("2025-01-12") },
        { accountType: "CP-Welfare", amount: 300, date: new Date("2025-01-12") },
        { accountType: "CP-KITTY", amount: 300, date: new Date("2025-02-07") },
        { accountType: "CP-Welfare", amount: 300, date: new Date("2025-02-07") },
      ];
      for (const p of payments) {
        await prisma.transaction.create({
          data: {
            memberId: adminForSeed.id,
            accountType: p.accountType,
            amount: p.amount,
            transactionDate: p.date,
            importBatchId: batchId,
          },
        });
      }
      const fa2024 = await prisma.financialAccount.findFirst({
        where: { memberId: adminForSeed.id, type: "AnnualFee", yearOrMonth: "2024" },
      });
      if (!fa2024) {
        await prisma.financialAccount.create({
          data: {
            memberId: adminForSeed.id,
            type: "AnnualFee",
            yearOrMonth: "2024",
            amountExpected: 1000,
            amountPaid: 1000,
            dueDate: new Date("2024-01-31"),
          },
        });
      }
      const fa2025 = await prisma.financialAccount.findFirst({
        where: { memberId: adminForSeed.id, type: "AnnualFee", yearOrMonth: "2025" },
      });
      if (!fa2025) {
        await prisma.financialAccount.create({
          data: {
            memberId: adminForSeed.id,
            type: "AnnualFee",
            yearOrMonth: "2025",
            amountExpected: 1000,
            amountPaid: 1000,
            dueDate: new Date("2025-01-31"),
          },
        });
      }
      console.log("Created sample finance/payments data for admin.");
    }
  }

  const pastEventsData = [
    { title: "Dinner 2025", date: new Date("2025-12-05"), theme: "Pre-Colonial Africa" },
    { title: "Retreat 2025", date: new Date("2025-09-04") },
    { title: "Medical Camp 2025", date: new Date("2025-09-13") },
  ];
  const createdPastEvents: { id: string; title: string }[] = [];
  for (const ev of pastEventsData) {
    const existing = await prisma.event.findFirst({
      where: { title: ev.title, date: ev.date },
    });
    if (!existing) {
      const e = await prisma.event.create({
        data: {
          title: ev.title,
          theme: ev.theme ?? null,
          date: ev.date,
          createdById: admin?.id ?? null,
        },
      });
      createdPastEvents.push({ id: e.id, title: e.title });
    } else {
      createdPastEvents.push({ id: existing.id, title: existing.title });
    }
  }
  if (adminForSeed && createdPastEvents.length > 0) {
    for (const ev of createdPastEvents) {
      const already = await prisma.eventAttendance.findFirst({
        where: { eventId: ev.id, memberId: adminForSeed.id },
      });
      if (!already) {
        await prisma.eventAttendance.create({
          data: {
            eventId: ev.id,
            attendeeType: "Member",
            memberId: adminForSeed.id,
            recordedById: adminForSeed.id,
          },
        });
      }
    }
    console.log("Created past events and admin attendance for all past activities.");
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
