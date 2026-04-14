export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notifyPaymentVerified } from "@/lib/notify";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const verifiedById = (session.user as { id?: string }).id ?? null;

  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return NextResponse.json({ error: "Payment not found." }, { status: 404 });
  if (payment.verified) return NextResponse.json({ error: "Already verified." }, { status: 400 });

  await prisma.payment.update({
    where: { id },
    data: { verified: true, verifiedById, verifiedAt: new Date() },
  });
  notifyPaymentVerified(id).catch(console.error);
  return NextResponse.json({ ok: true });
}
