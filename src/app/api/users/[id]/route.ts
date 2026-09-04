export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MODULE_CODES } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

type ModuleInput = {
  code:       string;
  canView:    boolean;
  canCreate:  boolean;
  canEdit:    boolean;
  canDelete:  boolean;
  validUntil: string | null;
};

export async function PATCH(request: Request, { params }: Params) {
  const { id: targetUserId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // User Management is superadmin-only — no module permission can substitute for this.
  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  if (!isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const assignedById = (session.user as { id?: string }).id ?? null;

  try {
    const body = await request.json();
    const newIsSuperAdmin: boolean | undefined = typeof body.isSuperAdmin === "boolean" ? body.isSuperAdmin : undefined;
    const moduleInputs: ModuleInput[] | undefined = Array.isArray(body.modules) ? body.modules : undefined;

    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

    // Guard against locking everyone out by demoting the last remaining superadmin.
    if (newIsSuperAdmin === false && target.isSuperAdmin) {
      const superAdminCount = await prisma.user.count({ where: { isSuperAdmin: true } });
      if (superAdminCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last remaining superadmin." }, { status: 400 });
      }
    }

    const validModuleCodes: Set<string> = new Set(
      Object.values(MODULE_CODES).filter((c: string) => c !== MODULE_CODES.USER_MANAGEMENT)
    );
    if (moduleInputs) {
      for (const m of moduleInputs) {
        if (!validModuleCodes.has(m.code)) {
          return NextResponse.json({ error: `Unknown module: ${m.code}` }, { status: 400 });
        }
      }
    }

    await prisma.$transaction(async (tx) => {
      if (newIsSuperAdmin !== undefined) {
        await tx.user.update({ where: { id: targetUserId }, data: { isSuperAdmin: newIsSuperAdmin } });
      }

      if (moduleInputs) {
        const modules = await tx.module.findMany({ where: { code: { in: moduleInputs.map((m) => m.code) } } });
        const moduleByCode = new Map(modules.map((m) => [m.code, m.id]));

        for (const m of moduleInputs) {
          const moduleId = moduleByCode.get(m.code);
          if (!moduleId) continue;

          const hasAnyPermission = m.canView || m.canCreate || m.canEdit || m.canDelete;
          const validUntil = m.validUntil ? new Date(m.validUntil) : null;

          if (!hasAnyPermission) {
            await tx.userModuleAssignment.deleteMany({ where: { userId: targetUserId, moduleId } });
            continue;
          }

          await tx.userModuleAssignment.upsert({
            where:  { userId_moduleId: { userId: targetUserId, moduleId } },
            create: {
              userId: targetUserId,
              moduleId,
              canView:    m.canView,
              canCreate:  m.canCreate,
              canEdit:    m.canEdit,
              canDelete:  m.canDelete,
              validUntil,
              assignedById,
            },
            update: {
              canView:    m.canView,
              canCreate:  m.canCreate,
              canEdit:    m.canEdit,
              canDelete:  m.canDelete,
              validUntil,
              assignedById,
              assignedAt: new Date(),
            },
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/users/[id]]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update user." },
      { status: 500 },
    );
  }
}
