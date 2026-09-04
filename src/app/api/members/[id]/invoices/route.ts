export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id: memberId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules      = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.MEMBERSHIP, "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const createdById = (session.user as { id?: string }).id ?? null;

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

    // Verify the member exists
    const member = await prisma.memberProfile.findUnique({ where: { userId: memberId } });
    if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

    const invoiceType = type === "CP_KITTY" ? "MANUAL_CP_KITTY" : "MANUAL_WELFARE";
    // Use a timestamp-based key so multiple manual invoices can coexist
    const yearOrMonth = new Date().toISOString();
    // A credit line reduces what's owed (e.g. an overpayment / opening balance carried
    // forward as a credit), stored as a negative amountExpected.
    const amountExpected = kind === "CREDIT" ? -amount : amount;

    await prisma.financialAccount.create({
      data: {
        memberId,
        type:           invoiceType,
        yearOrMonth,
        amountExpected,
        notes,
        createdById,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
