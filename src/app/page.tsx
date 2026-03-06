import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-dark to-primary">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-semibold text-white">Catholic Professionals (CP)</h1>
          <Link
            href="/login"
            className="rounded-lg bg-white/10 px-4 py-2 text-white hover:bg-white/20"
          >
            Member login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <section className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
            Welcome to Catholic Professionals
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/90">
            A community of professionals committed to faith, fellowship, and service. Join us for
            events, mentorship, and growth.
          </p>
        </section>

        <section className="mb-16 rounded-2xl bg-white/5 p-8 backdrop-blur">
          <h3 className="mb-4 text-2xl font-semibold text-white">About CP</h3>
          <p className="max-w-3xl text-white/90">
            Catholic Professionals brings together three workgroups: Community Outreach, Team
            Building, and Spiritual Development. Members participate in monthly meetings, pay
            subscriptions and welfare contributions, and benefit from mentorship and a shared
            calendar of events.
          </p>
        </section>

        <section className="mb-16 grid gap-8 md:grid-cols-2">
          <div className="card">
            <h3 className="mb-2 font-semibold text-primary">Join / Send an inquiry</h3>
            <p className="mb-4 text-slate-600">
              Interested in joining? Send us your details and we’ll get back to you.
            </p>
            <Link href="/inquiry" className="btn-primary inline-block">
              Send inquiry
            </Link>
          </div>
          <div className="card">
            <h3 className="mb-2 font-semibold text-primary">Already a member?</h3>
            <p className="mb-4 text-slate-600">
              Log in to access your dashboard, events, and group reports.
            </p>
            <Link href="/login" className="btn-primary inline-block">
              Member login
            </Link>
          </div>
        </section>

        <section className="mb-16">
          <h3 className="mb-4 text-2xl font-semibold text-white">Featured events</h3>
          <p className="text-white/80">
            Upcoming and past featured events will appear here. (Connect to Events module.)
          </p>
        </section>

        <footer className="border-t border-white/10 pt-8 text-center text-white/70">
          <p>Contact: CP Committee — see Group contacts for details.</p>
        </footer>
      </main>
    </div>
  );
}
