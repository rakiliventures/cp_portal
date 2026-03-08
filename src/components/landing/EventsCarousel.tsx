"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import type { UpcomingEvent } from "@/lib/events-data";
import { UPCOMING_EVENTS } from "@/lib/events-data";

const SWIPE_THRESHOLD = 50;

export function EventsCarousel() {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const events = UPCOMING_EVENTS;
  const count = events.length;

  const goTo = useCallback(
    (i: number) => {
      setIndex((prev) => {
        if (count <= 1) return 0;
        return ((prev + i) % count + count) % count;
      });
    },
    [count]
  );

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.targetTouches[0].clientX;
    touchEnd.current = null;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (count <= 1 || touchStart.current == null || touchEnd.current == null) return;
    const diff = touchStart.current - touchEnd.current;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      goTo(diff > 0 ? 1 : -1);
    }
    touchStart.current = null;
    touchEnd.current = null;
  }, [count, goTo]);

  // Auto-advance when more than one event
  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => goTo(1), 6000);
    return () => clearInterval(t);
  }, [count, goTo]);

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
        No upcoming events at the moment.
      </div>
    );
  }

  return (
    <div
      className="relative w-full overflow-hidden touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {events.map((event) => (
          <div
            key={event.id}
            className="min-w-full shrink-0 px-1 sm:px-2"
          >
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
              <div className="relative aspect-[16/10] w-full bg-slate-200 sm:aspect-[2/1]">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
                  priority={event.id === events[0].id}
                />
              </div>
              <div className="flex flex-col gap-3 p-4 sm:p-5">
                <div>
                  <time className="text-sm font-medium text-slate-500 sm:text-base">
                    {event.date}
                  </time>
                  <h4 className="mt-1 text-xl font-bold text-primary sm:text-2xl">
                    {event.title}
                  </h4>
                </div>
                <Link
                  href={`/events/${event.id}`}
                  className="inline-flex min-h-[40px] w-fit items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]"
                >
                  View More
                </Link>
              </div>
            </article>
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(-1)}
            aria-label="Previous event"
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 sm:left-4"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next event"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-primary shadow-md transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 sm:right-4"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="mt-4 flex justify-center gap-2">
            {events.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to event ${i + 1}`}
                className={`h-2 w-2 rounded-full transition sm:h-2.5 sm:w-2.5 ${
                  i === index ? "bg-primary scale-110" : "bg-slate-300 hover:bg-slate-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
