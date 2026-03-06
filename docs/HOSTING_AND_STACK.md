# CP System — Hosting & Technology Stack (Free Tier)

This document recommends an **architecture, technology stack, and free-tier hosting platforms** for the Catholic Professional (CP) management system, so the application and database can run at no cost (within free-tier limits).

---

## 1. Recommended Architecture (Free Tier)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND + API (single app)                                                     │
│  • Next.js (React) or similar — SSR/API routes, auth, RBAC                       │
│  • Hosted on: Vercel (recommended) or Render / Netlify                           │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         │  HTTPS
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  DATABASE                                                                        │
│  • PostgreSQL (relational, good for audits & reporting)                          │
│  • Hosted on: Supabase (recommended) or Neon / ElephantSQL                      │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
         │  (Supabase also provides: Auth, Storage, optional Realtime)
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  FILE STORAGE (paybill uploads, event banners, attachments)                      │
│  • Supabase Storage (free tier) or Cloudinary (free tier)                        │
└─────────────────────────────────────────────────────────────────────────────────┘
         │
┌─────────────────────────────────────────────────────────────────────────────────┐
│  SCHEDULED JOBS (monthly reminder, compliance, event reminders)                  │
│  • Vercel Cron (if on Vercel) or external cron (cron-job.org) hitting API        │
│  • Or: serverless function triggered on schedule                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Idea:** One **full-stack app** (frontend + API) on a **free app host**, one **managed PostgreSQL** on a **free DB host**, and **free storage** for files. Scheduled tasks run via **cron** (platform or external) calling a protected API route.

---

## 2. Recommended Stack

| Layer | Technology | Why it fits free hosting |
|-------|------------|---------------------------|
| **Frontend** | **Next.js (React)** or **Remix** | SSR + API routes in one app; deploys easily to Vercel/Render/Netlify. |
| **API** | Next.js API Routes / Route Handlers, or **Node (Express/Fastify)** | Serverless or single process; no need for a separate backend server. |
| **Database** | **PostgreSQL** | Relational model matches the design (users, modules, events, transactions); good free managed options. |
| **ORM / DB client** | **Prisma** or **Drizzle** | Type-safe schema, migrations; works with any Postgres host. |
| **Auth** | **NextAuth.js** (with credentials + JWT) or **Supabase Auth** | Works with serverless; no extra auth server. |
| **File storage** | **Supabase Storage** or **Cloudinary** | Free tiers for images and file uploads. |
| **Email** | **Resend** (free tier) or **SendGrid** (free tier) or SMTP (e.g. Gmail) | Transactional email for onboarding, reminders. |
| **Scheduled jobs** | **Vercel Cron** (Vercel Pro has cron; free alternative: **cron-job.org** or **Upstash QStash**) or **Render Cron** | Trigger a “run reminders” / “run compliance” API route on a schedule. |

**Alternative (more “backend-heavy”):**  
**Python (FastAPI or Django)** + **PostgreSQL** — host backend on **Render** or **Railway** (free tier limits apply), frontend on **Vercel/Netlify**, DB on **Neon** or **Supabase**. Works but adds a second service to maintain.

---

## 3. Free Hosting Platforms

### 3.1 Application (frontend + API)

| Platform | Free tier | Best for | Limits / notes |
|----------|-----------|----------|----------------|
| **Vercel** | Yes | Next.js, React, serverless API | 100 GB bandwidth, serverless invocations; **no persistent background workers**. Use Vercel Cron (or external cron) for scheduled tasks. |
| **Render** | Yes (Web Service) | Node/Python/static; can run 24/7 | Free **spins down** after ~15 min inactivity (cold start on next request). Free **PostgreSQL** (90-day limit or small DB). Good for low traffic. |
| **Netlify** | Yes | Static + serverless functions | Similar to Vercel; good for frontend + serverless API. |
| **Railway** | $5 free credit/month | Full-stack, Postgres add-on | Effectively “free” for very low usage; overage costs money. |
| **Cyclic** | Yes (Node.js) | Simple Node backend | Free; good for small APIs. |
| **Fly.io** | Yes (small VMs) | Any runtime, long-running processes | Free tier: small VM; can run cron inside container. |

**Recommendation:** **Vercel** for the app (best fit for Next.js, free SSL, good DX). If you need a **always-on** process (e.g. in-process cron), use **Render** or **Fly.io** instead.

### 3.2 Database (PostgreSQL)

| Platform | Free tier | Limits | Notes |
|----------|-----------|--------|--------|
| **Supabase** | Yes | 500 MB DB, 1 GB file storage, 50 K monthly active users | **Recommended.** Postgres + Auth + Storage + optional Realtime. Easiest all-in-one for free tier. |
| **Neon** | Yes | 0.5 GB storage, serverless Postgres | Auto-suspend when idle; good for serverless (Vercel). |
| **ElephantSQL** | Yes (Tiny Turtle) | 20 MB | Very small; only for minimal data or PoC. |
| **Render** | Yes | 90-day free PostgreSQL (or 1 GB persistent) | DB can be deleted after 90 days on free tier; read TOS. |
| **PlanetScale** | Limited free tier (MySQL) | MySQL, not Postgres | Use only if you prefer MySQL; schema differs from current design. |

**Recommendation:** **Supabase** for Postgres + Auth + Storage in one place, or **Neon** if you want Postgres-only and are on Vercel.

### 3.3 File storage

