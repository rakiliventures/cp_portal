# Catholic Professional (CP) Management System — Design Document

**Version:** 1.0  
**Date:** March 2026  
**Purpose:** Design specification for a cloud-based web portal to manage CP membership, finances, attendance, events, and communication.

---

## 1. Executive Summary

The Catholic Professional group requires a **cloud-based web portal** with **role-based access** (Admin vs Member) to:

- **Automate** manual treasurer workflows (payment validation, reporting).
- **Track** meeting/activity attendance (currently missing).
- **Improve transparency** via member dashboards and group-wide analytics.
- **Enforce compliance** through automated reminders and system-driven exit rules (13 months arrears).
- **Preserve knowledge** via an event repository and dynamic calendar.

This document defines the system architecture, data models, user flows, and implementation approach to meet these objectives.

---

## 2. System Overview & Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CP Management System (Cloud)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Web Portal (SPA)     │  Backend API        │  Jobs / Workers               │
│  • Admin UI           │  • REST/GraphQL     │  • Paybill import parser       │
│  • Member Portal      │  • Auth (JWT/OAuth) │  • Reminder (email/WhatsApp)   │
│  • Responsive (PWA)   │  • RBAC             │  • Compliance check (monthly)  │
│                       │  • File storage     │  • Event reminders             │
└─────────────────────────────────────────────────────────────────────────────┘
         │                         │                          │
         ▼                         ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Integrations: Parish Paybill Export │ Email (SMTP/SendGrid) │ WhatsApp API  │
│  Optional: Telegram Bot (group/channel management)                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Design Principles

- **Cloud-first:** Hosted on a reliable cloud provider (e.g. AWS, GCP, or Azure) for availability and backups.
- **Role-based access:** Strict separation between Admin (officials/treasurer) and Member views and APIs.
- **Mobile-friendly:** Responsive web app (and optional PWA) for marking attendance and checking balances on phones.
- **Audit trail:** Log sensitive actions (payment imports, member status changes, removals) for transparency.
- **De-personalized enforcement:** Compliance and exit rules are system-driven; messages are standardized templates.

---

## 3. User Roles & Access Control

| Role | Description | Key Capabilities |
|------|-------------|------------------|
| **Super Admin** | System/committee lead | Full access: users, roles, system config, all modules. |
| **Admin / Official** | CP officials, treasurer | Add/edit members, upload paybill, mark attendance, manage events, view all reports, run compliance. |
| **Member** | CP member | View own dashboard (contributions, arrears, attendance %, mentor/mentee), update profile, self-register attendance when link is shared. |

- **Authentication:** Email + password; optional SSO (e.g. Google) later.
- **Authorization:** RBAC enforced in API and UI (e.g. Admin-only routes and menu items hidden from Members).
- **Mentor:** No separate role; any member can be designated as mentor for one or more mentees (visible in Member view).

---

## 4. Core Modules

### 4.1 Membership & Sub-Groups

- **Sub-groups (fixed):** Community Outreach, Team Building, Spiritual Development.
- **Member record:** Name, phone, email, sub-group, join date, status (Active / Paused / Exited), mentor (FK to Member).
- **Onboarding (Admin):** “Add Member” form: name, phone, email, sub-group, mentor. On submit:
  - System creates account with **temporary password** (random, secure).
  - Sends **email** with login link and instruction to complete profile and change password.
  - Member appears in member list and in treasurer/attendance views immediately.

### 4.2 Financial Management

- **Fee structure (configurable in system):**
  - **Annual fee:** 1,000 (per membership year).
  - **Monthly CP subscription:** 300.
  - **Monthly welfare:** 300.
- **Payment sources:** Members pay via **church paybill**; they use payment account **CP-KITTY** or **CP-Welfare** (and optionally reference in message).
- **Workflow:**
  1. Parish Secretary provides **monthly paybill export** (CSV/Excel).
  2. Treasurer **uploads** file in Admin → Finance → “Import Paybill”.
  3. System **parses** file (configurable column mapping: phone, amount, date, account/reference).
  4. **Matching:** Match by phone number (and optionally name) to members; allocate to CP-KITTY or CP-Welfare based on account/reference.
  5. **Validation:** Treasurer can review suggested matches (and fix/cancel) before **confirming** import. Balances update only after confirm.
  6. **Audit:** Each import is logged (who, when, file name, row count, applied transactions).

