# CP System — User Flows & Use Cases

This document maps main user actions to flows. See [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for architecture and data models.

---

## 1. Admin / Official Flows

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

### 1.3 Mark Event Attendance (Checklist)

1. Admin opens **Events → [Event]** (or Calendar → event).
2. Clicks **Mark attendance**.
3. Sees checklist of all active members; checks “Present” for those who attended.
4. Saves. EventAttendance records created/updated; attendance report and CP Score inputs updated.

### 1.4 Create Event & Reminders

1. Admin opens **Calendar** or **Events → Create**.
2. Fills: Title, Date/Time, Venue, Description, Coordinating sub-group, Primary contact(s).
3. Optionally enables **Attendance link** (for self-registration).
4. Sets **Reminders**: e.g. “7 days before” and “1 day before”.
5. Saves. Event appears on calendar; reminder job will send emails/WhatsApp at configured times.

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

---

## 2. Member Flows

### 2.1 First Login (After Onboarding)

1. Member receives email with temporary password and link.
2. Clicks link (or opens portal), logs in with email + temporary password.
3. System prompts **Complete profile** (e.g. preferred name, phone confirm) and **Change password**.
4. After saving, member is taken to Member dashboard.

### 2.2 View Dashboard

1. Member logs in → sees **Member dashboard**.
2. Dashboard shows: Total contributions (CP-KITTY, CP-Welfare), **Arrears** (breakdown and due dates), **Attendance %** (e.g. last 12 months), **Mentor** and **Mentees** (if any), upcoming events.

### 2.3 Self-Register Attendance

1. Member receives event link (from reminder or WhatsApp).
2. Clicks link → opens event page (or short attendance form).
3. Clicks **I attended** (or similar). System records EventAttendance with source “SelfRegister”.
4. Sees confirmation; attendance % updates after next refresh/calculation.

### 2.4 Update Profile

1. Member opens **Profile** or **Account**.
2. Updates preferred name, phone (optional), password.
3. Saves. Changes reflected in dashboard and admin views.

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
3. Store CP Score; update “top performers” for dashboard.

---

## 4. Cross-Reference to Design

| Flow | Design section |
|------|----------------|
| Add Member, First Login | §4.1 Membership & Onboarding |
| Import Paybill, View finance reports | §4.2 Financial Management |
| Mark attendance, Self-register, Attendance report | §4.3 Attendance Tracking |
| Create event, Reminders, Past event upload | §4.4–4.5 Events & Knowledge |
| Arrears reminder, Compliance & exit | §4.6–4.7 Communication & Compliance |
| CP Score, Top performers | §4.8 CP Score & Ranking |
