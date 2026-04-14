import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES     = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules      = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (
    !canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "create") &&
    !canAccessModule(modules, isSuperAdmin, MODULE_CODES.EVENTS, "edit")
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Only JPEG, PNG, WebP, or GIF images are allowed." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image must be smaller than 5 MB." }, { status: 400 });
    }

    const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `event_${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "images", "events");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/images/events/${filename}` });
  } catch (e) {
    console.error("[POST /api/events/upload-banner]", e);
    return NextResponse.json({ error: "Failed to upload image." }, { status: 500 });
  }
}
