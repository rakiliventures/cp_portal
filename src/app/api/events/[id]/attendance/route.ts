import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const recordedById = (session.user as { id?: string }).id ?? null;

  try {
    const body = await request.json();
    const memberId = String(body.memberId ?? "").trim();
    if (!memberId) return NextResponse.json({ error: "memberId is required." }, { status: 400 });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: { memberProfile: true },
    });
    if (!member?.memberProfile) {
      return NextResponse.json({ error: "Member not found." }, { status: 400 });
    }

    // For Kachai events, member must belong to the assigned workgroup
    if (event.category === "KACHAI" && event.workgroupAssignedId) {
      if (member.memberProfile.workgroupId !== event.workgroupAssignedId) {
        return NextResponse.json(
          { error: "This Kachai event is restricted to members of the assigned workgroup." },
          { status: 403 },
        );
      }
    }

    // Prevent duplicates
    const existing = await prisma.eventAttendance.findFirst({
      where: { eventId, memberId, attendeeType: "Member" },
    });
    if (existing) {
      return NextResponse.json({ error: "Member is already recorded as attending." }, { status: 409 });
    }

    const attendance = await prisma.eventAttendance.create({
      data: {
        eventId,
        memberId,
        attendeeType: "Member",
        recordedById,
      },
      include: { member: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      ok: true,
      attendance: {
        id:          attendance.id,
        memberId:    attendance.memberId,
        memberName:  attendance.member?.name ?? null,
        recordedAt:  attendance.recordedAt.toISOString(),
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
