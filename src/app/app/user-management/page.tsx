import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MODULE_CODES } from "@/lib/permissions";
import { UserManagementClient, type SerializedUser, type ModuleOption } from "./UserManagementClient";

export default async function UserManagementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/user-management");

  const currentUserId = (session.user as { id?: string }).id ?? "";
  const isSuperAdmin  = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;

  // Only superadmins may access this page, regardless of any module assignment.
  if (!isSuperAdmin) redirect("/app/dashboard");

  const [users, modules] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        isSuperAdmin: true,
        status: true,
        userModuleAssignments: {
          select: {
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            validUntil: true,
            module: { select: { code: true, name: true } },
          },
        },
      },
    }),
    prisma.module.findMany({
      where:   { code: { not: MODULE_CODES.USER_MANAGEMENT } },
      orderBy: { name: "asc" },
      select:  { code: true, name: true },
    }),
  ]);

  const now = new Date();
  const serializedUsers: SerializedUser[] = users.map((u) => ({
    id:           u.id,
    name:         u.name,
    email:        u.email,
    isSuperAdmin: u.isSuperAdmin,
    status:       u.status,
    modules: u.userModuleAssignments
      .filter((a) => !a.validUntil || new Date(a.validUntil) > now)
      .map((a) => ({
        code:       a.module.code,
        name:       a.module.name,
        canView:    a.canView,
        canCreate:  a.canCreate,
        canEdit:    a.canEdit,
        canDelete:  a.canDelete,
        validUntil: a.validUntil ? a.validUntil.toISOString().slice(0, 10) : null,
      })),
  }));

  const moduleOptions: ModuleOption[] = modules;

  return (
    <div className="min-w-0">
      <h1 className="page-heading">User Management</h1>
      <p className="mb-5 text-sm text-slate-500">
        Search for any user to grant module permissions, or make them a superadmin.
      </p>
      <UserManagementClient
        users={serializedUsers}
        modules={moduleOptions}
        currentUserId={currentUserId}
      />
    </div>
  );
}
