import Image from "next/image";
import Link from "next/link";
import { getFeaturedEvents } from "@/lib/events-data";
import type { PublicEvent } from "@/lib/events-data";

function AddToCalendarLink({ eventId, className }: { eventId: string; className: string }) {
  return (
    <a
      href={`/api/events/${eventId}/calendar`}
      title="Add to calendar"
      aria-label="Add to calendar"
      className={className}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M12 12v4.5M9.75 14.25h4.5" />
      </svg>
    </a>
  );
}

function EventCard({ event, isUpcoming }: { event: PublicEvent; isUpcoming: boolean }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:shadow-lg md:flex">
      {/* `contents` keeps this Link out of the layout flow while making the whole
          card navigable; the calendar button below is a sibling, not nested inside
          it, so both stay independently clickable. */}
      <Link href={`/events/${event.id}`} className="contents">
        <div className="relative h-48 w-full shrink-0 bg-slate-200 md:h-auto md:min-h-[200px] md:w-72">
          {event.imageUrl && (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 288px"
              unoptimized={event.imageUrl.startsWith("http")}
            />
          )}
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-6">
          <time className="text-sm font-medium text-slate-500">{event.date}</time>
          <h2 className="mt-1 text-xl font-bold text-primary sm:text-2xl">{event.title}</h2>
          {event.theme && <p className="mt-1 text-sm text-slate-600">Theme: {event.theme}</p>}
          {event.workgroup && <p className="mt-0.5 text-sm text-slate-600">Workgroup: {event.workgroup}</p>}
          {event.venue && <p className="mt-1 text-sm text-slate-600">Venue: {event.venue}</p>}
          {event.description && (
            <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base line-clamp-2">
              {event.description}
            </p>
          )}
          <span className="mt-3 text-sm font-semibold text-primary">View details →</span>
        </div>
      </Link>
      {isUpcoming && (
        <AddToCalendarLink
          eventId={event.id}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-primary shadow ring-1 ring-slate-200/80 transition hover:bg-primary hover:text-white"
        />
      )}
    </article>
  );
}

export default async function EventsPage() {
  const { upcoming: upcomingEvents, past: pastEvents } = await getFeaturedEvents();

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
          {upcomingEvents.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              No upcoming events at the moment.
            </p>
          ) : (
            <ul className="space-y-6">
              {upcomingEvents.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} isUpcoming />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-primary sm:text-3xl">
            Past events
          </h2>
          {pastEvents.length === 0 ? (
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-600">
              No past events to show yet.
            </p>
          ) : (
            <ul className="space-y-6">
              {pastEvents.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} isUpcoming={false} />
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
