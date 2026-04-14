import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { EventActions } from "../[id]/EventActions";

export const CATEGORY_LABELS: Record<string, string> = {
  CP_EVENT: "CP Event",
  MGM:      "MGM Meeting",
  KACHAI:   "Kachai",
};

type Props = {
  category: "CP_EVENT" | "MGM" | "KACHAI";
  label: string;
  basePath: string;
  searchParams?: { view?: string };
};

export async function EventsListContent({ category, label, basePath, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const isSuperAdmin = !!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin;
  const modules = (session?.user as { modules?: { code: string; canCreate: boolean }[] })?.modules;
  const canCreate = canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "create");
  const canEdit   = canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "edit");
  const canDelete = canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "delete");

  const view  = searchParams?.view === "past" ? "past" : searchParams?.view === "upcoming" ? "upcoming" : "all";
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [upcoming, past] = await Promise.all([
    prisma.event.findMany({
      where:   { date: { gte: today }, category },
      orderBy: { date: "asc" },
      include: { workgroupAssigned: { select: { name: true } }, _count: { select: { attendances: true } } },
    }),
    prisma.event.findMany({
      where:   { date: { lt: today }, category },
      orderBy: { date: "desc" },
      include: { workgroupAssigned: { select: { name: true } }, _count: { select: { attendances: true } } },
    }),
  ]);

  const list = view === "upcoming" ? upcoming : view === "past" ? past : [...upcoming, ...past];

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-heading mb-0">{label}</h1>
        {canCreate && (
          <Link
            href={`/app/events/new?category=${category}`}
            className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-5"
          >
            Add event
          </Link>
        )}
      </div>

      {/* View filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={`${basePath}?view=upcoming`}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${view === "upcoming" ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
          Upcoming ({upcoming.length})
        </Link>
        <Link href={`${basePath}?view=past`}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${view === "past" ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
          Past ({past.length})
        </Link>
        <Link href={basePath}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${view === "all" ? "bg-primary text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
          All ({upcoming.length + past.length})
        </Link>
      </div>

      <div className="card overflow-hidden p-0">
        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-slate-100">
          {list.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No {label.toLowerCase()} found.</p>
          ) : (
            list.map((ev) => {
              const isPast = new Date(ev.date) < today;
              return (
                <div key={ev.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500">
                          {new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isPast ? "bg-slate-100 text-slate-600" : "bg-green-50 text-green-700"}`}>
                          {isPast ? "Past" : "Upcoming"}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">{ev.title}</p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                        {ev.venue && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            {ev.venue}
                          </span>
                        )}
                        {ev.workgroupAssigned && (
                          <span className="flex items-center gap-1">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                            {ev.workgroupAssigned.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                          {ev._count.attendances} attendees
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Link
                        href={`/app/events/${ev.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-primary"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                      <EventActions eventId={ev.id} backHref={basePath} canEdit={canEdit} canDelete={canDelete} variant="row" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full min-w-[580px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Title</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Venue</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Workgroup</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Attendees</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No {label.toLowerCase()} found.
                  </td>
                </tr>
              ) : (
                list.map((ev) => {
                  const isPast = new Date(ev.date) < today;
                  return (
                    <tr key={ev.id} className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0">
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(ev.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{ev.title}</td>
                      <td className="px-4 py-3 text-slate-600">{ev.venue ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{ev.workgroupAssigned?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{ev._count.attendances}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isPast ? "bg-slate-100 text-slate-600" : "bg-green-50 text-green-700"}`}>
                          {isPast ? "Past" : "Upcoming"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/app/events/${ev.id}`}
                            title="View event details"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-primary"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </Link>
                          <EventActions
                            eventId={ev.id}
                            backHref={basePath}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            variant="row"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
