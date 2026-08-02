export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { InquiriesClient, type Inquiry } from "./InquiriesClient";

export default async function InquiriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/inquiries");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.INQUIRIES_MANAGEMENT, "view")) {
    redirect("/app/dashboard");
  }

  const rows = await prisma.membershipInquiry.findMany({
    include: { actionedBy: { select: { name: true } } },
    orderBy: { submittedAt: "desc" },
  });

  const inquiries: Inquiry[] = rows.map((r) => ({
    id:              r.id,
    name:            r.name,
    contact:         r.contact,
    email:           r.email,
    message:         r.message,
    submittedAt:     r.submittedAt.toISOString(),
    status:          r.status as Inquiry["status"],
    notes:           r.notes ?? null,
    actionedByName:  r.actionedBy?.name ?? null,
    actionedAt:      r.actionedAt ? r.actionedAt.toISOString() : null,
  }));

  return (
    <div className="min-w-0">
      <h1 className="page-heading mb-5">Inquiries Management</h1>
      <InquiriesClient initialInquiries={inquiries} />
    </div>
  );
}
