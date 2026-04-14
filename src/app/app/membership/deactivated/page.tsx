import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { MembershipTable } from "../MembershipTable";
import { fetchMemberPageData } from "../_fetchMembers";

export default async function DeactivatedMembersPage() {
  const session      = await getServerSession(authOptions);
  const isSuperAdmin = !!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin;
  const modules      = (session?.user as { modules?: ModuleAssignment[] })?.modules;
  const canEdit      = canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "edit");

  const { serializedMembers, workgroupCounts, attendanceYear, attendanceTotals } =
    await fetchMemberPageData("Paused");

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="page-heading mb-0">Deactivated Members</h1>
        <p className="mt-1 text-sm text-slate-500">
          These members have been deactivated and are not being invoiced. Reactivate a member to resume automatic invoicing.
        </p>
      </div>

      <MembershipTable
        members={serializedMembers}
        workgroups={workgroupCounts}
        canCreate={false}
        canEdit={canEdit}
        attendanceYear={attendanceYear}
        attendanceTotals={attendanceTotals}
        showDeactivatedAt
      />
    </div>
  );
}
