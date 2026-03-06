# CP System — User Flows & Use Cases

This document maps main user actions to flows. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for architecture and data models.

---

## 0. Public & Guest Flows (Landing Page)

*No login required. The landing page is the first screen visitors see.*

### 0.1 Visit landing page

1. Visitor opens the CP portal URL.
2. Sees **landing page** with:
   - **Welcome message** to CP.
   - **Member login** option (link/button to login).
   - **Information about CP** (purpose, workgroups, how the group operates).
   - **Featured past events** (selected past events with title, date, image, short description).
   - **Featured upcoming events** (selected upcoming events with title, date, venue).
   - **Contacts** (CP contact details).
   - **Join / Inquiry** option for guests who would like to join.

### 0.2 Member login (from landing page)

1. Clicks **Login** (or “Member login”).
2. Redirected to login page; enters email and password.
3. After successful login, taken to member area (e.g. Personal Dashboard).

### 0.3 Guest sends inquiry (would like to join)

1. Clicks **Join** or **Send inquiry** (or similar) on the landing page.
2. Fills form: **Name**, **Contact** (phone), **Email**, **Message** (any additional message).
3. Submits. System saves the inquiry (MembershipInquiry); optional confirmation message shown (e.g. “Thank you, we’ll be in touch”).
4. Officials can later view inquiries in an **Inquiries** list (e.g. under User Management or a dedicated Inquiries module) and follow up (contact, convert to member via Add Member).

---

## 1. Admin / Official Flows

*All logged-in users (admins and default members) use the **same application**; there is no separate admin vs member interface. The menu and actions shown depend on each user's **module assignments and permissions** — users with more modules see more menu items; default members see only Personal Dashboard, Group Wide Reports, Past Events, and Calendar/Upcoming Events (view only). Access to each flow below requires the relevant module and permission.*

### 1.1 Add New Member (Onboarding)

1. Admin opens **Members → Add Member**.
2. Fills: Name, Phone, Email, Sub-group, Mentor (dropdown of existing members).
3. Submits form.
4. System creates User + MemberProfile, generates temporary password, sends email with login link and “complete profile + change password” instructions.
5. Admin sees success message; new member appears in member list.

### 1.2 Import Paybill (Treasurer)

1. Admin opens **Finance → Import Paybill**.
2. Uploads CSV/Excel from Parish Secretary (monthly export).
3. System parses file (using configured column mapping), matches rows to members by phone (and optionally name).
4. System shows **preview**: suggested allocations (CP-KITTY vs CP-Welfare), unmatched rows, duplicates.
5. Treasurer reviews, corrects if needed (e.g. assign unmatched to member manually or skip).
6. Treasurer clicks **Confirm import**. Balances and transactions are updated; audit log entry created.
7. Optional: trigger monthly report generation.

### 1.2a Add expense (Treasurer)

**Who can do this:** Users with **Finance** module and **Create** (or **Edit**) permission (e.g. treasurer).

1. Opens **Finance → Expenses** (or **Add expense**).
2. Fills: **Description**, **Amount**, **Date**, optionally **Category/Account** (e.g. CP-KITTY, Welfare, or general).
3. Saves. Expense is recorded and **featured in Group Wide Reports** (expenses summary and list by period/category).

### 1.2b Budget forecasting (Treasurer)

**Who can do this:** Users with **Finance** module and **Create** (or **Edit**) permission (e.g. treasurer).

1. Opens **Finance → Budget forecast** (or **Budget / Forecasts**).
2. Adds or edits **forecast** entries: **Period** (e.g. month, quarter, year), **Line item or category** (optional), **Forecast amount**, **Notes** (optional).
3. Saves. Forecast is stored and **featured in Group Wide Reports** (budget vs actual, projections). Members with Group Wide Reports (View) can see the forecasted budget alongside actuals and expenses.

### 1.3 Create Event

1. User with **Events** (Create) permission opens **Calendar** or **Events → Create**.
2. Fills:
   - **Title** (required)
   - **Theme** (optional)
   - **Description / Agenda** (optional)
   - **Date** (required)
   - **Start Time** (optional)
   - **Image banner** (optional)
   - **Workgroup assigned** (optional; sub-group)
   - **Contact Person** (optional; selected from **members list**)
   - Venue, reminder schedule as needed.
3. Saves. Event appears under **Calendar** if the date is in the future, or under **Past Events** if the date is in the past.

### 1.4 Manage Event Attendance

1. User opens **Events** (or Calendar / Past Events) and selects an event.
2. **Add attendees** is **only available when the event date is today or in the past**. For future-dated events, the add-attendee option is not shown.
3. For current or past events: sees event details and the **attendees list** (each row: attendee name + **Member** or **Guest**).
4. Clicks **Add attendee**:
   - **From members list:** Searches members, selects one; attendee is added and shown as **Member**.
   - **As guest:** Enters **full name(s)**; attendee is added and shown as **Guest**.
