export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { notifyPaymentCaptured } from "@/lib/notify";

type ImportRow = {
  mpesaCode: string;
  datePaid: string;
  amount: number;
  accountCode: string;
  memberIdentifier: string;
  payeeName: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.rows || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rows: ImportRow[] = body.rows;
  const accounts = await prisma.paymentAccount.findMany({ select: { id: true, code: true } });
  const accountByCode = Object.fromEntries(accounts.map((a) => [a.code.toUpperCase(), a.id]));

  const members = await prisma.user.findMany({
    where: { memberProfile: { isNot: null } },
    select: { id: true, name: true, email: true, phone: true },
  });

  let created = 0;
  const skipped: { row: number; reason: string }[] = [];
  const createdIds: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 1-indexed, account for header

    const mpesaCode = String(row.mpesaCode ?? "").trim();
    if (!mpesaCode) { skipped.push({ row: rowNum, reason: "Missing M-Pesa code" }); continue; }

    const datePaid = new Date(row.datePaid);
    if (isNaN(datePaid.getTime())) { skipped.push({ row: rowNum, reason: "Invalid date" }); continue; }

    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) { skipped.push({ row: rowNum, reason: "Invalid amount" }); continue; }

    const accountId = accountByCode[row.accountCode?.toUpperCase()];
    if (!accountId) { skipped.push({ row: rowNum, reason: `Unknown account: ${row.accountCode}` }); continue; }

    const ident = String(row.memberIdentifier ?? "").trim().toLowerCase();
    const member = members.find(
      (m) =>
        m.email?.toLowerCase() === ident ||
        m.phone?.replace(/\s+/g, "") === ident.replace(/\s+/g, "") ||
        m.name?.toLowerCase() === ident
    );
    if (!member) { skipped.push({ row: rowNum, reason: `Member not found: ${row.memberIdentifier}` }); continue; }

    // Skip duplicates (same mpesa code)
    const exists = await prisma.payment.findFirst({ where: { mpesaCode } });
    if (exists) { skipped.push({ row: rowNum, reason: `Duplicate M-Pesa code: ${mpesaCode}` }); continue; }

    const payment = await prisma.payment.create({
      data: {
        mpesaCode,
        datePaid,
        amount,
        accountId,
        memberId: member.id,
        payeeName: row.payeeName || member.name,
        createdById: null, // null = imported from report
      },
    });
    createdIds.push(payment.id);
    created++;
  }

  // Fire notifications after response — non-blocking
  for (const id of createdIds) {
    notifyPaymentCaptured(id).catch(console.error);
  }

  return NextResponse.json({ ok: true, created, skipped: skipped.length, skippedDetails: skipped });
}
