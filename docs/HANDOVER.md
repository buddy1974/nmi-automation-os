# NMI Automation OS — Handover Document

**Prepared by:** maxpromo.digital
**Client:** NMI Education, Yaoundé, Cameroon
**System:** NMI Automation OS — CEO Digital Office & Business Intelligence Platform

---

## 1. System Overview

NMI Automation OS is a full-stack web application built for NMI Education (a Cameroonian educational publisher). It provides:

- **CEO Digital Office** — Google Calendar, Gmail inbox, AI meeting prep, Command Palette (Ctrl+K)
- **Business Operations** — Orders, Sales, Customers, Invoices, Stock, Distributors, Finance
- **Publishing** — Catalogue, Editorial, Manuscripts, Authors, Royalties, Printing
- **HR & People** — Worker registry, Evaluations, Compensation, Work sessions
- **AI Agents** — 8 autonomous agents (sales, receivables, HR, stock, competitive intel, finance, authors, documents)
- **Intelligence** — Daily AI briefings, Knowledge Base, Chat assistant
- **Automation** — n8n workflow integration, Email routing, WhatsApp Business
- **Data Import** — Excel/CSV/Google Sheets importer for all modules

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React, TypeScript, Tailwind-compatible inline styles |
| Database | Neon PostgreSQL (serverless) + Prisma ORM v7 |
| Hosting | Vercel |
| AI | Anthropic Claude API (Sonnet 4.6 + Haiku 4.5) |
| Google | Calendar API v3 + Gmail API v1 (OAuth 2.0) |
| WhatsApp | Meta WhatsApp Business API |
| Automation | n8n (self-hosted or cloud) |
| Email | Gmail SMTP via Google OAuth |

---

## 2. Environment Variables Checklist

Set all of the following in Vercel → Project → Settings → Environment Variables (and in `.env` for local dev).

### Required — Core

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Neon PostgreSQL pooled connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | 64-character random hex string for session tokens | `df82f7f33...` |

### Required — AI

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from console.anthropic.com |

### Required — Google OAuth

| Variable | Description | Example |
|---|---|---|
| `GOOGLE_CLIENT_ID` | From Google Cloud Console → Credentials | `123456789-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console → Credentials | `GOCSPX-...` |
| `GOOGLE_REDIRECT_URI` | Must match OAuth consent screen exactly | `https://yourdomain.com/api/auth/google/callback` |

### Optional — WhatsApp

| Variable | Description |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Meta Business API access token |
| `WHATSAPP_PHONE_ID` | Meta phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | Webhook verify token (any string you choose) |

### Optional — Webhooks / n8n

| Variable | Description |
|---|---|
| `WEBHOOK_SECRET` | Secret for incoming webhook verification |
| `N8N_SECRET` | Secret for n8n bridge authentication |
| `NMI_WEBHOOK_SECRET` | Secret for email routing webhook |

---

## 3. How to Add the First Admin User

### Option A — Via Setup Wizard (recommended)

1. Log in as owner
2. Navigate to **Admin → Setup** in the sidebar
3. Click **Step 2 — Create Admin**
4. Fill in: Name, Email, Password → Submit
5. The user can log in immediately at `/login`

### Option B — Via seed script

```bash
cd dashboard
npx tsx scripts/seed.ts
```

### Option C — Via Neon DB console

Run directly in Neon SQL editor:
```sql
INSERT INTO users (id, email, name, password, role, active, created_at)
VALUES (
  gen_random_uuid()::text,
  'admin@nmi.cm',
  'NMI Admin',
  -- bcrypt hash of your password (generate at bcrypt-generator.com, cost 10)
  '$2b$10$...',
  'admin',
  true,
  now()
);
```

---

## 4. How to Import Data (for each module)

The Import Center is at `/import` (Sidebar → Admin → Import).

### Supported modules

| Module | Required fields | Link |
|---|---|---|
| Workers | name, role | `/import?module=workers` |
| Products | code, title | `/import?module=products` |
| Customers | name | `/import?module=customers` |
| Authors | name | `/import?module=authors` |
| Royalties | author, book, amount | `/import?module=royalties` |
| Orders | customerName, productCode, quantity | `/import?module=orders` |
| Distributors | name, region | `/import?module=distributors` |

### Import steps

1. Go to `/import` or click **↑ Import** on any data page
2. **Step 1** — Select the module (e.g. Workers)
3. **Step 2** — Choose source: Upload File / Google Sheet / Google Drive / Download Template
4. **Step 3** — Upload your Excel (.xlsx) or CSV file, then click **Analyse with AI**
   - Claude reads your column headers and maps them automatically
   - Review the mapping — edit any dropdowns if needed
   - Check the success estimate and data preview
5. **Step 4** — Click **Confirm Import**
6. Results show: imported / skipped / errors

### Tips

- Download a template first: Step 2 → Download Template → fill in your data → re-upload
- For Google Sheets: the sheet must be **publicly accessible** (Share → Anyone with link → Viewer)
- Import history is shown at the bottom of `/import`

---

## 5. How to Connect Google (Calendar + Gmail)

### Prerequisites

1. Create a Google Cloud project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable **Google Calendar API** and **Gmail API**
3. Create OAuth 2.0 credentials (Web application type)
4. Add authorised redirect URI: `https://yourdomain.vercel.app/api/auth/google/callback`
5. Copy **Client ID** and **Client Secret** to environment variables

### Connecting