5. Attendance list always shows alongside each name whether the person is a **Member** or **Guest**.
6. Saves as needed. EventAttendance records created; attendance report and CP Score (for members only) updated.

### 1.5 Upload Past Event Report

1. Admin opens **Past Events** (or Event detail after event date).
2. Selects event, then **Add attachment**.
3. Uploads file (report, budget, attendance list) or pastes “Lessons learned”.
4. Saves. Content is searchable in Event repository.

### 1.6 View Reports

- **Finance:** Monthly summary (contributions, expenses, projections); member-level arrears list.
- **Attendance:** Per-member attendance count and % over period; list of events with counts.
- **CP Score / Top performers:** Dashboard widget or report showing scores and top N (per policy).

### 1.7 Compliance Run (Automated; Optional Manual Trigger)

- **Automatic:** Job runs on 1st of month; identifies members with ≥13 months arrears, sets status to Paused, sends exit message, removes from WhatsApp/Telegram.
- **Manual:** Admin can trigger “Run compliance check” to preview who would be affected (dry run) or to run exit process out-of-band.


### 1.8 User Management (Assign modules & permissions)

**Who can do this:** Users with **User Management** module and at least **Edit** (or **Create**) permission.

1. Opens **User Management** (or **Users**).
2. **User list:** Sees all users/members; can filter by status, sub-group; search by name/email.
3. **User detail:** Selects a user → views profile and **current module assignments** (module name + View/Create/Edit/Delete and optional Valid until).
4. **Assign module:** Clicks **Assign module** (or **Edit assignments**):
   - Chooses **module** (e.g. Finance, Events, Attendance, User Management, Reminders Configuration, Inquiries Management).
   - Checks **View**, **Create**, **Edit**, **Delete** as needed (e.g. Treasurer: all four for Finance; Moderator: View only for Finance).
   - For **Events** Create/Edit/Delete: optionally sets **Valid until** for temporary access.
5. Saves. User's access is updated; expired assignments (Valid until in the past) are ignored by the system.
6. **Revoke or reduce:** Removes a module assignment or unchecks permissions (e.g. change Treasurer to read-only Finance when they step down).
7. **New member default:** When a member is added (onboarding), system automatically grants **Personal Dashboard**, **Group Wide Reports**, **Past Events**, **Calendar/Upcoming Events**, **Downloads** — all **View only**. Any extra access (Finance, Events, Attendance, User Management, Reminders Configuration, Inquiries Management) is assigned here.

### 1.9 Transfer member workgroup (Membership register)

**Who can do this:** Users with permission to edit member profile (e.g. User Management or Membership module with Edit).

1. Opens **Membership register** (or **User Management** → user detail / **Members** → member).
2. Selects the member and edits their **workgroup** (sub-group): chooses a different workgroup from the list (Community Outreach, Team Building, Spiritual Development).
3. Saves. System updates the member's **current** workgroup and records the **audit trail**:
   - The previous workgroup assignment is closed with **EffectiveTo** = today (or transfer date).
   - A new history row is created for the new workgroup with **EffectiveFrom** = today and **EffectiveTo** = null (current).
4. The membership register (and any reports) can show **workgroup history** for a member: "From [date] to [date] in [workgroup]".

### 1.10 View / manage inquiries (Inquiries Management)

**Who can do this:** Users with **Inquiries Management** module and **View** (to see list) and **Edit** or **Create** (to add notes, update status, convert to member).

1. Opens **Inquiries Management** → **Inquiries list** (or **Inquiries**).
2. Sees list of guest inquiries: Name, Contact, Email, Message, SubmittedAt, Status (New / Contacted / Converted). Can **search** and **filter** (e.g. by status).
3. Selects an inquiry → can add **Notes**, update **Status**, or use **Convert to member** (opens Add Member with name, contact, email pre-filled; official completes sub-group, mentor, etc.).

### 1.11 Configure monthly reminders (Reminders Configuration)

**Who can do this:** Users with **Reminders Configuration** module and **Edit** permission.

1. Opens **Reminders Configuration** (or **Settings** → Reminders).
2. Sets **Send date:** Chooses which **day of the month** the monthly reminder is sent (e.g. 5th of every month).
3. Sets **Channels:** Enables or disables **Email** and **WhatsApp** for the reminder.
4. Optionally edits intro/template text (e.g. greeting, sign-off) with placeholders for member name, arrears, events.
5. Saves. The monthly job will run on the configured day and send each member a **personalized** reminder containing:
   - Their **personal arrears** (summary of what is due/overdue).
   - **Upcoming events that month** (title, date, venue or link).
   - **Snapshot of events done the past month** and a line **encouraging members to check out the event reports** in Past Events.

### 1.12 Manage download documents (Downloads)

**Who can do this:** Users with **Downloads** module and **Create** or **Edit** (or **Delete**) permission.

