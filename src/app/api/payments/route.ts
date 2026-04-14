export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notifyPaymentCaptured } from "@/lib/notify";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const createdById = (session.user as { id?: string }).id ?? null;

  try {
    const body = await request.json();
    const mpesaCode = String(body.mpesaCode ?? "").trim();
    const dateStr = body.datePaid;
    const amount = body.amount != null ? Number(body.amount) : NaN;
    const accountId = String(body.accountId ?? "").trim();
    const memberId = String(body.memberId ?? "").trim();
    const payeeName = String(body.payeeName ?? "").trim();

    if (!mpesaCode) return NextResponse.json({ error: "M-Pesa code is required." }, { status: 400 });
    if (!dateStr) return NextResponse.json({ error: "Date paid is required." }, { status: 400 });
    const datePaid = new Date(dateStr);
    if (isNaN(datePaid.getTime())) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Valid amount is required." }, { status: 400 });
    if (!accountId) return NextResponse.json({ error: "Payment account is required." }, { status: 400 });
    if (!memberId) return NextResponse.json({ error: "Member is required." }, { status: 400 });
    if (!payeeName) return NextResponse.json({ error: "Payee name is required." }, { status: 400 });

    const [account, member] = await Promise.all([
      prisma.paymentAccount.findUnique({ where: { id: accountId } }),
      prisma.user.findUnique({ where: { id: memberId }, include: { memberProfile: true } }),
    ]);
    if (!account) return NextResponse.json({ error: "Payment account not found." }, { status: 400 });
    if (!member?.memberProfile) return NextResponse.json({ error: "Member not found or has no profile." }, { status: 400 });

    const payment = await prisma.payment.create({
      data: { mpesaCode, datePaid, amount, accountId, memberId, payeeName, createdById },
    });
    // Fire notification after responding — does not block the API
    notifyPaymentCaptured(payment.id).catch(console.error);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
