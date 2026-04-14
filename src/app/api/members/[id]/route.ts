import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const name        = String(body.name ?? "").trim();
    const email       = String(body.email ?? "").trim().toLowerCase();
    const phone       = body.phone ? String(body.phone).trim() : null;
    const workgroupId = String(body.workgroupId ?? "").trim();
    const mentorId    = body.mentorId ? String(body.mentorId).trim() : null;

    if (!name)        return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!email)       return NextResponse.json({ error: "Email is required." }, { status: 400 });
    if (!workgroupId) return NextResponse.json({ error: "Workgroup is required." }, { status: 400 });

    // Ensure member exists
    const existing = await prisma.user.findUnique({
      where:   { id },
      include: { memberProfile: true },
    });
    if (!existing?.memberProfile) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    // Email uniqueness check (exclude self)
    const emailConflict = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (emailConflict) {
      return NextResponse.json({ error: "Another user already has this email." }, { status: 409 });
    }

    // Validate workgroup
    const workgroup = await prisma.workgroup.findUnique({ where: { id: workgroupId } });
    if (!workgroup) return NextResponse.json({ error: "Workgroup not found." }, { status: 400 });

    // Validate mentor
    if (mentorId) {
      if (mentorId === id) {
        return NextResponse.json({ error: "A member cannot be their own mentor." }, { status: 400 });
      }
      const mentor = await prisma.user.findUnique({
        where:   { id: mentorId },
        include: { memberProfile: true },
      });
      if (!mentor?.memberProfile) {
        return NextResponse.json({ error: "Mentor not found or is not a member." }, { status: 400 });
      }
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data:  { name, email, phone },
      }),
      prisma.memberProfile.update({
        where: { userId: id },
        data:  { workgroupId, mentorId: mentorId || null },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/members/[id]]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update member." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body   = await request.json();
    const action = String(body.action ?? "");

    if (action !== "deactivate" && action !== "reactivate") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({
      where:   { id },
      include: { memberProfile: true },
    });
    if (!existing?.memberProfile) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data:  {
        status:        action === "deactivate" ? "Paused" : "Active",
        deactivatedAt: action === "deactivate" ? new Date() : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[POST /api/members/[id]]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update member status." },
      { status: 500 },
    );
  }
}
