import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules      = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.DOWNLOADS, "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = (session.user as { id?: string }).id;

  try {
    const body        = await request.json();
    const title       = String(body.title ?? "").trim();
    const url         = String(body.url ?? "").trim();
    const description = body.description ? String(body.description).trim() : null;
    const category    = body.category ? String(body.category).trim() : null;

    if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });
    if (!url)   return NextResponse.json({ error: "Google Drive link is required." }, { status: 400 });

    const doc = await prisma.downloadableDocument.create({
      data: {
        title,
        fileStoragePathOrUrl: url,
        description,
        category,
        createdById: userId ?? null,
      },
      include: { createdBy: { select: { name: true } } },
    });

    return NextResponse.json({
      id:          doc.id,
      title:       doc.title,
      url:         doc.fileStoragePathOrUrl,
      description: doc.description ?? null,
      category:    doc.category ?? null,
      addedBy:     doc.createdBy?.name ?? null,
      createdAt:   new Date(doc.createdAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
      }),
    });
  } catch (e) {
    console.error("[POST /api/documents]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save document." },
      { status: 500 },
    );
  }
}
