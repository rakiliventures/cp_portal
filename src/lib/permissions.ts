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
  PAYMENT_ACCOUNTS: "PaymentAccounts",
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

export type MenuItem =
  | { type: "item"; code: string; label: string; href: string }
  | {
      type: "group";
      label: string;
      children: Array<{ code: string; label: string; href: string }>;
    };

export function getMenuModules(modules: ModuleAssignment[] | undefined, isSuperAdmin: boolean): MenuItem[] {
  const hasAccess = (code: string) => canAccessModule(modules, isSuperAdmin, code, "view");

  const dashboardChildren = [
    { code: MODULE_CODES.PERSONAL_DASHBOARD, label: "My Dashboard", href: "/app/dashboard" },
    { code: MODULE_CODES.GROUP_WIDE_REPORTS, label: "Group Dashboard", href: "/app/reports" },
  ].filter((c) => hasAccess(c.code));

  const items: MenuItem[] = [];

  if (dashboardChildren.length > 0) {
    items.push({ type: "group", label: "Dashboard", children: dashboardChildren });
  }

  const financeChildren = [
    { code: MODULE_CODES.PERSONAL_DASHBOARD, label: "My Payments",             href: "/app/finance/my-payments" },
    { code: MODULE_CODES.PERSONAL_DASHBOARD, label: "My Statement",             href: "/app/finance/my-statement" },
    { code: MODULE_CODES.FINANCE,            label: "All Payments",             href: "/app/finance/payments" },
    { code: MODULE_CODES.FINANCE,            label: "CP Kitty Summary Report",  href: "/app/finance/cp-kitty-report" },
    { code: MODULE_CODES.FINANCE,            label: "Welfare Summary Report",   href: "/app/finance/welfare-report" },
    { code: MODULE_CODES.FINANCE,            label: "Budget",                   href: "/app/finance/budget" },
    { code: MODULE_CODES.FINANCE,            label: "Expenses",                 href: "/app/finance/expenses" },
  ].filter((c) => hasAccess(c.code));

  if (financeChildren.length > 0) {
    items.push({ type: "group", label: "Finance", children: financeChildren });
  }

  const settingsChildren = [
    { code: MODULE_CODES.NOTIFICATIONS_SETTINGS, label: "Notifications Settings", href: "/app/notifications-settings" },
    { code: MODULE_CODES.USER_MANAGEMENT, label: "User Management", href: "/app/user-management" },
    { code: MODULE_CODES.PAYMENT_ACCOUNTS, label: "Payment Accounts", href: "/app/payment-accounts" },
  ].filter((c) => hasAccess(c.code));

  if (settingsChildren.length > 0) {
    items.push({ type: "group", label: "Settings", children: settingsChildren });
  }

  if (hasAccess(MODULE_CODES.EVENTS) || hasAccess(MODULE_CODES.CALENDAR) || hasAccess(MODULE_CODES.PAST_EVENTS)) {
    items.push({
      type: "group",
      label: "Events",
      children: [
        { code: MODULE_CODES.EVENTS, label: "CP Events",    href: "/app/events/cp-events" },
        { code: MODULE_CODES.EVENTS, label: "MGM Meetings", href: "/app/events/mgm" },
        { code: MODULE_CODES.EVENTS, label: "Kachai",       href: "/app/events/kachai" },
      ],
    });
  }

  if (hasAccess(MODULE_CODES.MEMBERSHIP)) {
    items.push({
      type: "group",
      label: "Membership",
      children: [
        { code: MODULE_CODES.MEMBERSHIP, label: "Current Members",      href: "/app/membership/current" },
        { code: MODULE_CODES.MEMBERSHIP, label: "Deactivated Members",  href: "/app/membership/deactivated" },
      ],
    });
  }

  const rest: Array<{ code: string; label: string; href: string }> = [
    { code: MODULE_CODES.DOWNLOADS,            label: "Downloads",  href: "/app/downloads" },
    { code: MODULE_CODES.INQUIRIES_MANAGEMENT, label: "Inquiries",  href: "/app/inquiries" },
  ];

  rest.forEach((item) => {
    if (hasAccess(item.code)) items.push({ type: "item", ...item });
  });

  return items;
}
