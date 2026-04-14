import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { MembershipTable } from "../MembershipTable";
import { fetchMemberPageData } from "../_fetchMembers";

export default async function CurrentMembersPage() {
  const session      = await getServerSession(authOptions);
  const isSuperAdmin = !!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin;
  const modules      = (session?.user as { modules?: ModuleAssignment[] })?.modules;
  const canCreate    = canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "create");
  const canEdit      = canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "edit");

  const { serializedMembers, workgroupCounts, attendanceYear, attendanceTotals } =
    await fetchMemberPageData("Active");

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-heading mb-0">Current Members</h1>
        {canCreate && (
          <Link
            href="/app/membership/new"
            className="no-print inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-5"
          >
            Add new member
          </Link>
        )}
      </div>

      <MembershipTable
        members={serializedMembers}
        workgroups={workgroupCounts}
        canCreate={canCreate}
        canEdit={canEdit}
        attendanceYear={attendanceYear}
        attendanceTotals={attendanceTotals}
      />
    </div>
  );
}
