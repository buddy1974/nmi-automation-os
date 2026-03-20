# NMI Automation OS — n8n Workflow Integration

## Overview

n8n connects to NMI via two endpoints:

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/n8n/trigger` | POST | Webhook secret | Trigger a workflow |
| `/api/n8n/status`  | GET  | None           | Health check |

---

## Authentication

All trigger calls require either:
- Header: `x-nmi-webhook-secret: <your-secret>`
- OR body field: `"secret": "<your-secret>"`

Set `NMI_WEBHOOK_SECRET` in your `.env.local` and in Vercel environment variables.

---

## Trigger Payload Format

```json
{
  "workflow": "<workflow_name>",
  "payload": { },
  "secret": "your-secret-here"
}
```

---

## Available Workflows

### `email_classify`
Classifies an email using AI and routes it to the correct department.

```json
{
  "workflow": "email_classify",
  "payload": {
    "from": "school@lycee.cm",
    "subject": "Commande de 100 livres",
    "body": "Bonjour, nous souhaitons commander..."
  },
  "secret": "YOUR_SECRET"
}
```

### `stock_alert`
Scans products below threshold and creates notifications.

```json
{
  "workflow": "stock_alert",
  "payload": { "threshold": 10 },
  "secret": "YOUR_SECRET"
}
```

### `royalty_check`
Flags unpaid royalties older than N days.

```json
{
  "workflow": "royalty_check",
  "payload": { "daysOverdue": 30 },
  "secret": "YOUR_SECRET"
}
```

### `daily_briefing`
Aggregates today's KPIs and saves a CEO summary notification.

```json
{
  "workflow": "daily_briefing",
  "payload": {},
  "secret": "YOUR_SECRET"
}
```

### `task_reminder`
Finds all overdue tasks and creates reminder notifications.

```json
{
  "workflow": "task_reminder",
  "payload": {},
  "secret": "YOUR_SECRET"
}
```

---

## Example n8n Workflow JSONs

### 1. Gmail → Classify Email

```
Trigger: Gmail Trigger (new email received)
  ↓
HTTP Request node:
  Method: POST
  URL: https://your-domain.vercel.app/api/n8n/trigger
  Headers:
    x-nmi-webhook-secret: {{ $env.NMI_WEBHOOK_SECRET }}
  Body (JSON):
    {
      "workflow": "email_classify",
      "payload": {
        "from":    "{{ $json.from }}",
        "subject": "{{ $json.subject }}",
        "body":    "{{ $json.text }}"
      }
    }
```

### 2. Daily 8:00 AM Briefing

```
Trigger: Schedule Trigger
  Cron: 0 8 * * *   (every day at 08:00)
  ↓
HTTP Request node:
  Method: POST
  URL: https://your-domain.vercel.app/api/n8n/trigger
  Headers:
    x-nmi-webhook-secret: {{ $env.NMI_WEBHOOK_SECRET }}
  Body (JSON):
    {
      "workflow": "daily_briefing",
      "payload": {}
    }
```

### 3. Hourly Stock Alert

```
Trigger: Schedule Trigger
  Cron: 0 * * * *   (every hour)
  ↓
HTTP Request node:
  Method: POST
  URL: https://your-domain.vercel.app/api/n8n/trigger
  Headers:
    x-nmi-webhook-secret: {{ $env.NMI_WEBHOOK_SECRET }}
  Body (JSON):
    {
      "workflow": "stock_alert",
      "payload": { "threshold": 10 }
    }
```

---

## Health Check

n8n can monitor NMI system health with a no-auth GET:

```
HTTP Request node:
  Method: GET
  URL: https://your-domain.vercel.app/api/n8n/status

Response:
{
  "status": "ok",
  "db": "connected",
  "unreadNotifications": 3,
  "openTasks": 12,
  "urgentEmails": 1,
  "lastSchedulerRun": "2026-03-20T08:00:00.000Z",
  "timestamp": "2026-03-20T09:15:00.000Z"
}
```

Use an IF node after this to alert if `status !== "ok"` or `urgentEmails > 0`.

---

## Setting NMI_WEBHOOK_SECRET in n8n

1. In n8n, go to **Credentials → New Credential → Generic**
2. Name it `NMI Webhook Secret`
3. Add field: `NMI_WEBHOOK_SECRET = your-secret-value`
4. In HTTP Request nodes, reference with `{{ $env.NMI_WEBHOOK_SECRET }}`

Or use n8n's built-in environment variable support:
- Self-hosted: add to `.env` file: `NMI_WEBHOOK_SECRET=your-secret`
- Cloud: Settings → Variables

---

## Production Checklist

- [ ] `NMI_WEBHOOK_SECRET` set in Vercel environment variables
- [ ] `NMI_WEBHOOK_SECRET` set in n8n credentials
- [ ] Gmail OAuth credentials configured in n8n
- [ ] Webhook URLs updated to production domain
- [ ] Health check workflow running in n8n
- [ ] Test each workflow from `/n8n` dashboard before going live
