import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: { code: string; canCreate: boolean }[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const dateStr = body.date;
    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    const date = dateStr ? new Date(dateStr) : null;
    if (!date || isNaN(date.getTime())) {
      return NextResponse.json({ error: "Valid date is required." }, { status: 400 });
    }

    const category = ["CP_EVENT", "MGM", "KACHAI"].includes(body.category) ? String(body.category) : "CP_EVENT";
    const theme = body.theme ? String(body.theme).trim() || null : null;
    const descriptionAgenda = body.descriptionAgenda ? String(body.descriptionAgenda).trim() || null : null;
    const venue = body.venue ? String(body.venue).trim() || null : null;
    const startTime = body.startTime ? String(body.startTime).trim() || null : null;
    const imageBannerUrl = body.imageBannerUrl ? String(body.imageBannerUrl).trim() || null : null;
    const workgroupAssignedId = body.workgroupAssignedId ? String(body.workgroupAssignedId).trim() || null : null;
    const contactPersonId = body.contactPersonId ? String(body.contactPersonId).trim() || null : null;
    const featuredOnLanding  = !!body.featuredOnLanding;
    const postEventReportUrl = body.postEventReportUrl ? String(body.postEventReportUrl).trim() || null : null;
    const userId = (session.user as { id?: string }).id;
    if (!userId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    await prisma.event.create({
      data: {
        title,
        date,
        category,
        theme,
        descriptionAgenda,
        venue,
        startTime,
        imageBannerUrl,
        workgroupAssignedId:  workgroupAssignedId || undefined,
        contactPersonId:      contactPersonId || undefined,
        featuredOnLanding,
        postEventReportUrl,
        createdById: userId,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
