/**
 * Shared event data for landing carousels and public /events page.
 * Replace with API/database later.
 */

export type UpcomingEvent = {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  description?: string;
  venue?: string;
};

export type PastEvent = {
  id: string;
  title: string;
  imageUrl: string;
  date: string;
  summary?: string;
  description?: string;
  theme?: string;
  workgroup?: string;
};

export const UPCOMING_EVENTS: UpcomingEvent[] = [
  {
    id: "1",
    title: "Lenten Recollection",
    imageUrl: "/images/events/recollection.jpeg",
    date: "14 March 2026",
    description: "Join us for a time of reflection and prayer during the Lenten season.",
    venue: "Komarock Shrine",
  },
];

export const PAST_EVENTS: PastEvent[] = [
  {
    id: "5",
    title: "Dinner 2024",
    imageUrl: "/images/events/dinner_2024.jpeg",
    date: "6 Dec 2024",
    theme: "Men-Black Tie, Ladies-Elegant Evening Gown",
  },
  {
    id: "2",
    title: "Dinner 2025",
    imageUrl: "/images/events/dinner_2025.jpeg",
    date: "5 Dec 2025",
    theme: "Pre-Colonial Africa",
    workgroup: "Team Building",
  },
  {
    id: "3",
    title: "Retreat 2025",
    imageUrl: "/images/events/retreat_2025.jpeg",
    date: "4th September 2025",
  },
  {
    id: "4",
    title: "Medical Camp 2025",
    imageUrl: "/images/events/medical_camp_2025.jpeg",
    date: "13th September 2025",
  },
];

export type EventItem = (UpcomingEvent | PastEvent) & { isPast: boolean };

/** Find an event by id in either upcoming or past list. */
export function getEventById(id: string): EventItem | null {
  const upcoming = UPCOMING_EVENTS.find((e) => e.id === id);
  if (upcoming) return { ...upcoming, isPast: false };
  const past = PAST_EVENTS.find((e) => e.id === id);
  if (past) return { ...past, isPast: true };
  return null;
}