- **Member view:** Dashboard shows:
  - Total contributions (CP-KITTY and CP-Welfare), year-to-date and all-time.
  - **Arrears:** Expected vs paid for annual fee, monthly subscription, monthly welfare (with clear breakdown and due dates).
- **Group-wide (Admin):** High-level, **anonymized** dashboard: total kitty/welfare, budget vs actual, projections; optional breakdown by sub-group (aggregated, no individual names in default view).

### 4.3 Attendance Tracking

- **Entities:** **Events** (meetings/activities) and **Event attendance** (member + event + status).
- **Ways to record attendance:**
  1. **Officials mark attendance:** During or after the event, Admin opens the event and uses a **checklist** (list of members with checkboxes) to mark present/absent.
  2. **Self-registration:** Admin creates event and can enable “attendance link”. System generates a short link; members open it and click “I attended” (authenticated or token-based). System records one attendance per member per event.
- **Reporting:** Pre-built report: “Members’ attendance” (e.g. per member: count of events attended vs total in period, and **attendance %**). Used for CP Score and for treasurer/official reports.
- **Member view:** “My attendance %” (e.g. last 12 months or current year) and list of attended events.

### 4.4 Events & Calendar

- **Dynamic calendar:** Annual (and monthly) view. Admin can:
  - Create **event** (title, date/time, venue, description).
  - Assign **coordinating sub-group** and **primary contact(s)** (members).
  - Set **reminder schedule** (e.g. “7 days before” and “1 day before”).
- **Reminders:** Background job runs daily; for each event with upcoming reminder date, sends email (and optionally WhatsApp) to members with event details and link (e.g. to event page or attendance link).
- **Event types:** Can be tagged (e.g. “Monthly meeting”, “Activity”, “Retreat”) for filtering and reporting.

### 4.5 Knowledge Management — Past Events

- **Event repository (“Past Events”):** After an event, the organizing sub-group (or Admin) can attach:
  - **Post-event report** (document/PDF).
  - **Budget** (summary or file).
  - **Attendance list** (export or manual upload for historical events).
  - **Lessons learned** (text or document).
- **Search:** Search by date range, sub-group, event type, or free text (title, lessons learned). Accessible to Admin (and optionally to Members as read-only “archive”).

### 4.6 Communication & Notifications

- **Channels:** Email (primary), WhatsApp (optional, via WhatsApp Business API).
- **Automated reminders (financial):**
  - **Weekly or monthly job** (configurable): Identifies members with **arrears** (e.g. overdue annual fee or missing monthly payments).
  - Sends **personalized** message: “Dear [Name], your current arrears: [breakdown]. Please pay via church paybill to CP-KITTY / CP-Welfare as applicable.”
- **Event reminders:** As in §4.4 (e.g. 7 days and 1 day before).
- **Templates:** All outgoing messages use **templates** (with placeholders for name, arrears, event title, etc.) so wording is consistent and can be reviewed by committee.

### 4.7 Compliance & De-personalized Exit

- **Rule:** If a member has **13 months of arrears** (or equivalent rule as defined by CP), membership is **paused** and they are removed from the group chat.
- **Process (automated, 1st of each month):**
  1. **Compliance job** runs: For each member, compute months in arrears (based on financial module).
  2. If arrears ≥ 13 months:
     - Set member status to **Paused** (or Exited, per policy).
     - Send **standardized exit message** (e.g. “Dear [Name], your CP membership is currently paused due to inactivity [and arrears]. If you wish to rejoin, please contact [contact].”).
     - **Remove from WhatsApp group** via WhatsApp Business API, **or** if using **Telegram**, remove from group / restrict in channel via bot (Telegram allows robust bot management).
