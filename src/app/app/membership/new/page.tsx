import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewMemberForm } from "./NewMemberForm";

export default async function NewMemberPage() {
  const [workgroups, members] = await Promise.all([
    prisma.workgroup.findMany({
      where:   { status: "active" },
      orderBy: { abbreviation: "asc" },
      select:  { id: true, abbreviation: true, name: true },
    }),
    prisma.user.findMany({
      where:   { memberProfile: { isNot: null } },
      orderBy: { name: "asc" },
      select: {
        id:   true,
        name: true,
        memberProfile: { select: { workgroup: { select: { abbreviation: true } } } },
      },
    }),
  ]);

  const mentors = members.map((m) => ({
    id:            m.id,
    name:          m.name,
    workgroupName: m.memberProfile?.workgroup?.abbreviation ?? null,
  }));

  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/app/membership"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to members
        </Link>
      </div>

      <h1 className="page-heading mb-6">Add new member</h1>

      <NewMemberForm workgroups={workgroups} mentors={mentors} />
    </div>
  );
}
