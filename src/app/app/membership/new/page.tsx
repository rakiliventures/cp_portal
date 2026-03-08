import Link from "next/link";

export default function NewMemberPage() {
  return (
    <div className="min-w-0">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/app/membership"
          className="rounded-lg text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          ← Back to list
        </Link>
      </div>
      <h1 className="page-heading">Add new member</h1>
      <div className="card">
        <p className="text-sm text-slate-600 sm:text-base">
          Add member form (name, email, phone, workgroup, mentor) will go here. On submit, the system
          will create the user, member profile, workgroup history, and default module assignments; optional:
          generate temporary password and send email.
        </p>
      </div>
    </div>
  );
}
