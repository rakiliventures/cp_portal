import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; attendanceId: string }> }
) {
  const { id: eventId, attendanceId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attendance = await prisma.eventAttendance.findUnique({ where: { id: attendanceId } });
  if (!attendance || attendance.eventId !== eventId) {
    return NextResponse.json({ error: "Attendance record not found." }, { status: 404 });
  }

  await prisma.eventAttendance.delete({ where: { id: attendanceId } });
  return NextResponse.json({ ok: true });
}
