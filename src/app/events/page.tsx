import Image from "next/image";
import Link from "next/link";
import { UPCOMING_EVENTS, PAST_EVENTS } from "@/lib/events-data";
import type { UpcomingEvent, PastEvent } from "@/lib/events-data";

function EventCard({
  event,
  isPast,
}: {
  event: UpcomingEvent | PastEvent;
  isPast: boolean;
}) {
  const description = "description" in event ? event.description : null;
  const summary = "summary" in event ? event.summary : null;
  const venue = "venue" in event ? event.venue : null;
  const theme = "theme" in event ? event.theme : null;
  const workgroup = "workgroup" in event ? event.workgroup : null;
  const body = description ?? summary;

  return (
    <Link href={`/events/${event.id}`}>
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:shadow-lg md:flex">
        <div className="relative h-48 w-full shrink-0 bg-slate-200 md:h-auto md:min-h-[200px] md:w-72">
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 288px"
          />
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-6">
          <time className="text-sm font-medium text-slate-500">{event.date}</time>
          <h2 className="mt-1 text-xl font-bold text-primary sm:text-2xl">{event.title}</h2>
          {theme && <p className="mt-1 text-sm text-slate-600">Theme: {theme}</p>}
          {workgroup && <p className="mt-0.5 text-sm text-slate-600">Workgroup: {workgroup}</p>}
          {venue && <p className="mt-1 text-sm text-slate-600">Venue: {venue}</p>}
          {body && (
            <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base line-clamp-2">
              {body}
            </p>
          )}
          <span className="mt-3 text-sm font-semibold text-primary">View details →</span>
        </div>
      </article>
    </Link>
  );
}

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link
            href="/"
            className="text-primary hover:text-primary-dark font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg px-2 py-1"
          >
            ← Back to home
          </Link>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Events</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-bold text-primary sm:text-3xl">
            Upcoming events
          </h2>
          {UPCOMING_EVENTS.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              No upcoming events at the moment.
            </p>
          ) : (
            <ul className="space-y-6">
              {UPCOMING_EVENTS.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} isPast={false} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-primary sm:text-3xl">
            Past events
          </h2>
          {PAST_EVENTS.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              No past events to show yet.
            </p>
          ) : (
            <ul className="space-y-6">
              {PAST_EVENTS.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} isPast />
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
