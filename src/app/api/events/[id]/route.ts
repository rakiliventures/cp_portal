import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const dateStr = body.date ? String(body.date).trim() : null;

    if (!title)    return NextResponse.json({ error: "Title is required." }, { status: 400 });
    if (!dateStr)  return NextResponse.json({ error: "Date is required." }, { status: 400 });
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return NextResponse.json({ error: "Invalid date." }, { status: 400 });

    const category          = ["CP_EVENT", "MGM", "KACHAI"].includes(body.category) ? String(body.category) : event.category;
    const theme             = body.theme             != null ? String(body.theme).trim()             || null : event.theme;
    const descriptionAgenda = body.descriptionAgenda != null ? String(body.descriptionAgenda).trim() || null : event.descriptionAgenda;
    const venue             = body.venue             != null ? String(body.venue).trim()             || null : event.venue;
    const startTime         = body.startTime         != null ? String(body.startTime).trim()         || null : event.startTime;
    const imageBannerUrl    = body.imageBannerUrl    != null ? String(body.imageBannerUrl).trim()    || null : event.imageBannerUrl;
    const workgroupAssignedId = body.workgroupAssignedId != null
      ? String(body.workgroupAssignedId).trim() || null
      : event.workgroupAssignedId;
    const contactPersonId = body.contactPersonId != null
      ? String(body.contactPersonId).trim() || null
      : event.contactPersonId;
    const featuredOnLanding  = body.featuredOnLanding != null ? !!body.featuredOnLanding : event.featuredOnLanding;
    const postEventReportUrl = body.postEventReportUrl != null
      ? String(body.postEventReportUrl).trim() || null
      : event.postEventReportUrl;

    await prisma.event.update({
      where: { id },
      data: {
        title, date, category, theme, descriptionAgenda, venue,
        startTime, imageBannerUrl,
        workgroupAssignedId: workgroupAssignedId ?? undefined,
        contactPersonId:     contactPersonId     ?? undefined,
        featuredOnLanding,
        postEventReportUrl,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
