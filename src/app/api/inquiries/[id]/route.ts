export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.INQUIRIES_MANAGEMENT, "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { status, notes } = body;

  const validStatuses = ["New", "Contacted", "Converted"];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const userId = (session.user as { id?: string }).id;

  const inquiry = await prisma.membershipInquiry.findUnique({ where: { id } });
  if (!inquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.membershipInquiry.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
      // Record who actioned and when (on first action or any update)
      actionedById: userId,
      actionedAt:   new Date(),
    },
    include: { actionedBy: { select: { name: true } } },
  });

  return NextResponse.json({ ok: true, inquiry: updated });
}