- **Human element removed:** The “blame” is on system rules; officials only configure the threshold (e.g. 13 months) and the message template.
- **Re-join:** Manual process (Admin reactivates member and re-adds to chat after they clear arrears and request re-join).

### 4.8 CP Score & Ranking

- **Formula (configurable weights):**
  - **Meeting/activity attendance:** 50%.
  - **Financial compliance:** 40%.
  - **Mentorship / sub-group participation:** 10%.
- **Implementation:**
  - **Attendance component:** % of events attended in the scoring period (e.g. last 12 months).
  - **Financial component:** % of expected payments made (annual + monthly CP + welfare) in the period.
  - **Mentorship/participation:** Binary or tier (e.g. has mentee(s), participated in organizing an event) — simple rules to be defined by CP.
- **Output:** Per-member **CP Score** (e.g. 0–100). **Top performers** (e.g. top 10 or top 20%) can be **highlighted** on the monthly group-wide dashboard (optional anonymization: “Top contributors this month” with or without names, per CP policy).
- **Refresh:** Score computed periodically (e.g. monthly, after payment import and attendance updates).

---

## 5. Data Models (Conceptual)

### 5.1 Core Entities

- **User**  
  Id, Email, PasswordHash, Name, Phone, Role, Status (Active/Paused/Exited), CreatedAt, UpdatedAt.

- **MemberProfile** (1:1 User when role=Member)  
  UserId, SubGroupId, JoinDate, MentorId (FK User), PreferredName.

- **SubGroup**  
  Id, Name (Community Outreach | Team Building | Spiritual Development), Description.

- **FinancialAccount**  
  Id, MemberId, Type (AnnualFee | CPKitty | Welfare), YearOrMonth, AmountExpected, AmountPaid, DueDate, UpdatedAt.

- **Transaction** (from paybill import)  
  Id, MemberId, AccountType (CP-KITTY | CP-Welfare), Amount, TransactionDate, SourceFileId, ImportBatchId, CreatedAt.

- **Event**  
  Id, Title, Description, StartDateTime, EndDateTime, Venue, CoordinatingSubGroupId, PrimaryContactIds (JSON or link table), ReminderDays (e.g. [7,1]), AttendanceLinkEnabled, CreatedBy, CreatedAt.

- **EventAttendance**  
  Id, EventId, MemberId, Source (OfficialChecklist | SelfRegister), RecordedAt.

- **PastEventAttachment**  
  Id, EventId, Type (Report | Budget | AttendanceList | LessonsLearned), FileUrlOrText, UploadedBy, UploadedAt.

- **NotificationLog**  
  Id, MemberId, Channel (Email | WhatsApp), TemplateId, SentAt, Payload (e.g. arrears breakdown).

- **ComplianceRun**  
  Id, RunAt, MembersChecked, MembersPaused, MembersRemovedFromChat, Log (JSON).

### 5.2 Configuration Tables

- **SystemConfig:** Fee amounts, arrears threshold (months), reminder frequency, WhatsApp/Telegram toggle.
- **MessageTemplates:** Name, Channel, Body, Placeholders (e.g. {{MemberName}}, {{ArrearsBreakdown}}).
- **PaybillImportMapping:** Column names for phone, amount, date, account/reference for the parish export format.

### 5.3 Entity Relationship (Mermaid)

```mermaid
erDiagram
    User ||--o| MemberProfile : has
    User ||--o{ MemberProfile : "mentor of"
    MemberProfile }o--|| SubGroup : belongs to
    SubGroup ||--o{ Event : "coordinates"
    User ||--o{ Transaction : "receives"
    User ||--o{ EventAttendance : "has"
    Event ||--o{ EventAttendance : "has"
    Event ||--o{ PastEventAttachment : "has"
    User {
        uuid Id PK
        string Email
        string Role
        string Status
    }
    MemberProfile {
        uuid UserId PK,FK
        uuid SubGroupId FK
        uuid MentorId FK
        date JoinDate
    }
    SubGroup {
        uuid Id PK
        string Name
    }
    Event {
        uuid Id PK
        uuid CoordinatingSubGroupId FK
        datetime StartDateTime
        string ReminderDays
    }
    Transaction {
        uuid Id PK
        uuid MemberId FK
        string AccountType
        decimal Amount
        date TransactionDate
    }
    EventAttendance {
        uuid Id PK
        uuid EventId FK
        uuid MemberId FK
        string Source
    }
```

