export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { InquiriesClient, type Inquiry } from "./InquiriesClient";

export default async function InquiriesPage() {
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
