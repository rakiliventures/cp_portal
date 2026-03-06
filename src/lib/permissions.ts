/**
 * Module codes from design §3.7 - used for permission checks and menu visibility.
 */
export const MODULE_CODES = {
  PERSONAL_DASHBOARD: "PersonalDashboard",
  MEMBERSHIP: "Membership",
  FINANCE: "Finance",
  EVENTS: "Events",
  GROUP_WIDE_REPORTS: "GroupWideReports",
  DOWNLOADS: "Downloads",
  INQUIRIES_MANAGEMENT: "InquiriesManagement",
  NOTIFICATIONS_SETTINGS: "RemindersConfiguration",
  USER_MANAGEMENT: "UserManagement",
  PAST_EVENTS: "PastEvents",
  CALENDAR: "Calendar",
  ATTENDANCE: "Attendance",
} as const;

export type ModuleAssignment = {
  code: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  validUntil: string | null;
};

export function canAccessModule(
  modules: ModuleAssignment[] | undefined,
  isSuperAdmin: boolean,
  moduleCode: string,
  permission: "view" | "create" | "edit" | "delete"
): boolean {
  if (isSuperAdmin) return true;
  if (!modules?.length) return false;
  const assignment = modules.find(
    (m) => m.code === moduleCode && (!m.validUntil || new Date(m.validUntil) > new Date())
  );
  if (!assignment) return false;
  if (permission === "view") return assignment.canView;
  if (permission === "create") return assignment.canCreate;
  if (permission === "edit") return assignment.canEdit;
  if (permission === "delete") return assignment.canDelete;
  return false;
}

export function getMenuModules(modules: ModuleAssignment[] | undefined, isSuperAdmin: boolean) {
  const codes = [
    { code: MODULE_CODES.PERSONAL_DASHBOARD, label: "My Dashboard", href: "/app/dashboard" },
    { code: MODULE_CODES.MEMBERSHIP, label: "Membership", href: "/app/membership" },
    { code: MODULE_CODES.FINANCE, label: "Finance", href: "/app/finance" },
    { code: MODULE_CODES.EVENTS, label: "Events", href: "/app/events" },
    { code: MODULE_CODES.PAST_EVENTS, label: "Past Events", href: "/app/events?view=past" },
    { code: MODULE_CODES.CALENDAR, label: "Upcoming Events", href: "/app/events?view=upcoming" },
    { code: MODULE_CODES.GROUP_WIDE_REPORTS, label: "Group Wide Reports", href: "/app/reports" },
    { code: MODULE_CODES.DOWNLOADS, label: "Downloads", href: "/app/downloads" },
    { code: MODULE_CODES.INQUIRIES_MANAGEMENT, label: "Inquiries", href: "/app/inquiries" },
    { code: MODULE_CODES.NOTIFICATIONS_SETTINGS, label: "Notifications Settings", href: "/app/notifications-settings" },
    { code: MODULE_CODES.USER_MANAGEMENT, label: "User Management", href: "/app/user-management" },
  ];
  return codes.filter((item) => canAccessModule(modules, isSuperAdmin, item.code, "view"));
}