| Platform | Free tier | Use case |
|----------|-----------|----------|
| **Supabase Storage** | 1 GB (with Supabase) | Paybill files, event banners, Past Event attachments. |
| **Cloudinary** | ~25 GB/month bandwidth | Images (banners, avatars); good free tier. |
| **Vercel Blob** | Limited free (Vercel) | Simple blob store if app is on Vercel. |

**Recommendation:** Use **Supabase Storage** if DB is on Supabase; otherwise **Cloudinary** for images and any simple store for CSV/file uploads.

### 3.4 Scheduled jobs (cron)

| Option | Free? | How |
|--------|------|-----|
| **cron-job.org** | Yes | External cron hits your API URL (e.g. `/api/cron/monthly-reminder`) with a secret header; your app runs the job. |
| **Vercel Cron** | Vercel Pro (paid) | Native cron for Vercel. On free plan, use external cron. |
| **Render Cron** | Yes (with Render) | If backend is on Render, add a cron job that hits an endpoint. |
| **Upstash QStash** | Free tier | Message queue / scheduled invocations; call your API on a schedule. |
| **Fly.io / Railway** | Yes | Run a small worker or in-process cron inside the same (or second) service. |

**Recommendation:** Use **cron-job.org** (or **Upstash QStash**) to call a protected **API route** (e.g. `POST /api/cron/monthly-reminder`) that runs the monthly reminder, compliance check, and event reminders. Secure the route with a shared secret or API key.

### 3.5 Email (transactional)

| Service | Free tier | Notes |
|---------|-----------|--------|
| **Resend** | 3,000 emails/month | Simple API, good for onboarding and reminders. |
| **SendGrid** | 100 emails/day | Classic option. |
| **Brevo (Sendinblue)** | 300 emails/day | SMTP + API. |
| **Gmail SMTP** | Limited | Free but not ideal for bulk; use for testing. |

**Recommendation:** **Resend** or **SendGrid** for production; store credentials in environment variables (e.g. Vercel/Render env).

---

## 4. Recommended Combination (All Free Tier)

**Option A — Simplest (recommended)**  
- **App:** **Vercel** (Next.js app + API routes).  
- **Database:** **Supabase** (PostgreSQL).  
- **Auth:** **Supabase Auth** or **NextAuth.js** with credentials + JWT.  
- **Storage:** **Supabase Storage** (paybill files, event banners, attachments).  
- **Cron:** **cron-job.org** (or **Upstash QStash**) calling e.g. `POST /api/cron/monthly-reminder` and `POST /api/cron/compliance` with a secret key.  
- **Email:** **Resend** or **SendGrid** (free tier).

**Option B — Always-on backend**  
- **App:** **Render** (Node or Python backend) + **Vercel** or **Netlify** (frontend only), or full-stack on Render.  
- **Database:** **Supabase** or **Neon** (PostgreSQL).  
- **Cron:** **Render Cron** or in-process cron inside the Render service.  
- **Storage / Email:** Same as Option A.

**Option C — Minimal moving parts**  
- **App + DB:** **Render** (Web Service + PostgreSQL add-on). Single platform; free DB has time or size limits.  
- **Storage:** Supabase Storage or Cloudinary (free).  
- **Cron:** Render cron or cron-job.org.

---

## 5. High-Level Architecture Diagram (Option A)

```
                    Internet
                        │
                        ▼
              ┌─────────────────┐
              │     Vercel      │
              │  (Next.js app   │
              │   + API routes) │
              └────────┬────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
  ┌────────────┐ ┌──────────┐ ┌─────────────┐
  │  Supabase  │ │  Resend  │ │ cron-job    │
  │  • Postgres│ │  (email) │ │ .org (cron) │
  │  • Auth    │ └──────────┘ └──────┬──────┘
  │  • Storage │                     │
  └────────────┘                     │
         ▲                     POST /api/cron/*
         │                     (monthly reminder,
         └────────────────────  compliance, etc.)
```

---

## 6. Implementation Notes for Free Tier

1. **Environment variables:** Store DB URL, Supabase keys, Resend/SendGrid API key, and **cron secret** in Vercel (or Render) environment variables. Never commit secrets.
2. **Database migrations:** Use **Prisma Migrate** or **Drizzle** (or Supabase migrations) and run them from CI or a one-off script against the Supabase/Neon URL.
3. **Cron security:** Validate a shared secret header (e.g. `x-cron-secret`) in `/api/cron/*` so only your cron provider can trigger jobs.
4. **Rate limits:** Free tiers often have rate limits; add simple rate limiting or caching if you hit them (e.g. Vercel serverless invocation limits).
5. **Backups:** Supabase (and Neon) offer point-in-time or export options; schedule periodic exports (e.g. weekly) via cron to a safe location if needed.
6. **WhatsApp:** WhatsApp Business API is not free; use it only when the church is ready. Until then, reminders can be email-only.

---

## 7. Summary Table

| Component | Recommended (free) | Alternative |
|-----------|--------------------|-------------|
| **App host** | Vercel | Render, Netlify |
| **Database** | Supabase (Postgres) | Neon, ElephantSQL |
| **Auth** | Supabase Auth or NextAuth.js | NextAuth with credentials |
| **File storage** | Supabase Storage | Cloudinary |
| **Scheduled jobs** | cron-job.org → API route | Upstash QStash, Render Cron |
| **Email** | Resend / SendGrid | Brevo, Gmail SMTP |
| **Stack** | Next.js + Prisma/Drizzle + PostgreSQL | Node/Python + same DB |

This setup keeps the **application and database on free hosting platforms** while leaving room to add WhatsApp, paid email, or a paid app host later if the group grows.
