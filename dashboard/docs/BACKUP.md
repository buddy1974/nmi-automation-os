# NMI Automation OS — Backup & Restore Guide

## Database: Neon PostgreSQL

### Backup (pg_dump)

```bash
# Export full database to SQL file
pg_dump "$DATABASE_URL" \
  --no-acl --no-owner \
  -F c -f backup-$(date +%Y%m%d-%H%M).dump

# Export as plain SQL (human-readable)
pg_dump "$DATABASE_URL" \
  --no-acl --no-owner \
  -F p -f backup-$(date +%Y%m%d-%H%M).sql
```

> `DATABASE_URL` must be the **non-pooled** Neon connection string (ends in `neon.tech`, not `-pooler`).
> Find it in Neon dashboard → Project → Connection Details → Direct connection.

### Restore

```bash
# Restore from .dump (custom format)
pg_restore --no-acl --no-owner \
  -d "$DATABASE_URL" \
  backup-YYYYMMDD-HHMM.dump

# Restore from plain SQL
psql "$DATABASE_URL" < backup-YYYYMMDD-HHMM.sql
```

---

## Seed Scripts (run in order)

```bash
# 1. Core business data (products, companies, branches, customers, orders)
npx tsx scripts/seed-business.ts

# 2. Distributors
npx tsx scripts/seed-distributors.ts

# 3. Full Prisma seed (users, workers, tasks, etc.)
npx prisma db seed
```

> Always run seed scripts against a freshly migrated schema.
> Run `npx prisma db push` first if schema has changed.

---

## Seed Data Snapshot

A JSON snapshot of key reference data is stored at `docs/seed-snapshot.json`.
Regenerate it at any time:

```bash
npm run backup
```

---

## Environment Variables Checklist

| Variable | Used By | Notes |
|---|---|---|
| `DATABASE_URL` | Prisma, Neon adapter | Non-pooled for migrations, pooled for app |
| `DIRECT_URL` | Prisma migrations | Non-pooled Neon URL |
| `JWT_SECRET` | Auth (jose) | Min 32 chars, random string |
| `ANTHROPIC_API_KEY` | AI chat, HR eval | From console.anthropic.com |
| `RESEND_API_KEY` | Email (future) | From resend.com |
| `TWILIO_ACCOUNT_SID` | SMS (future) | From twilio.com |
| `TWILIO_AUTH_TOKEN` | SMS (future) | From twilio.com |
| `TWILIO_FROM_NUMBER` | SMS (future) | E.164 format |
| `NEXT_PUBLIC_APP_URL` | PDF links, emails | e.g. https://nmi-os.vercel.app |

Copy `.env.local.example` to `.env.local` and fill all values before running locally.

---

## Vercel Environment Variables

Set all variables above in:
**Vercel Dashboard → Project → Settings → Environment Variables**

Ensure `DATABASE_URL` points to the **pooled** connection string for production.

---

## Full Recovery Playbook

1. Provision new Neon project
2. Set `DATABASE_URL` + `DIRECT_URL` in `.env.local`
3. `npx prisma db push` — apply schema
4. `pg_restore` or `psql` — restore data from backup
5. Verify with `npx prisma studio`
6. Deploy to Vercel with updated env vars