1. Set environment variables: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
2. Deploy to Vercel (or restart local dev server)
3. Log in as owner or admin
4. Navigate to `/office` → click **Connect Google Account**
5. Complete the Google consent flow
6. You will be redirected back to `/office` with Calendar and Gmail loaded

### What gets connected

- **Google Calendar** — today's events, 7-day view, AI meeting prep notes
- **Gmail** — inbox preview, compose, draft, search
- Tokens are stored encrypted in the `google_tokens` table and auto-refreshed

---

## 6. How to Connect WhatsApp Business

1. Set up a [Meta Business account](https://business.facebook.com) and create a WhatsApp Business app
2. Get your **Phone Number ID** and **Access Token** from the Meta Developer dashboard
3. Set environment variables: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_VERIFY_TOKEN`
4. Configure your webhook in Meta: `https://yourdomain.vercel.app/api/whatsapp`
5. Use verify token matching `WHATSAPP_VERIFY_TOKEN`
6. Messages appear in `/whatsapp` in the dashboard

---

## 7. How to Configure n8n

n8n is used for workflow automation (scheduled briefings, email routing, etc.).

### Setup

1. Self-host n8n or use [n8n.cloud](https://n8n.cloud)
2. In n8n, create a workflow that calls NMI API endpoints
3. Set `N8N_SECRET` in environment variables — use this to authenticate n8n → NMI calls
4. In NMI, go to **Automation → n8n** to view and manage workflows

### Key endpoints n8n calls

| Endpoint | Purpose |
|---|---|
| `POST /api/scheduler/briefing` | Generate daily AI briefing |
| `POST /api/agents/run/:agentId` | Run a specific AI agent |
| `POST /api/email` | Process incoming email |
| `GET /api/n8n/status` | Health check |

---

## 8. How to Run AI Agents

NMI has 8 autonomous AI agents accessible at `/agents` (Sidebar → Intelligence → Agents).

| Agent | What it does |
|---|---|
| Sales Hunter | Finds dormant customers, drafts re-engagement emails |
| Receivables | Flags overdue invoices, sends payment reminders |
| Author Relations | Monitors manuscripts, tracks royalty due dates |
| Stock Intelligence | Alerts on low/zero stock, creates purchase tasks |
| Competitive Intel | Generates Cameroonian publishing market briefings |
| HR Pulse | Flags absentees, overdue tasks, unevaluated workers |
| Financial Forecast | 6-month revenue trend + 3-month AI forecast |
| Document Intel | Extracts insights from knowledge base documents |

### Running agents

1. Go to `/agents`
2. Click **▶ Run Now** on any agent card
3. Results appear inline within seconds
4. Toggle agents on/off with the switch on each card

### Scheduling (via n8n)

- Agents can be scheduled to run automatically via n8n cron workflows
- Call `POST /api/agents/run/:agentId` with `Authorization: Bearer {N8N_SECRET}` header

---

## 9. Daily Operation Guide for CEO

### Morning routine (5 minutes)

1. Open `/office` — CEO Digital Office
   - Check today's calendar events
   - Click any event for AI prep notes
   - Review Gmail inbox (last 20 emails)
2. Open `/dashboard` — AI chat auto-opens with good morning greeting
   - Ask: "What happened yesterday?" or "Show me today's priority actions"
3. Check `/briefing` — Daily AI briefing (auto-generated by scheduler)

### Weekly tasks

- `/agents` → Run all agents manually or check automated results
- `/invoices` → Review outstanding payments
- `/sales` → Check sales pipeline
- `/hr` → Review attendance and performance

### Command Palette (Ctrl+K)

Press **Ctrl+K** anywhere in the system to:
- Navigate: "go to orders", "open briefing"
- Draft emails: "draft email to the printing team"
- Get quick info: the AI interprets and routes your command

### Key URLs

| Page | URL |
|---|---|
| CEO Digital Office | `/office` |
| Dashboard | `/dashboard` |
| Daily Briefing | `/briefing` |
| AI Agents | `/agents` |
| Orders | `/orders` |
| Sales | `/sales` |
| Finance | `/finance` |
| HR | `/hr` |
| Import Center | `/import` |
| Setup Wizard | `/admin/setup` |

---

## 10. Maintenance & Support

### Database

- Hosted on [Neon](https://neon.tech) — serverless PostgreSQL
- Backups: Neon provides automated point-in-time recovery
- To run migrations: `npx prisma db push` (from `dashboard/` directory)

### Deployments

- Hosted on [Vercel](https://vercel.com)
- Every push to `main` branch auto-deploys
- Check deployment logs in Vercel dashboard

### Logs

- Server logs: Vercel → Project → Deployments → Functions tab
- Database logs: Neon console

### Common issues

| Issue | Fix |
|---|---|
| Login loop / 500 on login | Check `JWT_SECRET` is set in Vercel env vars |
| Google connect fails | Verify `GOOGLE_REDIRECT_URI` matches exactly (no trailing slash) |
| AI features not working | Check `ANTHROPIC_API_KEY` in Vercel env vars |
| Import fails | Check file encoding (save as UTF-8 CSV) |
| Build fails on Vercel | Check Vercel build logs; likely a missing env var |

---

## 11. Support Contact

**Developer:** maxpromo.digital
**Website:** [https://maxpromo.digital](https://maxpromo.digital)

For technical support, feature requests, or system modifications, contact maxpromo.digital.

---

*NMI Automation OS — Built with care for NMI Education, Cameroon.*
