import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/events-data";

type PageProps = { params: Promise<{ id: string }> };

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="rounded-lg px-2 py-1 font-medium text-primary hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            ← Back to home
          </Link>
          <Link
            href="/events"
            className="rounded-lg px-2 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            All events
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            {/* Small poster card, uncropped and with no text overlaid on it — every
                detail on the poster needs to stay legible. */}
            <div className="mx-auto w-full max-w-[220px] shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-slate-100 sm:mx-0">
              {event.imageUrl && (
                <img src={event.imageUrl} alt={event.title} className="block w-full h-auto" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                {event.isPast ? "Past event" : "Upcoming event"}
              </span>
              <time className="mt-2 block text-sm font-medium text-slate-500">
                {event.date}{event.startTime && <> · {event.startTime}</>}
              </time>
              <h1 className="mt-1 text-2xl font-bold text-primary sm:text-3xl">{event.title}</h1>

              {event.theme && (
                <p className="mt-3 text-sm font-medium text-slate-500 sm:text-base">
                  Theme: <span className="text-slate-700">{event.theme}</span>
                </p>
              )}
              {event.workgroup && (
                <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                  Organizing Workgroup: <span className="text-slate-700">{event.workgroup}</span>
                </p>
              )}
              {event.venue && (
                <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                  Venue: <span className="text-slate-700">{event.venue}</span>
                </p>
              )}
              {event.description && (
                <div className="mt-4 text-slate-700 sm:mt-5 sm:text-lg sm:leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </div>
              )}

              {!event.isPast && (
                <a
                  href={`/api/events/${event.id}/calendar`}
                  className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5M12 12v4.5M9.75 14.25h4.5" />
                  </svg>
                  Add to Calendar
                </a>
              )}
            </div>
          </div>
        </article>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/events"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            View all events
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
