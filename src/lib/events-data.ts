/**
 * Shared event data for landing carousels and public /events page.
 * Replace with API/database later.
 *
 * Upcoming vs. past is derived from `eventDate` (ISO, ascending-sortable) at
 * render time, not by which array an event is manually placed in — that's what
 * let past events keep showing under "Upcoming" once their date passed.
 */

export type EventEntry = {
  id:          string;
  title:       string;
  imageUrl:    string;
  date:        string; // display string, e.g. "14 March 2026"
  eventDate:   string; // ISO yyyy-mm-dd, used for upcoming/past + sort order
  description?: string;
  summary?:    string;
  venue?:      string;
  theme?:      string;
  workgroup?:  string;
};

// Kept as aliases so existing imports (`UpcomingEvent`, `PastEvent`) keep working —
// both upcoming and past events share the same shape now.
export type UpcomingEvent = EventEntry;
export type PastEvent     = EventEntry;
export type EventItem     = EventEntry & { isPast: boolean };

const EVENTS: EventEntry[] = [
  {
    id: "1",
    title: "Lenten Recollection",
    imageUrl: "/images/events/recollection.jpeg",
    date: "14 March 2026",
    eventDate: "2026-03-14",
    description: "Join us for a time of reflection and prayer during the Lenten season.",
    venue: "Komarock Shrine",
  },
  {
    id: "5",
    title: "Dinner 2024",
    imageUrl: "/images/events/dinner_2024.jpeg",
    date: "6 Dec 2024",
    eventDate: "2024-12-06",
    theme: "Men-Black Tie, Ladies-Elegant Evening Gown",
  },
  {
    id: "2",
    title: "Dinner 2025",
    imageUrl: "/images/events/dinner_2025.jpeg",
    date: "5 Dec 2025",
    eventDate: "2025-12-05",
    theme: "Pre-Colonial Africa",
    workgroup: "Team Building",
  },
  {
    id: "3",
    title: "Retreat 2025",
    imageUrl: "/images/events/retreat_2025.jpeg",
    date: "4th September 2025",
    eventDate: "2025-09-04",
  },
  {
    id: "4",
    title: "Medical Camp 2025",
    imageUrl: "/images/events/medical_camp_2025.jpeg",
    date: "13th September 2025",
    eventDate: "2025-09-13",
  },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Upcoming events, soonest first. */
export function getUpcomingEvents(): EventEntry[] {
  const today = todayIso();
  return EVENTS
    .filter((e) => e.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
}

/** Past events, most recent first. */
export function getPastEvents(): EventEntry[] {
  const today = todayIso();
  return EVENTS
    .filter((e) => e.eventDate < today)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}

/** Find an event by id, with isPast derived from today's date. */
export function getEventById(id: string): EventItem | null {
  const event = EVENTS.find((e) => e.id === id);
  if (!event) return null;
  return { ...event, isPast: event.eventDate < todayIso() };
}
