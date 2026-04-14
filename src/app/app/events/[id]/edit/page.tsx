import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { EventForm } from "../../EventForm";
import { CATEGORY_LABELS } from "../../_shared/EventsListContent";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=/app/events/${id}/edit`);

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "edit")) {
    redirect(`/app/events/${id}`);
  }

  const [event, workgroups, members] = await Promise.all([
    prisma.event.findUnique({ where: { id } }),
    prisma.workgroup.findMany({
      where:   { status: "active" },
      orderBy: { abbreviation: "asc" },
      select:  { id: true, name: true, abbreviation: true },
    }),
    prisma.user.findMany({
      where:   { memberProfile: { isNot: null } },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, email: true },
    }),
  ]);

  if (!event) notFound();

  const categoryLabel = CATEGORY_LABELS[event.category] ?? event.category;

  const initialValues = {
    title:               event.title,
    date:                event.date.toISOString().slice(0, 10),
    category:            event.category,
    theme:               event.theme,
    descriptionAgenda:   event.descriptionAgenda,
    venue:               event.venue,
    startTime:           event.startTime,
    imageBannerUrl:      event.imageBannerUrl,
    workgroupAssignedId: event.workgroupAssignedId,
    contactPersonId:     event.contactPersonId,
    featuredOnLanding:   event.featuredOnLanding,
    postEventReportUrl:  event.postEventReportUrl ?? null,
  };

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <Link
          href={`/app/events/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to event
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="page-heading mb-0">Edit event</h1>
        <p className="mt-1 text-sm text-slate-500">
          {categoryLabel} &middot; {event.date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      <div className="card max-w-xl">
        <EventForm
          workgroups={workgroups}
          members={members}
          eventId={id}
          initialValues={initialValues}
          redirectTo={`/app/events/${id}`}
        />
      </div>
    </div>
  );
}
