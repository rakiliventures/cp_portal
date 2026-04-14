import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.PAYMENT_ACCOUNTS, "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paymentAccount = (prisma as { paymentAccount?: typeof prisma.paymentAccount }).paymentAccount;
  if (!paymentAccount?.findUnique || !paymentAccount?.create) {
    return NextResponse.json(
      { error: "Payment accounts not available. Run: npx prisma generate && npx prisma db push" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const code = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "-");
    const name = String(body.name ?? "").trim();
    const description = body.description ? String(body.description).trim() : null;
    const isActive = !!body.isActive;

    if (!code || !name) {
      return NextResponse.json({ error: "Code and name are required." }, { status: 400 });
    }

    const existing = await paymentAccount.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: "A payment account with this code already exists." }, { status: 400 });
    }

    await paymentAccount.create({
      data: { code, name, description, isActive },
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
