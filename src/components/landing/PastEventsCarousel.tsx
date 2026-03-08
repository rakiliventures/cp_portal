"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useRef, useEffect } from "react";
import type { PastEvent } from "@/lib/events-data";
import { PAST_EVENTS } from "@/lib/events-data";

const SWIPE_THRESHOLD = 50;

export function PastEventsCarousel() {
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);
  const events = PAST_EVENTS;
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

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => goTo(1), 6000);
    return () => clearInterval(t);
  }, [count, goTo]);

  if (events.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-600">
        No past events to show yet. Check back after events are completed.
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
          <div key={event.id} className="min-w-full shrink-0 px-1 sm:px-2">
            <article className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-lg shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/20">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 sm:aspect-[2/1]">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px"
                  priority={event.id === events[0].id}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" aria-hidden />
              </div>
              <div className="flex flex-col gap-4 p-4 sm:p-5">
                <div>
                  <time className="text-xs font-semibold uppercase tracking-wider text-primary sm:text-sm">
                    {event.date}
                  </time>
                  <h4 className="mt-1.5 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">{event.title}</h4>
                  {event.summary && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 sm:text-base">
                      {event.summary}
                    </p>
                  )}
                </div>
                <Link
                  href={`/events/${event.id}`}
                  className="inline-flex min-h-[42px] w-fit items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary-light hover:shadow-lg hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98]"
                >
                  View event
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
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
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg ring-1 ring-slate-200/80 transition hover:bg-primary hover:text-white hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 sm:left-4"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            aria-label="Next event"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-lg ring-1 ring-slate-200/80 transition hover:bg-primary hover:text-white hover:ring-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 sm:right-4"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="mt-5 flex justify-center gap-2">
            {events.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to event ${i + 1}`}
                className={`h-2 rounded-full transition-all sm:h-2.5 ${
                  i === index ? "w-6 bg-primary sm:w-8" : "w-2 bg-slate-300 hover:bg-slate-400 sm:w-2.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
