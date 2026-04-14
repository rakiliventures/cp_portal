import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type PageProps = { searchParams: Promise<{ view?: string }> };

export default async function EventsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const isSuperAdmin = !!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin;
  const modules = (session?.user as { modules?: { code: string; canCreate: boolean }[] })?.modules;
  const canCreate = canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "create");

  const params = await searchParams;
  const view = params.view === "past" ? "past" : params.view === "upcoming" ? "upcoming" : "all";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
      include: { workgroupAssigned: { select: { name: true, abbreviation: true } } },
    }),
    prisma.event.findMany({
      where: { date: { lt: today } },
      orderBy: { date: "desc" },
      include: { workgroupAssigned: { select: { name: true, abbreviation: true } } },
    }),
  ]);

  const upcomingCount = upcoming.length;
  const pastCount = past.length;
  const totalCount = upcomingCount + pastCount;

  const list = view === "upcoming" ? upcoming : view === "past" ? past : [...upcoming, ...past];

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-heading mb-0">Events</h1>
        {canCreate && (
          <Link
            href="/app/events/new"
            className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-5"
          >
            Add event
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-700">Filter:</span>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/events?view=upcoming"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === "upcoming" ? "bg-primary text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            Upcoming ({upcomingCount})
          </Link>
          <Link
            href="/app/events?view=past"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === "past" ? "bg-primary text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            Past ({pastCount})
          </Link>
          <Link
            href="/app/events"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              view === "all" ? "bg-primary text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            All ({totalCount})
          </Link>
        </div>
      </div>

      <p className="mb-4 text-sm text-slate-600">
        Showing <strong>{list.length}</strong> event{list.length !== 1 ? "s" : ""}.
      </p>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Venue</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Workgroup</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No events match the selected filter.
                  </td>
                </tr>
              ) : (
                list.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                  >
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(ev.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{ev.title}</td>
                    <td className="px-4 py-3 text-slate-600">{ev.venue ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {ev.workgroupAssigned?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/app/events/${ev.id}`}
                        className="font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
