import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: { code: string; canDelete: boolean }[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.PAYMENT_ACCOUNTS, "delete")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paymentAccount = (prisma as { paymentAccount?: { findUnique: (args: unknown) => Promise<unknown>; delete: (args: unknown) => Promise<unknown> } }).paymentAccount;
  if (!paymentAccount?.findUnique || !paymentAccount?.delete) {
    return NextResponse.json(
      { error: "Payment accounts not available. Run: npx prisma generate && npx prisma db push" },
      { status: 503 }
    );
  }

  const { id } = await params;
  try {
    const existing = await paymentAccount.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment account not found." }, { status: 404 });
    }
    await paymentAccount.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: { code: string; canEdit: boolean }[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.PAYMENT_ACCOUNTS, "edit")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const paymentAccount = (prisma as { paymentAccount?: { findUnique: (args: unknown) => Promise<unknown>; update: (args: unknown) => Promise<unknown> } }).paymentAccount;
  if (!paymentAccount?.findUnique || !paymentAccount?.update) {
    return NextResponse.json(
      { error: "Payment accounts not available. Run: npx prisma generate && npx prisma db push" },
      { status: 503 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const name = body.name != null ? String(body.name).trim() : undefined;
    const description = body.description != null ? (body.description ? String(body.description).trim() : null) : undefined;
    const isActive = body.isActive !== undefined ? !!body.isActive : undefined;

    const existing = await paymentAccount.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Payment account not found." }, { status: 404 });
    }

    await paymentAccount.update({
      where: { id },
      data: { ...(name !== undefined && { name }), ...(description !== undefined && { description }), ...(isActive !== undefined && { isActive }) },
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
