# Requirements Traceability Matrix

Mapping from the Digitization Committee requirements to the design document.

| # | Committee requirement | Design section | Notes |
|---|------------------------|----------------|-------|
| **A. Financial & Attendance Tracking** |
| A1 | Automatic syncing of finance transactions: Treasurer uploads monthly paybill export; system parses, matches phone/name to members, updates CP-KITTY and CP-Welfare balances | §4.2 Financial Management; §5.1 Transaction, FinancialAccount | Configurable column mapping; match by phone (and optionally name); allocation by account/reference |
| A2 | Member Self-Service Portal: dashboard with total contributions, arrears, meeting attendance %, mentor/mentee | §4.2 (member view); §4.3 (attendance %); §4.1 (mentor); USER_FLOWS §2.2 | Single dashboard for members |
| A3 | Group-Wide Analytics: anonymized dashboard — financial health, budget projections, sub-group performance | §4.2 (group-wide Admin); §7 (privacy) | Admin view; anonymized by default |
| A4 | Attendance Module: officials mark via checklist or send event link for self-register | §4.3 Attendance Tracking; USER_FLOWS §1.3, §2.3 | Both checklist and link supported |
| **B. Automated Communication & Enforcement** |
| B1 | Automated weekly/monthly checks; trigger Email and WhatsApp with exact payment arrears and upcoming events | §4.6 Communication; §4.2 (arrears); §4.4 (event reminders); USER_FLOWS §3.1, §3.2 | Template-based; configurable schedule |
| B2 | De-personalized group removals: WhatsApp Business API or Telegram; on 1st of month, if 13 months arrears → polite exit message + programmatic removal from chat | §4.7 Compliance & De-personalized Exit; USER_FLOWS §3.3 | Standardized message; optional Telegram as alternative |
| **C. Knowledge Management & Scheduling** |
| C1 | Event Repository: “Past Events” — sub-group uploads post-event report, budget, attendance list, lessons learned; searchable | §4.5 Knowledge Management — Past Events; §5.1 PastEventAttachment | Search by date, sub-group, type, text |
| C2 | Dynamic Calendar: annual calendar; schedule events, assign coordinating sub-group, primary contacts | §4.4 Events & Calendar; §5.1 Event | Calendar + event CRUD |
| C3 | Custom Reminders: when creating event, select reminder frequency (e.g. 7 days before, 1 day before); system sends automatically | §4.4 (Reminders); USER_FLOWS §3.2 | Stored per event; job sends on due date |
| **D. Member Onboarding & Ranking** |
| D1 | Admin Onboarding: “Add Member” form; system generates temporary password, emails with link to complete profile and change password | §4.1 (Onboarding); USER_FLOWS §1.1, §2.1 | Email with temp password + link |
| D2 | Performance Algorithm: “CP Score” — Meeting/Activity Attendance 50%, Financial Compliance 40%, Mentorship/Sub-group 10% | §4.8 CP Score & Ranking; §5.1 (score computation) | Weights configurable |
| D3 | Top performers automatically highlighted on monthly group-wide dashboard | §4.8; §4.2 (group dashboard) | Optional anonymization per policy |
| **Cross-cutting** |
| — | Cloud-Based Web Portal (desktop and mobile browsers) | §2.1 Architecture; §2.2 (mobile-friendly, PWA optional) | Responsive; optional PWA |
| — | Role-Based Access Control (Admin vs Member views) | §3 User Roles & Access Control; §2.2 (RBAC) | Super Admin, Admin, Member |

All stated committee requirements are covered in the design. Open decisions (e.g. WhatsApp vs Telegram, naming of Paused/Exited, visibility of top performer names) are in DESIGN_SYSTEM.md §10 Appendix B.