---

## 6. Integration Points

| Integration | Purpose | Notes |
|-------------|---------|--------|
| **Parish paybill export** | Upload CSV/Excel; parse and match to members | Configurable column mapping; optional validation rules (min amount, date range). |
| **Email (SMTP / SendGrid)** | Onboarding, reminders, event reminders, exit messages | Template-based; track opens/clicks optional. |
| **WhatsApp Business API** | Reminders, exit message; remove from group | Requires Business API approval; consider fallback to “manual removal list” if API limits. |
| **Telegram Bot** | Alternative to WhatsApp for group management | Native bot controls for remove/restrict; group or channel. |

---

## 7. Security & Compliance

- **Data:** Personal data (name, phone, email) stored securely; access only per role. Consider encryption at rest and in transit (HTTPS, encrypted DB).
- **Passwords:** Temporary passwords are one-time; force change on first login. Use strong hashing (e.g. bcrypt/argon2).
- **Audit:** Log payment imports, status changes, removals, and Admin actions for accountability.
- **Privacy:** Group-wide analytics anonymized; CP Score and “top performers” visibility configurable (e.g. names only to Admin, or agreed with members).
- **Backups:** Regular automated backups of database and uploaded files; retention per church policy.

---

## 8. Implementation Roadmap (Phased)

| Phase | Scope | Outcomes |
|-------|--------|----------|
| **1. Foundation** | Auth, RBAC, Member CRUD, Sub-groups, Mentor assignment, Add Member + email temp password | Officials can onboard members; members can log in and see profile. |
| **2. Finance** | Fee config, paybill upload, parsing, matching, approval, balances & arrears; member dashboard (contributions + arrears); treasurer report | Treasurer stops manual tracking; members see their position. |
| **3. Attendance & Events** | Events CRUD, calendar, checklist + optional self-register link; attendance report; event reminders | Attendance tracked and reported; event reminders automated. |
| **4. Knowledge & CP Score** | Past event attachments, search; CP Score algorithm, top performers on dashboard | Knowledge retained; recognition automated. |
| **5. Compliance & Comms** | Arrears reminder job; 13-month rule; exit message; WhatsApp/Telegram removal (or removal list); optional Telegram migration | De-personalized enforcement; reduced friction. |

---

## 9. Success Criteria

- Treasurer can **import paybill** and have member balances/arrears updated with minimal manual work.
- **Attendance** is captured for all relevant meetings/activities and reflected in reports and CP Score.
- **Members** see a single place for contributions, arrears, attendance %, and mentor/mentee.
- **Reminders** and **exit process** run on schedule without officials having to send or remove people manually.
- **Past events** are searchable; **calendar** and **reminders** support planning and follow-up.
- **CP Score** and **top performers** are visible per agreed policy, supporting recognition and culture.

---

## 10. Appendix

### A. Glossary

- **CP-KITTY:** Paybill account for CP subscription (and optionally annual fee).
- **CP-Welfare:** Paybill account for welfare contributions.
- **Arrears:** Amount or months of unpaid expected fees/subscriptions/welfare.
- **Paused:** Member status when removed due to arrears; can be reactivated after clearing arrears.

### B. Open Decisions

- Naming of “Paused” vs “Exited” and re-join process.
- Whether to show member names on group-wide “top performers” or keep anonymized.
- WhatsApp vs Telegram for group and removal (cost, approval, and church preference).
- Exact paybill export format(s) from Parish Secretary (to define default column mapping).

### C. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Mar 2026 | Design | Initial design covering all CP Digitization Committee requirements. |

---

*This design is intended to be implemented as a cloud-based web application with a responsive frontend and a secure backend API, plus scheduled jobs for reminders and compliance. Adjustments to fees, thresholds, and messaging are expected to be configurable by Admins where possible.*
