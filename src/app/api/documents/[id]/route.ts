import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules      = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.DOWNLOADS, "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body        = await request.json();
    const title       = String(body.title ?? "").trim();
    const url         = String(body.url ?? "").trim();
    const description = body.description ? String(body.description).trim() || null : null;
    const category    = body.category    ? String(body.category).trim()    || null : null;

    if (!title) return NextResponse.json({ error: "Title is required." },             { status: 400 });
    if (!url)   return NextResponse.json({ error: "Google Drive link is required." }, { status: 400 });

    const doc = await prisma.downloadableDocument.update({
      where:   { id },
      data:    { title, fileStoragePathOrUrl: url, description, category },
      include: { createdBy: { select: { name: true } } },
    });

    return NextResponse.json({
      id:          doc.id,
      title:       doc.title,
      url:         doc.fileStoragePathOrUrl,
      description: doc.description ?? null,
      category:    doc.category    ?? null,
      addedBy:     doc.createdBy?.name ?? null,
      createdAt:   new Date(doc.createdAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      }),
    });
  } catch (e) {
    console.error("[PATCH /api/documents/[id]]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update document." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules      = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.DOWNLOADS, "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.downloadableDocument.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[DELETE /api/documents/[id]]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete document." },
      { status: 500 },
    );
  }
}
