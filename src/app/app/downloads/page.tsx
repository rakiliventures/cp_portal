import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { DocumentsClient, type SerializedDocument } from "./DocumentsClient";

export default async function DownloadsPage() {
  const session      = await getServerSession(authOptions);
  const isSuperAdmin = !!(session?.user as { isSuperAdmin?: boolean })?.isSuperAdmin;
  const modules      = (session?.user as { modules?: ModuleAssignment[] })?.modules;
  const canCreate    = canAccessModule(modules, isSuperAdmin, MODULE_CODES.DOWNLOADS, "create");
  const canEdit      = canAccessModule(modules, isSuperAdmin, MODULE_CODES.DOWNLOADS, "edit");
  const canDelete    = canAccessModule(modules, isSuperAdmin, MODULE_CODES.DOWNLOADS, "delete");

  const docs = await prisma.downloadableDocument.findMany({
    where:   { isActive: true },
    include: { createdBy: { select: { name: true } } },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });

  const serialized: SerializedDocument[] = docs.map((d) => ({
    id:          d.id,
    title:       d.title,
    url:         d.fileStoragePathOrUrl,
    description: d.description ?? null,
    category:    d.category ?? null,
    addedBy:     d.createdBy?.name ?? null,
    createdAt:   new Date(d.createdAt).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    }),
  }));

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="page-heading mb-0">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">
          CP Constitution, Mentorship Guidelines, Web Portal Documentation, and other shared resources.
        </p>
      </div>

      <DocumentsClient documents={serialized} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
    </div>
  );
}
