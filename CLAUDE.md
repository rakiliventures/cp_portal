# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CP System is a membership and operations management portal for a Catholic Professional (CP) community group. It handles membership, finance, events, attendance, and reporting with role-based access control.

## Commands

```bash
# Development
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build
npm run lint          # ESLint

# Database
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:push       # Push schema changes to DB (dev, no migration file)
npm run db:migrate    # Create and run a named migration (production)
npm run db:seed       # Seed demo users and initial data
```

Always run `db:generate` after editing `prisma/schema.prisma`.

## Architecture

### Auth & Sessions
- NextAuth 4 with credentials provider (`src/app/api/auth/[...nextauth]/route.ts`)
- Session carries: `id`, `email`, `name`, `isSuperAdmin`, `modules` (array of `UserModuleAssignment` with permissions)
- Protected routes live under `src/app/app/` and are wrapped by `src/app/app/layout.tsx`, which checks session and redirects unauthenticated users to `/login`

### Permission System (`src/lib/permissions.ts`)
Central to the app. Every protected UI element and API route gates on this.

- `canAccessModule(modules, isSuperAdmin, moduleCode, permission)` — returns boolean; super-admins always pass; checks `validUntil` expiry
- `getMenuModules(modules, isSuperAdmin)` — builds sidebar nav from user's permissions
- Module codes: `PersonalDashboard`, `Membership`, `Finance`, `Events`, `GroupWideReports`, `Downloads`, `InquiriesManagement`, `RemindersConfiguration`, `UserManagement`, `PaymentAccounts`, `PastEvents`, `Calendar`, `Attendance`
- Permissions per module: `canView`, `canCreate`, `canEdit`, `canDelete`
- Assignments can have `validFrom`/`validUntil` for temporary access

### App Shell (`src/components/app/AppShell.tsx`)
Client component wrapping all `/app/*` pages. Renders responsive sidebar (mobile drawer + desktop fixed). Menu items are generated dynamically from the user's module assignments.

### Data Model (Prisma + PostgreSQL)
Key models:
- `User` + `MemberProfile` — core identity; `MemberProfile` links to `Workgroup` and optional mentor
- `UserModuleAssignment` — permissions per module per user, with optional time bounds
- `FinancialAccount` / `FinancialTransaction` / `Payment` / `Expense` — finance domain
- `Event` / `EventAttendance` / `PastEventAttachment` — events domain
- `PaymentAccount` — M-PESA paybill accounts (CP-KITTY, CP-WELFARE)
- `SystemConfig` — key-value store for app configuration

### Route Structure
```
src/app/
├── login/               Public login page
├── inquiry/             Public membership inquiry form
├── events/              Public events listing & detail
└── app/                 All protected routes (session-gated)
    ├── dashboard/
    ├── membership/
    ├── finance/
    │   ├── payments/
    │   ├── budget/
    │   └── expenses/
    ├── events/
    ├── reports/
    ├── payment-accounts/
    ├── user-management/
    ├── notifications-settings/
    ├── downloads/
    └── inquiries/

src/app/api/             API routes mirroring the frontend modules
```

### Styling
Tailwind CSS. Primary green: `#367C00`. Neutral grays use the `slate` palette. Touch targets are minimum 44px for mobile accessibility.

## Environment Variables

Required in `.env` (see `.env.example`):
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_URL` — App URL (`http://localhost:3000` locally)
- `NEXTAUTH_SECRET` — Random secret for session encryption

## Demo Credentials

- Super-admin: `admin@cp.local` / `ChangeMe123!`
- Member: `member@cp.local` / `Member123!`

## Key Docs

Additional design and requirements context in `docs/`:
- `docs/DESIGN_SYSTEM.md` — full architecture, roles, module definitions, security model
- `docs/USER_FLOWS.md` — admin and member user flows
- `docs/REQUIREMENTS_MATRIX.md` — committee requirements traceability
