import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventById } from "@/lib/events-data";

type PageProps = { params: Promise<{ id: string }> };

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const event = getEventById(id);
  if (!event) notFound();

  const description = "description" in event ? event.description : null;
  const summary = "summary" in event ? event.summary : null;
  const venue = "venue" in event ? event.venue : null;
  const theme = "theme" in event ? event.theme : null;
  const workgroup = "workgroup" in event ? event.workgroup : null;
  const body = description ?? summary;

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
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="relative aspect-[2/1] w-full bg-slate-200">
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                {event.isPast ? "Past event" : "Upcoming event"}
              </span>
              <time className="mt-2 block text-sm font-medium text-white/95">{event.date}</time>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{event.title}</h1>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {theme && (
              <p className="text-sm font-medium text-slate-500 sm:text-base">
                Theme: <span className="text-slate-700">{theme}</span>
              </p>
            )}
            {workgroup && (
              <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                Organizing Workgroup: <span className="text-slate-700">{workgroup}</span>
              </p>
            )}
            {venue && (
              <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                Venue: <span className="text-slate-700">{venue}</span>
              </p>
            )}
            {body && (
              <div className="mt-4 text-slate-700 sm:mt-5 sm:text-lg sm:leading-relaxed">
                {body}
              </div>
            )}
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
