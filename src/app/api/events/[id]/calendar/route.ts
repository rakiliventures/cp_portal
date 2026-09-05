export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildEventIcs } from "@/lib/ics";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where:  { id },
    select: { id: true, title: true, date: true, startTime: true, venue: true, descriptionAgenda: true, featuredOnLanding: true },
  });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  // Publicly-featured events are open to anyone; everything else requires a
  // logged-in member (matches the internal event detail page's own access model,
  // which has no extra view-permission gate beyond being authenticated).
  if (!event.featuredOnLanding) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const ics = buildEventIcs({
    id:          event.id,
    title:       event.title,
    eventDate:   event.date.toISOString().slice(0, 10),
    startTime:   event.startTime,
    venue:       event.venue,
    description: event.descriptionAgenda,
  });

  const fileName = `${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
