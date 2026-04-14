import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "view")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const expenses = await prisma.expense.findMany({
      orderBy: { expenseDate: "desc" },
      include: { recordedBy: { select: { id: true, name: true } } },
    });
    return NextResponse.json(expenses);
  } catch (e) {
    console.error("[GET /api/expenses]", e);
    return NextResponse.json({ error: "Failed to load expenses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.FINANCE, "create")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    const title             = String(body.title ?? "").trim();
    const description       = String(body.description ?? "").trim();
    const amount            = Number(body.amount);
    const expenseDate       = String(body.expenseDate ?? "").trim();
    const categoryOrAccount = String(body.categoryOrAccount ?? "").trim();

    if (!title)
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    if (!description)
      return NextResponse.json({ error: "Description is required." }, { status: 400 });
    if (!Number.isFinite(amount) || amount <= 0)
      return NextResponse.json({ error: "Valid amount is required." }, { status: 400 });
    if (!expenseDate)
      return NextResponse.json({ error: "Date is required." }, { status: 400 });
    const parsedDate = new Date(expenseDate);
    if (isNaN(parsedDate.getTime()))
      return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    // Validate against actual payment accounts in the DB
    const account = await prisma.paymentAccount.findFirst({
      where: { code: categoryOrAccount, isActive: true },
    });
    if (!account)
      return NextResponse.json({ error: "Please select a valid account." }, { status: 400 });

    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount,
        expenseDate:       parsedDate,
        categoryOrAccount,
        recordedById:      userId,
      },
      include: { recordedBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (e) {
    console.error("[POST /api/expenses]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save expense." },
      { status: 500 },
    );
  }
}
