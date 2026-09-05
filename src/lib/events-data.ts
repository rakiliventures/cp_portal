/**
 * Public-facing event data (landing carousels, public /events page) — sourced
 * live from the database. Only events an admin has marked "Featured on landing
 * page" (Event.featuredOnLanding) are shown here; everything else stays internal.
 */
import { prisma } from "@/lib/prisma";

export type PublicEvent = {
  id:          string;
  title:       string;
  imageUrl:    string | null;
  date:        string; // display string, e.g. "18 July 2026"
  eventDate:   string; // ISO yyyy-mm-dd, used for sort/upcoming-vs-past
  description?: string | null;
  venue?:      string | null;
  theme?:      string | null;
  workgroup?:  string | null;
  startTime?:  string | null;
};

export type PublicEventDetail = PublicEvent & { isPast: boolean };

const SELECT = {
  id:               true,
  title:            true,
  imageBannerUrl:   true,
  date:             true,
  descriptionAgenda: true,
  venue:            true,
  theme:            true,
  startTime:        true,
  workgroupAssigned: { select: { name: true } },
} as const;

type Row = {
  id: string;
  title: string;
  imageBannerUrl: string | null;
  date: Date;
  descriptionAgenda: string | null;
  venue: string | null;
  theme: string | null;
  startTime: string | null;
  workgroupAssigned: { name: string } | null;
};

function eventDateIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toPublicEvent(e: Row): PublicEvent {
  return {
    id:          e.id,
    title:       e.title,
    imageUrl:    e.imageBannerUrl,
    date:        e.date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    eventDate:   eventDateIso(e.date),
    description: e.descriptionAgenda,
    venue:       e.venue,
    theme:       e.theme,
    workgroup:   e.workgroupAssigned?.name ?? null,
    startTime:   e.startTime,
  };
}

/** All featured events, split into upcoming (soonest first) and past (most recent first). */
export async function getFeaturedEvents(): Promise<{ upcoming: PublicEvent[]; past: PublicEvent[] }> {
  const rows = await prisma.event.findMany({
    where:  { featuredOnLanding: true },
    select: SELECT,
    orderBy: { date: "asc" },
  });
  const today  = todayIso();
  const mapped = rows.map(toPublicEvent);
  return {
    upcoming: mapped.filter((e) => e.eventDate >= today),
    past:     mapped.filter((e) => e.eventDate < today).sort((a, b) => b.eventDate.localeCompare(a.eventDate)),
  };
}

/** A single featured event by id — non-featured events are not publicly reachable. */
export async function getEventById(id: string): Promise<PublicEventDetail | null> {
  const row = await prisma.event.findFirst({
    where:  { id, featuredOnLanding: true },
    select: SELECT,
  });
  if (!row) return null;
  const event = toPublicEvent(row);
  return { ...event, isPast: event.eventDate < todayIso() };
}
