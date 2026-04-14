export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  name: z.string().min(1),
  contact: z.string().min(1),
  email: z.string().email(),
  message: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, contact, email, message } = bodySchema.parse(body);
    await prisma.membershipInquiry.create({
      data: { name, contact, email, message },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
