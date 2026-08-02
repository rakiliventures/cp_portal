import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessModule, MODULE_CODES, type ModuleAssignment } from "@/lib/permissions";

export default async function NotificationsSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/app/notifications-settings");

  const isSuperAdmin = !!(session.user as { isSuperAdmin?: boolean }).isSuperAdmin;
  const modules = (session.user as { modules?: ModuleAssignment[] }).modules;
  if (!canAccessModule(modules, isSuperAdmin, MODULE_CODES.NOTIFICATIONS_SETTINGS, "view")) {
    redirect("/app/dashboard");
  }

  return (
    <div className="min-w-0">
      <h1 className="page-heading">Notifications Settings</h1>
      <div className="card">
        <p className="text-sm text-slate-600 sm:text-base">
          Configure monthly reminders: send date, email/WhatsApp channels, content (arrears,
          upcoming events, past month snapshot).
        </p>
      </div>
    </div>
  );
}
