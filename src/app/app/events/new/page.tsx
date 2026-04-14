import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { EventForm } from "../EventForm";

const BACK_MAP: Record<string, string> = {
  CP_EVENT: "/app/events/cp-events",
  MGM:      "/app/events/mgm",
  KACHAI:   "/app/events/kachai",
};

type PageProps = { searchParams: Promise<{ category?: string }> };

export default async function NewEventPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/events/new");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "create")) {
    redirect("/app/events/cp-events");
  }

  const params = await searchParams;
  const defaultCategory = ["CP_EVENT", "MGM", "KACHAI"].includes(params.category ?? "")
    ? (params.category as string)
    : "CP_EVENT";
  const backHref = BACK_MAP[defaultCategory] ?? "/app/events/cp-events";

  const [workgroups, members] = await Promise.all([
    prisma.workgroup.findMany({
      where: { status: "active" },
      orderBy: { abbreviation: "asc" },
      select: { id: true, name: true, abbreviation: true },
    }),
    prisma.user.findMany({
      where: { memberProfile: { isNot: null } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to events
        </Link>
      </div>
      <h1 className="page-heading">Add event</h1>
      <div className="card max-w-xl">
        <EventForm workgroups={workgroups} members={members} defaultCategory={defaultCategory} />
      </div>
    </div>
  );
}
