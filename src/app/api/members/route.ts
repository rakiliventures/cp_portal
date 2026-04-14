import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { hash } from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notifyMemberWelcome } from "@/lib/notify";
import { generateMemberInvoices } from "@/lib/invoicing";

/** Generates a random temporary password like CP@abc123 */
function generateTempPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `CP@${s}`;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const createdById = (session.user as { id?: string }).id ?? null;

  try {
    const body = await request.json();
    const name          = String(body.name ?? "").trim();
    const email         = String(body.email ?? "").trim().toLowerCase();
    const phone         = body.phone ? String(body.phone).trim() : null;
    const workgroupId   = String(body.workgroupId ?? "").trim();
    const mentorId      = body.mentorId ? String(body.mentorId).trim() : null;
    const joinDateStr   = body.joinDate ? String(body.joinDate).trim() : null;
    const preferredName = body.preferredName ? String(body.preferredName).trim() : null;

    if (!name)        return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!email)       return NextResponse.json({ error: "Email is required." }, { status: 400 });
    if (!workgroupId) return NextResponse.json({ error: "Workgroup is required." }, { status: 400 });

    const joinDate = joinDateStr ? new Date(joinDateStr) : new Date();
    if (isNaN(joinDate.getTime())) {
      return NextResponse.json({ error: "Invalid join date." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });

    const workgroup = await prisma.workgroup.findUnique({ where: { id: workgroupId } });
    if (!workgroup) return NextResponse.json({ error: "Workgroup not found." }, { status: 400 });

    if (mentorId) {
      const mentor = await prisma.user.findUnique({ where: { id: mentorId }, include: { memberProfile: true } });
      if (!mentor?.memberProfile) {
        return NextResponse.json({ error: "Mentor not found or is not a member." }, { status: 400 });
      }
    }

    // Fetch the PersonalDashboard module for default assignment
    const dashboardModule = await prisma.module.findUnique({ where: { code: "PersonalDashboard" } });

    const tempPassword = generateTempPassword();
    const passwordHash = await hash(tempPassword, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash,
          memberProfile: {
            create: {
              workgroupId,
              joinDate,
              mentorId: mentorId || null,
              preferredName: preferredName || null,
            },
          },
        },
      });

      // Workgroup history
      await tx.memberWorkgroupHistory.create({
        data: {
          memberId:      newUser.id,
          workgroupId,
          effectiveFrom: joinDate,
          recordedById:  createdById,
        },
      });

      // Assign PersonalDashboard module by default
      if (dashboardModule) {
        await tx.userModuleAssignment.create({
          data: {
            userId:      newUser.id,
            moduleId:    dashboardModule.id,
            canView:     true,
            canCreate:   false,
            canEdit:     false,
            canDelete:   false,
            assignedById: createdById,
          },
        });
      }

      return newUser;
    });

    // Generate invoices and fire welcome notifications — non-blocking
    generateMemberInvoices(user.id, joinDate).catch(console.error);
    notifyMemberWelcome(user.id, tempPassword).catch(console.error);

    return NextResponse.json({ ok: true, id: user.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
