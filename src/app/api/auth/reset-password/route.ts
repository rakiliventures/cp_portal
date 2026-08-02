export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";
  if (!token) return NextResponse.json({ valid: false });

  const user = await prisma.user.findFirst({
    where: { resetTokenHash: hashToken(token) },
    select: { resetTokenExpiresAt: true },
  });

  const valid = !!user?.resetTokenExpiresAt && user.resetTokenExpiresAt > new Date();
  return NextResponse.json({ valid });
}

export async function POST(request: Request) {
  try {
    const body        = await request.json();
    const token       = String(body.token ?? "").trim();
    const newPassword = String(body.newPassword ?? "");

    if (!token) return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { resetTokenHash: hashToken(token) },
    });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
    }

    const passwordHash = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null, mustChangePassword: false },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[reset-password]", e);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
