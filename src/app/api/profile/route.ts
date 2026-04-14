export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body  = await request.json();
    const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
    const phone = body.phone !== undefined ? (body.phone ? String(body.phone).trim() : null) : undefined;

    if (email !== undefined) {
      if (!email) return NextResponse.json({ error: "Email cannot be empty." }, { status: 400 });
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
      // Check not taken by another user
      const conflict = await prisma.user.findFirst({ where: { email, id: { not: userId } } });
      if (conflict) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data:  {
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
      },
      select: { email: true, phone: true },
    });

    return NextResponse.json({ ok: true, email: updated.email, phone: updated.phone });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
