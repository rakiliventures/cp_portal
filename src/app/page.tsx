import Link from "next/link";
import Image from "next/image";
import { EventsCarousel } from "@/components/landing/EventsCarousel";
import { PastEventsCarousel } from "@/components/landing/PastEventsCarousel";
import { JoinUsForm } from "@/components/landing/JoinUsForm";
import { WelcomeHero } from "@/components/landing/WelcomeHero";

export default function LandingPage() {
  return (
    <div className="landing-bg min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link href="/" className="flex min-h-[44px] items-center transition opacity-90 hover:opacity-100 active:opacity-100">
            <Image
              src="/images/logo.jpg"
              alt="The Catholic Professionals of OLQP"
              width={120}
              height={60}
              className="h-12 w-auto object-contain sm:h-14"
              priority
              sizes="(max-width: 640px) 100px, 120px"
            />
          </Link>
          <Link
            href="/login"
            className="flex min-h-[44px] items-center rounded-xl bg-accent px-4 py-2.5 font-semibold text-primary-dark shadow-accent-soft transition hover:bg-accent-light hover:shadow-accent-glow focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-white active:scale-[0.98] sm:px-5"
          >
            Member login
          </Link>
        </div>
      </header>

      <main>
        <WelcomeHero />

        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 md:py-20">

        {/* Full-width white background for featured events */}
        <section
          className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen mb-12 bg-white py-8 shadow-sm sm:mb-16 sm:py-10 md:py-12"
          aria-labelledby="featured-events-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-6">
              <div className="min-w-0">
                <h2 id="featured-events-heading" className="sr-only">Featured events</h2>
                <h3 className="mb-4 text-xl font-bold text-primary sm:mb-5 sm:text-2xl md:text-3xl">
                  <span className="inline-block border-b-2 border-accent pb-1">Upcoming events</span>
                </h3>
                <EventsCarousel />
              </div>
              <div className="min-w-0">
                <h3 className="mb-4 text-xl font-bold text-primary sm:mb-5 sm:text-2xl md:text-3xl">
                  <span className="inline-block border-b-2 border-accent pb-1">Past events</span>
                </h3>
                <PastEventsCarousel />
              </div>
            </div>
          </div>
        </section>

        {/* About Us — below featured events */}
        <section id="about-us" className="mb-16 sm:mb-20" aria-labelledby="about-heading">
          <h2 id="about-heading" className="mb-8 text-center text-2xl font-bold text-primary sm:mb-10 sm:text-3xl md:text-4xl">
            <span className="inline-block border-b-2 border-accent pb-2">About Us</span>
          </h2>

          {/* Infographic stats strip */}
          <div className="mb-10 grid grid-cols-3 gap-4 sm:gap-6">
            <div className="flex flex-col items-center rounded-2xl border border-primary/20 bg-white/80 px-4 py-5 shadow-sm backdrop-blur sm:px-6 sm:py-6">
              <span className="mb-1 text-2xl font-bold text-accent sm:text-3xl">2004</span>
              <span className="text-center text-xs font-medium text-slate-600 sm:text-sm">Year founded</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-primary/20 bg-white/80 px-4 py-5 shadow-sm backdrop-blur sm:px-6 sm:py-6">
              <span className="mb-1 text-2xl font-bold text-primary sm:text-3xl">3</span>
              <span className="text-center text-xs font-medium text-slate-600 sm:text-sm">Workgroups</span>
            </div>
            <div className="flex flex-col items-center rounded-2xl border border-primary/20 bg-white/80 px-4 py-5 shadow-sm backdrop-blur sm:px-6 sm:py-6">
              <span className="mb-1 text-2xl font-bold text-accent sm:text-3xl">22–40</span>
              <span className="text-center text-xs font-medium text-slate-600 sm:text-sm">Age range</span>
            </div>
          </div>

          <div className="space-y-8 sm:space-y-10">
            {/* Who We Are */}
            <div className="landing-glass-card flex flex-col gap-6 rounded-2xl p-5 sm:flex-row sm:gap-8 sm:p-8 md:p-10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-16 sm:w-16">
                <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="mb-2 text-lg font-bold text-primary sm:text-xl">Who We Are</h3>
                <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                  The Catholic Professionals of OLQP South B (CP) is a dynamic community of young Catholic professionals who believe in serving God through excellence in our careers. We embody &quot;Ora Et Labora&quot; (Prayer and Work), creating a space where faith meets professional ambition.
                </p>
              </div>
            </div>

            {/* Our History */}
            <div className="landing-glass-card flex flex-col gap-6 rounded-2xl p-5 sm:flex-row sm:gap-8 sm:p-8 md:p-10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent-dark sm:h-16 sm:w-16">
                <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="mb-2 text-lg font-bold text-primary sm:text-xl">Our History</h3>
                <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                  Founded in 2004 by a group of young Catholic professionals at OLQP South B, our community started as informal coffee meetups after Sunday mass. We recognized the unique challenges young professionals face in integrating faith with career ambitions. Today, we&apos;re a thriving network of lawyers, doctors, engineers, teachers, entrepreneurs, and creatives who support each other&apos;s professional and spiritual growth.
                </p>
              </div>
            </div>

            {/* Membership — with mini infographic */}
            <div className="landing-glass-card flex flex-col gap-6 rounded-2xl p-5 sm:flex-row sm:gap-8 sm:p-8 md:p-10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:h-16 sm:w-16">
                <svg className="h-7 w-7 sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="mb-2 text-lg font-bold text-primary sm:text-xl">Membership</h3>
                <p className="mb-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                  We welcome young Catholic professionals (ages 22–40) from all career stages — from recent graduates to established professionals. Whether you&apos;re just starting your career or looking to make a meaningful transition, our diverse community offers mentorship, networking, and spiritual support.
                </p>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:text-sm">Mentorship</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:text-sm">Networking</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:text-sm">Spiritual support</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Join Us — full-width distinct background */}
        <section
          id="join-us"
          className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-slate-100 py-12 sm:py-16 md:py-20"
          aria-labelledby="join-us-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
            <h2 id="join-us-heading" className="mb-2 text-center text-2xl font-bold text-slate-800 sm:text-3xl md:text-4xl">
              Join Our Network
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-center text-slate-600 sm:mb-10 sm:text-lg">
              Ready to connect with like-minded young Catholic professionals? Let&apos;s start the conversation.
            </p>
            <div className="mx-auto max-w-lg">
              <JoinUsForm />
            </div>
          </div>
        </section>

        {/* Connect With Us — full-width light grey background, two cards */}
        <section
          className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-slate-100 py-12 sm:py-16 md:py-20"
          aria-labelledby="connect-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
            <h2 id="connect-heading" className="mb-2 text-center text-2xl font-bold text-slate-800 sm:text-3xl md:text-4xl">
              Connect With Us
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-center text-slate-600 sm:mb-10 sm:text-lg">
              Ready to join our community of young Catholic professionals?
            </p>
            <div className="grid gap-6 md:grid-cols-2 md:gap-8">
              {/* Left card: Contact Information */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
                <h3 className="mb-5 text-lg font-bold text-slate-800 sm:text-xl">Contact Information</h3>
                <ul className="space-y-4">
                  <li className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Phone</p>
                      <a href="tel:+254712345678" className="text-sm text-slate-600 hover:text-primary hover:underline">+254 712 345 678</a>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Email</p>
                      <a href="mailto:info@catholicprofessionals-olqp.org" className="text-sm text-slate-600 hover:text-primary hover:underline">info@catholicprofessionals-olqp.org</a>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Location</p>
                      <p className="text-sm text-slate-600">OLQP St. Kizito Room, South B</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary" aria-hidden>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Meeting Schedule</p>
                      <p className="text-sm text-slate-600">First Sunday of every month after the 11:30 AM mass</p>
                    </div>
                  </li>
                </ul>
              </div>
              {/* Right card: Connect With Us (social + meeting details) */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-8">
                <h3 className="mb-3 text-lg font-bold text-slate-800 sm:text-xl">Connect With Us</h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-700 sm:text-base">
                  Follow us on social media to stay updated with our latest events, activities, and community news.
                </p>
                <div className="mb-6 flex flex-wrap gap-3">
                  <a
                    href="https://www.facebook.com/OLQPParish"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:ring-offset-2"
                    aria-label="Facebook"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/olqpparish"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E4405F] text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#E4405F] focus:ring-offset-2"
                    aria-label="Instagram"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a
                    href="https://www.youtube.com/@OLQPParish"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF0000] text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FF0000] focus:ring-offset-2"
                    aria-label="YouTube"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                </div>
                <div className="rounded-xl bg-violet-50 p-4 sm:p-5">
                  <p className="mb-1.5 text-sm font-semibold text-violet-800">Meeting Details</p>
                  <p className="text-sm leading-relaxed text-violet-900/90">
                    We normally meet the first Sunday of every month after the 11:30 AM mass at OLQP St. Kizito room.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        </div>

        <footer className="border-t border-slate-200 bg-white/60 px-4 pt-8 pb-6 text-center backdrop-blur-sm sm:pt-10 sm:pb-8">
          <p className="text-sm text-slate-600 sm:text-base">Catholic Professionals of OLQP South B (CP)</p>
          <p className="mt-3 text-xs font-medium text-accent-dark sm:text-sm">Serving God Through our Professions</p>
        </footer>
      </main>
    </div>
  );
}