1. Opens **Downloads** → **Manage documents** (or admin view of document list).
2. **Add document:** Uploads file, sets **Title** (e.g. "CP Constitution"), optional **Description** and **Category** (e.g. Constitution, Guidelines, Documentation). Saves; document appears in the member-facing list.
3. **Edit document:** Selects a document → updates title, description, or replaces the file.
4. **Remove document:** Removes from list (or deactivates) so it no longer appears for members.

---

## 2. Member Flows

### 2.1 First Login (After Onboarding)

1. Member receives email with temporary password and link.
2. Clicks link (or opens portal), logs in with email + temporary password.
3. System prompts **Complete profile** (e.g. preferred name, phone confirm) and **Change password**.
4. After saving, member is taken to Member dashboard.

### 2.2 View Dashboard (Personal Dashboard)

1. Member logs in → sees **Personal Dashboard**.
2. Dashboard shows:
   - **Mentor** (name or “None” if no mentor).
   - **List of mentees** (if any).
   - **Month and year joined CP**, with **years in CP in brackets** (e.g. “Joined March 2024 (2 years in CP)”).
   - **High-level summary:** CP kitty compliance, welfare (compliance), activity attendance index, CP score.
   - Optional: upcoming events, links to full contribution/attendance detail.

### 2.3 Update Profile

1. Member opens **Profile** or **Account**.
2. Updates preferred name, phone (optional), password.
3. Saves. Changes reflected in dashboard and admin views.

### 2.4 View / download documents (Downloads)

1. Member opens **Downloads** (or **Document list**).
2. Sees list of available documents (e.g. CP Constitution, Mentorship Guidelines, Web Portal Documentation), with title and optional description.
3. Clicks **View** or **Download** on a document to open or save the file.

---

## 3. System (Background) Flows

### 3.1 Arrears Reminder (Weekly/Monthly)

1. Job runs on schedule (e.g. every Monday or 1st of month).
2. For each member with arrears: load template, fill placeholders (name, arrears breakdown).
3. Send email (and optionally WhatsApp). Log in NotificationLog.

### 3.2 Event Reminders (7 days / 1 day before)

1. Daily job checks events with ReminderDays configured.
2. For each event where “7 days before” or “1 day before” is today: send reminder to all members (or to sub-group) with event details and link.
3. Log sends in NotificationLog.

### 3.3 Compliance & Exit (1st of month)

1. Job runs on 1st of month.
2. For each member: compute months in arrears (from FinancialAccount/Transaction data).
3. If ≥13 months: set status Paused, send exit template message, call WhatsApp/Telegram API to remove from group (or add to removal list for manual action).
4. Record run in ComplianceRun with counts and log.

### 3.4 CP Score Refresh (e.g. Monthly)

1. After payment import and attendance updates, or on schedule (e.g. end of month).
2. For each member: compute attendance %, financial compliance %, mentorship/participation component.
3. Store CP Score; update "top performers" for dashboard.

### 3.5 Monthly member reminder (configurable day of month)

1. **Scheduled job** runs on the **configured day of the month** (from Reminders Configuration, e.g. 5th).
2. For each **active member**: build **personalized** content: **personal arrears**, **upcoming events that month**, **snapshot of events done the past month** + encouragement to check event reports in Past Events.
3. Send via **Email** and/or **WhatsApp** according to MonthlyReminderConfig.
4. Log each send in NotificationLog.

---

## 4. Cross-Reference to Design

| Flow | Design section |
|------|----------------|
| Landing page: welcome, login, inquiry, about CP, featured events, contacts | §4.0 Landing Page |
| Add Member, First Login | §4.1 Membership & Onboarding |
| Import Paybill, Add expense, Budget forecasting, View finance reports | §4.2 Financial Management; §5.1 Expense, BudgetForecast |
| Group Wide Reports: expenses records, forecasted budget (budget vs actual) | §4.2 Group-wide reports; §3.2 Group Wide Reports module |
| Create event, Manage attendance (add member/guest), Attendance report | §4.3–4.4 Attendance & Events |
| Create event, Reminders, Past event upload | §4.4–4.5 Events & Knowledge |
| Configure monthly reminders (date of month, email/WhatsApp); reminder content: arrears, upcoming events, past month snapshot | §4.6 Reminders Configuration; §5.2 MonthlyReminderConfig |
| Arrears reminder, Compliance & exit | §4.7–4.8 Communication & Compliance |
| CP Score, Top performers | §4.9 CP Score & Ranking |
| User Management: assign/revoke modules & permissions, temporary Events | §3 Roles & Permissions; §4.10 User Management |
| Transfer member workgroup; workgroup history audit trail | §4.1 Membership & Sub-Groups; §5.1 MemberWorkgroupHistory |
| Inquiries Management: view list, search/filter, add notes, update status, convert to member | §4.12 Inquiries Management; §4.0 Landing Page; §5.1 MembershipInquiry |
| Downloads: view/download documents; manage document list (add/edit/remove) | §4.11 Downloads; §5.1 DownloadableDocument |
