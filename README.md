# Catholic Professional (CP) Management System

A cloud-based web portal for the Catholic Professional group: membership, finances, attendance, events, and communication.

## Documentation

| Document | Purpose |
|----------|---------|
| **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** | Full design: architecture, roles, modules, data models, security, implementation roadmap |
| **[docs/HOSTING_AND_STACK.md](docs/HOSTING_AND_STACK.md)** | **Free-tier hosting:** recommended stack (Next.js, PostgreSQL), platforms (Vercel, Supabase, cron, email) |
| **[docs/USER_FLOWS.md](docs/USER_FLOWS.md)** | User flows and use cases for Admin and Member actions |
| **[docs/REQUIREMENTS_MATRIX.md](docs/REQUIREMENTS_MATRIX.md)** | Traceability: committee requirements → design sections |

## Application structure (modules & sub-modules)

- **Personal Dashboard (My Dashboard)** — own dashboard (view only).
- **Membership** — Add New Member; View List of All Members (search, filter, select member → transfer workgroup or assign mentor).
- **Finance** — Expenses; Budget; Payments.
- **Events** — Events Summary (+ add event); Past Events Listing (search, filter, select → amend); Upcoming Events (select, filter).
- **Group Wide Reports (View Only)** — Group dashboard, Budget report, Payments report, Expenses report, Membership report (all with filter and export).
- **Downloads** — List of documents members can view/download (e.g. CP Constitution, Mentorship Guidelines, Web Portal Documentation).
- **Inquiries Management** — List of guest inquiries (from landing page); search, filter, add notes, update status, convert to member.
- **Notifications Settings** — configure monthly reminder (date, email/WhatsApp).
- **User Management** — manage users and module/permission assignments.

Full hierarchy: **docs/DESIGN_SYSTEM.md** §3.7.

## Summary of the Solution

- **Single interface:** Admins and default members use the **same app** after login; the menu and actions shown depend on each user's module assignments and permissions (admins see more menu items).
- **Modules & permissions:** Granular access per module (view, edit, create, delete). Treasurer = Finance (full); Moderator = Finance (read-only). Default member: Personal Dashboard, Group Wide Reports, Past Events, Calendar/Upcoming Events (view only). Events create/edit/delete can be assigned **temporarily** (with expiry).  
- **User Management:** Assign or revoke modules and permissions for users; new members get the four default view-only modules automatically.  
- **Finance:** Upload paybill export, **add expenses**, **budget forecasting**; CP-KITTY / CP-Welfare balances and arrears; member self-service dashboard. **Expenses** and **forecasted budget** are featured in **Group Wide Reports** (budget vs actual, projections).  
- **Attendance:** Add attendees per event (member or guest); list shows Member/Guest per row; reports and CP Score input  
- **Events:** Calendar, reminders (e.g. 7 days / 1 day before), past-event repository (reports, lessons learned)  
- **Reminders Configuration:** Admin sets the **day of the month** the monthly reminder is sent; content includes each member's **personal arrears**, **upcoming events that month**, and **past month events snapshot** with encouragement to check event reports (email + WhatsApp).
- **Compliance:** Automated arrears reminders; 13-month rule → standardized exit message + removal from WhatsApp/Telegram  
- **CP Score:** 50% attendance, 40% financial, 10% mentorship; top performers on dashboard  

## Hosting (free tier)

See **[docs/HOSTING_AND_STACK.md](docs/HOSTING_AND_STACK.md)** for a recommended **free** setup: **Vercel** (app) + **Supabase** (PostgreSQL, auth, storage) + **cron-job.org** (scheduled tasks) + **Resend/SendGrid** (email). Alternative options (Render, Neon, etc.) are included.

## Building and running the app

The app uses the recommended stack: **Next.js 14**, **Prisma**, **PostgreSQL**, **NextAuth.js**.

1. **Prerequisites:** Node.js 18+, PostgreSQL (local or Supabase/Neon).
2. **Install:** `npm install`
3. **Environment:** Copy `.env.example` to `.env` and set `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`.
4. **Database:** `npx prisma db push` (or `npx prisma migrate dev`), then `npm run db:seed` to seed modules and optional demo users.
5. **Run:** `npm run dev` — open [http://localhost:3000](http://localhost:3000). Landing page and login at `/login`; after login you are redirected to `/app/dashboard`. Menu items are permission-driven (default member sees Dashboard, Reports, Past Events, Calendar, Downloads).

Demo users (if seed ran with defaults): `admin@cp.local` / `ChangeMe123!` (super-admin), `member@cp.local` / `Member123!` (view-only modules).

## Next Steps

1. Review design and requirements matrix with the Digitization Committee.  
2. Confirm open decisions (see DESIGN_SYSTEM.md §10 Appendix B).  
3. Choose stack and hosting from HOSTING_AND_STACK.md.  
4. Proceed with Phase 1 implementation (auth, modules, default assignments, User Management, member CRUD, onboarding).
