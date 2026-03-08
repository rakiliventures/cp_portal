"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

type Slide = { type: "image"; src: string } | { type: "video"; src: string };

// Add more items here; drop images/videos in public/images/bg/
const SLIDES: Slide[] = [
  { type: "image", src: "/images/bg/cake.jpg" },
  { type: "image", src: "/images/bg/moderator_2024.JPG" },
];
const INTERVAL_MS = 6000;
const FADE_DURATION_MS = 2000;

export function WelcomeHero() {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    SLIDES.forEach((s) => {
      if (s.type === "image") {
        const img = new window.Image();
        img.src = s.src;
      }
    });
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const slide = SLIDES[index];
    if (slide?.type === "video") {
      video.currentTime = 0;
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [index]);

  return (
    <section
      className="relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden px-4 py-16 sm:min-h-[480px] sm:py-20 md:min-h-[520px] md:py-24"
      aria-labelledby="welcome-heading"
    >
      {/* Background slide stack with crossfade */}
      {SLIDES.map((slide, i) => {
        const isActive = i === index;
        const fadeStyle = {
          opacity: isActive ? 1 : 0,
          transition: `opacity ${FADE_DURATION_MS}ms ease-in-out`,
        };
        if (slide.type === "video") {
          return (
            <div
              key={slide.src}
              className="absolute inset-0"
              style={fadeStyle}
              aria-hidden
            >
              <video
                ref={videoRef}
                src={slide.src}
                className="h-full w-full object-cover"
                muted
                loop
                playsInline
                preload="auto"
                aria-hidden
              />
            </div>
          );
        }
        return (
          <div
            key={slide.src}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${slide.src})`,
              ...fadeStyle,
            }}
            aria-hidden
          />
        );
      })}
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/60" aria-hidden />
      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-white/90 sm:text-sm sm:tracking-[0.25em]">
          Welcome to the
        </p>
        <h2 id="welcome-heading" className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
          Catholic Professionals
        </h2>
        <p className="mb-3 text-base font-medium text-white/95 sm:text-lg">
          of OLQP South B (CP)
        </p>
        <p className="mb-2 text-base font-semibold text-accent-light sm:text-lg md:text-xl">
          Serving God Through our Professions
        </p>
        <span className="mb-6 inline-block h-px w-16 bg-accent-light/80 sm:mb-8" aria-hidden />
        <p className="mb-6 text-base italic tracking-wide text-white/90 sm:mb-8 sm:text-lg">Ora Et Labora</p>
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-xl bg-primary px-5 py-3 font-semibold tracking-wide text-white shadow-lg shadow-primary/30 transition hover:bg-primary-light hover:shadow-xl hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900/50 active:scale-[0.98]"
          >
            Member Login
          </Link>
          <a
            href="#about-us"
            className="inline-flex min-h-[44px] min-w-[120px] items-center justify-center rounded-xl border-2 border-white bg-white/10 px-5 py-3 font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900/30 active:scale-[0.98]"
          >
            Learn More about CP
          </a>
        </div>
      </div>
    </section>
  );
}
