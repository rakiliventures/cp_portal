export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; invoiceId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id: memberId, invoiceId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules      = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const editorId = (session.user as { id?: string }).id ?? null;

  const invoice = await prisma.financialAccount.findUnique({ where: { id: invoiceId } });
  if (!invoice || invoice.memberId !== memberId) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }
  if (invoice.type !== "MANUAL_CP_KITTY" && invoice.type !== "MANUAL_WELFARE") {
    return NextResponse.json({ error: "Only manually added entries can be edited." }, { status: 400 });
  }
  if (invoice.verified) {
    return NextResponse.json({ error: "Cannot edit an entry that has already been verified." }, { status: 400 });
  }
  // Only the admin who created this entry may edit it — a second admin should verify
  // it as-is, or (if it needs fixing) that's the creator's job, not theirs.
  if (invoice.createdById !== editorId) {
    return NextResponse.json({ error: "Only the admin who created this entry can edit it." }, { status: 403 });
  }

  try {
    const body   = await request.json();
    const amount = Number(body.amount);
    const type   = String(body.type ?? "").trim(); // CP_KITTY | WELFARE
    const kind   = String(body.kind ?? "DEBIT").trim(); // DEBIT | CREDIT
    const notes  = body.notes ? String(body.notes).trim() : null;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number." }, { status: 400 });
    }
    if (type !== "CP_KITTY" && type !== "WELFARE") {
      return NextResponse.json({ error: "Type must be CP_KITTY or WELFARE." }, { status: 400 });
    }
    if (kind !== "DEBIT" && kind !== "CREDIT") {
      return NextResponse.json({ error: "Kind must be DEBIT or CREDIT." }, { status: 400 });
    }

    const invoiceType    = type === "CP_KITTY" ? "MANUAL_CP_KITTY" : "MANUAL_WELFARE";
    const amountExpected = kind === "CREDIT" ? -amount : amount;

    await prisma.financialAccount.update({
      where: { id: invoiceId },
      data:  { type: invoiceType, amountExpected, notes },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[PATCH /api/members/[id]/invoices/[invoiceId]]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update entry." },
      { status: 500 },
    );
  }
}
