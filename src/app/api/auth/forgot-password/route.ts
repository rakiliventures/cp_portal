export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { notifyPasswordReset } from "@/lib/notify";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body  = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    // Always respond generically — never reveal whether an account exists.
    const genericResponse = NextResponse.json({
      ok: true,
      message: "If an account exists for that email, we've sent password reset instructions.",
    });

    if (!email) return genericResponse;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) return genericResponse;

    const rawToken = randomBytes(32).toString("hex");
    const resetTokenHash = hashToken(rawToken);
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.user.update({
      where: { id: user.id },
      data:  { resetTokenHash, resetTokenExpiresAt },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "https://cp-olqp.vercel.app";
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

    notifyPasswordReset(user.id, resetUrl).catch((e) =>
      console.error("[forgot-password] notify failed:", e)
    );

    return genericResponse;
  } catch (e) {
    console.error("[forgot-password]", e);
    // Still respond generically on unexpected errors to avoid leaking state.
    return NextResponse.json({
      ok: true,
      message: "If an account exists for that email, we've sent password reset instructions.",
    });
  }
}
