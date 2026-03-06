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

  // Seed sub-groups
  const subGroups = [
    { name: "Community Outreach", description: "Community Outreach workgroup" },
    { name: "Team Building", description: "Team Building workgroup" },
    { name: "Spiritual Development", description: "Spiritual Development workgroup" },
  ];
  for (const sg of subGroups) {
    const existing = await prisma.subGroup.findFirst({ where: { name: sg.name } });
    if (!existing) {
      await prisma.subGroup.create({ data: sg });
    }
  }

  // Create super-admin and default modules for demo (optional)
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@cp.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await hash(adminPassword, 10);
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: "CP Admin",
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
      const subGroup = await prisma.subGroup.findFirst();
      if (subGroup) {
        await prisma.memberProfile.create({
          data: {
            userId: memberUser.id,
            subGroupId: subGroup.id,
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

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
