import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { EventAttendanceSection } from "./EventAttendanceSection";
import { EventActions } from "./EventActions";
import { CATEGORY_LABELS } from "../_shared/EventsListContent";

const CATEGORY_BACK: Record<string, string> = {
  CP_EVENT: "/app/events/cp-events",
  MGM:      "/app/events/mgm",
  KACHAI:   "/app/events/kachai",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function AppEventDetailPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const isSuperAdmin = !!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin;
  const modules = (session?.user as { modules?: ModuleAssignment[] })?.modules;
  const canManage          = canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "create");
  const canEdit            = canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "edit");
  const canDeleteAttendance = canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "delete");

  const [event, allMembers] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: {
        workgroupAssigned: { select: { name: true, abbreviation: true } },
        contactPerson:     { select: { name: true, email: true } },
        attendances: {
          where:   { attendeeType: "Member" },
          include: { member: { select: { id: true, name: true } } },
          orderBy: { recordedAt: "asc" },
        },
      },
    }),
    prisma.user.findMany({
      where:   { memberProfile: { isNot: null } },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, memberProfile: { select: { workgroupId: true } } },
    }),
  ]);

  if (!event) notFound();

  const isPast        = new Date(event.date) < new Date();
  const dateStr       = new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const categoryLabel = CATEGORY_LABELS[event.category] ?? event.category;
  const backHref      = CATEGORY_BACK[event.category] ?? "/app/events/cp-events";

  // For Kachai, restrict attendance to the event's assigned workgroup
  const isKachai             = event.category === "KACHAI";
  const workgroupAssignedId  = event.workgroupAssignedId ?? null;
  const eligibleMembers      = isKachai && workgroupAssignedId
    ? allMembers.filter((m) => m.memberProfile?.workgroupId === workgroupAssignedId)
    : allMembers;
  const attendanceRestriction = isKachai
    ? event.workgroupAssigned
      ? `Only members of ${event.workgroupAssigned.name} (${event.workgroupAssigned.abbreviation}) can record attendance for this event.`
      : "This Kachai event is not assigned to a workgroup — attendance recording is unrestricted."
    : null;

  const initialAttendances = event.attendances.map((a) => ({
    id:         a.id,
    memberId:   a.memberId,
    memberName: a.member?.name ?? null,
    recordedAt: a.recordedAt.toISOString(),
  }));

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to {categoryLabel}
        </Link>
        <EventActions
          eventId={event.id}
          backHref={backHref}
          canEdit={canEdit}
          canDelete={canDeleteAttendance}
          variant="detail"
        />
      </div>

      <article className="card overflow-hidden p-0">
        {event.imageBannerUrl && (
          <div className="relative aspect-[2/1] w-full bg-slate-200">
            <Image src={event.imageBannerUrl} alt={event.title} fill className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white sm:p-6">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                  {isPast ? "Past event" : "Upcoming"}
                </span>
                <span className="rounded-full bg-primary/80 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                  {categoryLabel}
                </span>
              </div>
              <time className="mt-2 block text-sm font-medium text-white/95">{dateStr}</time>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{event.title}</h1>
            </div>
          </div>
        )}

        <div className="p-5 sm:p-8">
          {!event.imageBannerUrl && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                  {isPast ? "Past event" : "Upcoming"}
                </span>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {categoryLabel}
                </span>
              </div>
              <time className="mt-2 block text-sm font-medium text-slate-600">{dateStr}</time>
              <h1 className="page-heading mt-1 mb-0">{event.title}</h1>
            </div>
          )}

          <dl className="mt-3 space-y-1 text-sm">
            {event.theme && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-medium text-slate-500">Theme</dt>
                <dd className="text-slate-700">{event.theme}</dd>
              </div>
            )}
            {event.workgroupAssigned && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-medium text-slate-500">Workgroup</dt>
                <dd className="text-slate-700">{event.workgroupAssigned.name}</dd>
              </div>
            )}
            {event.venue && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-medium text-slate-500">Venue</dt>
                <dd className="text-slate-700">{event.venue}</dd>
              </div>
            )}
            {event.startTime && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-medium text-slate-500">Start time</dt>
                <dd className="text-slate-700">{event.startTime}</dd>
              </div>
            )}
            {event.contactPerson && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-medium text-slate-500">Contact</dt>
                <dd className="text-slate-700">
                  {event.contactPerson.name}
                  {event.contactPerson.email && (
                    <span className="text-slate-500"> ({event.contactPerson.email})</span>
                  )}
                </dd>
              </div>
            )}
            {event.postEventReportUrl && (
              <div className="flex gap-2">
                <dt className="w-28 shrink-0 font-medium text-slate-500">Post-Event Report</dt>
                <dd>
                  <a
                    href={event.postEventReportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    Open report
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </dd>
              </div>
            )}
          </dl>

          {event.descriptionAgenda && (
            <div className="mt-5 border-t border-slate-100 pt-5 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
              {event.descriptionAgenda}
            </div>
          )}
        </div>
      </article>

      {/* Attendance section */}
      <EventAttendanceSection
        eventId={event.id}
        initialAttendances={initialAttendances}
        allMembers={eligibleMembers}
        canManage={canManage}
        canDelete={canDeleteAttendance}
        restrictionLabel={attendanceRestriction}
      />
    </div>
  );
}
