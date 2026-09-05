export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; invoiceId: string }> };

export async function PATCH(_request: Request, { params }: Params) {
  const { id: memberId, invoiceId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules      = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const verifiedById = (session.user as { id?: string }).id ?? null;

  const invoice = await prisma.financialAccount.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.memberId !== memberId) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }
  if (invoice.type !== "MANUAL_CP_KITTY" && invoice.type !== "MANUAL_WELFARE") {
    return NextResponse.json({ error: "Only manually added entries can be verified." }, { status: 400 });
  }
  if (invoice.verified) {
    return NextResponse.json({ error: "Already verified." }, { status: 400 });
  }
  if (invoice.createdById && invoice.createdById === verifiedById) {
    return NextResponse.json({ error: "You cannot verify an entry you created yourself." }, { status: 400 });
  }

  await prisma.financialAccount.update({
    where: { id: invoiceId },
    data:  { verified: true, verifiedById, verifiedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
