import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MembershipPage() {
  const members = await prisma.user.findMany({
    where: { memberProfile: { isNot: null } },
    include: {
      memberProfile: {
        include: {
          workgroup: true,
          mentor: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="min-w-0">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-heading mb-0">Membership</h1>
        <Link
          href="/app/membership/new"
          className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 sm:px-5"
        >
          Add new member
        </Link>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 font-semibold text-slate-700">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Phone</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Workgroup</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Mentor</th>
                <th className="px-4 py-3 font-semibold text-slate-700">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No members yet. Click &quot;Add new member&quot; to add one.
                  </td>
                </tr>
              ) : (
                members.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50 last:border-b-0"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-slate-600">{user.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.memberProfile?.workgroup?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.memberProfile?.mentor?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.memberProfile?.joinDate
                        ? new Date(user.memberProfile.joinDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
