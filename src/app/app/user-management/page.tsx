import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/user-management");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.USER_MANAGEMENT, "view")) {
    redirect("/app/dashboard");
  }

  return (
    <div className="min-w-0">
      <h1 className="page-heading">User Management</h1>
      <div className="card">
        <p className="text-sm text-slate-600 sm:text-base">
          Assign modules and permissions (view/create/edit/delete) to members; temporary
          assignments with expiry (e.g. Events).
        </p>
      </div>
    </div>
  );
}
