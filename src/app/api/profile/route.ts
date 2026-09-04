export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidMonthDay } from "@/lib/birthday";

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body     = await request.json();
    const email    = body.email ? String(body.email).trim().toLowerCase() : undefined;
    const phone    = body.phone !== undefined ? (body.phone ? String(body.phone).trim() : null) : undefined;
    const birthdayDayRaw   = body.birthdayDay !== undefined ? body.birthdayDay : undefined;
    const birthdayMonthRaw = body.birthdayMonth !== undefined ? body.birthdayMonth : undefined;

    if (email !== undefined) {
      if (!email) return NextResponse.json({ error: "Email cannot be empty." }, { status: 400 });
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
      // Check not taken by another user
      const conflict = await prisma.user.findFirst({ where: { email, id: { not: userId } } });
      if (conflict) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }

    let birthdayDay:   number | null | undefined = undefined;
    let birthdayMonth: number | null | undefined = undefined;
    if (birthdayDayRaw !== undefined || birthdayMonthRaw !== undefined) {
      birthdayDay   = birthdayDayRaw   === null || birthdayDayRaw   === undefined ? null : Number(birthdayDayRaw);
      birthdayMonth = birthdayMonthRaw === null || birthdayMonthRaw === undefined ? null : Number(birthdayMonthRaw);
      if ((birthdayDay === null) !== (birthdayMonth === null)) {
        return NextResponse.json({ error: "Both day and month are required for birthday." }, { status: 400 });
      }
      if (birthdayDay !== null && birthdayMonth !== null && !isValidMonthDay(birthdayMonth, birthdayDay)) {
        return NextResponse.json({ error: "Invalid birthday." }, { status: 400 });
      }
    }

    if (birthdayDay !== undefined) {
      const profile = await prisma.memberProfile.findUnique({ where: { userId } });
      if (!profile) return NextResponse.json({ error: "No member profile found." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data:  {
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
      },
      select: { email: true, phone: true },
    });

    if (birthdayDay !== undefined) {
      await prisma.memberProfile.update({ where: { userId }, data: { birthdayDay, birthdayMonth } });
    }

    return NextResponse.json({
      ok:            true,
      email:         updatedUser.email,
      phone:         updatedUser.phone,
      birthdayDay:   birthdayDay !== undefined ? birthdayDay : undefined,
      birthdayMonth: birthdayMonth !== undefined ? birthdayMonth : undefined,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
