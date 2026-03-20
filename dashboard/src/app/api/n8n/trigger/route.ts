import { NextResponse }          from "next/server"
import { prisma }               from "@/lib/db"
import { checkRateLimit }       from "@/lib/rateLimit"
import { classifyEmail }        from "@/lib/emailClassifier"
import { generateDailyBriefing } from "@/lib/briefing"

export const runtime = "nodejs"

// ── Workflow implementations ───────────────────────────────────────────────────

async function workflowEmailClassify(payload: Record<string, unknown>) {
  const from    = String(payload.from    ?? "unknown@external.com")
  const subject = String(payload.subject ?? "(no subject)")
  const body    = payload.body ? String(payload.body) : undefined

  const { log, classification } = await classifyEmail({ from, subject, body })

  await prisma.notification.create({
    data: {
      type:     "n8n_email_classify",
      title:    `Email routed: ${classification.category}`,
      message:  `From: ${from} | Subject: ${subject} | → ${classification.routedTo} (${classification.priority})`,
      severity: classification.priority === "urgent" ? "high" : "info",
    },
  })

  return { logId: log.id, classification }
}

async function workflowStockAlert(payload: Record<string, unknown>) {
  const threshold = typeof payload.threshold === "number" ? payload.threshold : 10
  const products  = await prisma.product.findMany({ where: { stock: { lt: threshold } } })

  let created = 0
  for (const p of products) {
    const title  = `Low stock: ${p.code}`
    const exists = await prisma.notification.findFirst({ where: { type: "low_stock_alert", title, read: false } })
    if (!exists) {
      await prisma.notification.create({
        data: {
          type:     "low_stock_alert",
          title,
          message:  `"${p.title}" has ${p.stock} unit${p.stock === 1 ? "" : "s"} remaining.`,
          severity: p.stock === 0 ? "high" : "medium",
        },
      })
      created++
    }
  }

  return { scanned: products.length, notificationsCreated: created }
}

async function workflowRoyaltyCheck(payload: Record<string, unknown>) {
  const days   = typeof payload.daysOverdue === "number" ? payload.daysOverdue : 30
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const overdue = await prisma.royalty.findMany({ where: { status: "unpaid", date: { lt: cutoff } } })

  let created = 0
  for (const r of overdue) {
    const title  = `Unpaid royalty: ${r.author}`
    const exists = await prisma.notification.findFirst({ where: { type: "royalty_reminder", title, read: false } })
    if (!exists) {
      await prisma.notification.create({
        data: {
          type:     "royalty_reminder",
          title,
          message:  `Royalty for "${r.book}" (${Number(r.amount).toLocaleString()} XAF) unpaid for over ${days} days.`,
          severity: "medium",
        },
      })
      created++
    }
  }

  return { overdueCount: overdue.length, notificationsCreated: created }
}

async function workflowDailyBriefing() {
  const { briefing, data } = await generateDailyBriefing()

  await prisma.notification.create({
    data: {
      type:     "daily_briefing",
      title:    `CEO Morning Briefing — ${data.date}`,
      message:  briefing,
      severity: data.urgentNotifs > 0 || data.urgentEmails > 0 ? "high" : "info",
    },
  })

  return { date: data.date, briefing: briefing.slice(0, 200) + "…", data }
}

async function workflowTaskReminder() {
  const now     = new Date()
  const overdue = await prisma.task.findMany({
    where: { status: { not: "done" }, dueDate: { lt: now } },
    select: { id: true, title: true, ownerName: true, dueDate: true, priority: true },
  })

  let created = 0
  for (const t of overdue) {
    const title  = `Overdue task: ${t.title.slice(0, 60)}`
    const exists = await prisma.notification.findFirst({ where: { type: "task_reminder", title, read: false } })
    if (!exists) {
      const daysLate = Math.floor((now.getTime() - (t.dueDate?.getTime() ?? 0)) / 86400000)
      await prisma.notification.create({
        data: {
          type:     "task_reminder",
          title,
          message:  `"${t.title}" assigned to ${t.ownerName ?? "unassigned"} is ${daysLate} day${daysLate === 1 ? "" : "s"} overdue (${t.priority} priority).`,
          severity: t.priority === "urgent" || t.priority === "high" ? "high" : "medium",
        },
      })
      created++
    }
  }

  return { overdueCount: overdue.length, notificationsCreated: created }
}

// ── POST /api/n8n/trigger ─────────────────────────────────────────────────────

const WORKFLOWS = ["email_classify", "stock_alert", "royalty_check", "daily_briefing", "task_reminder"] as const
type WorkflowName = typeof WORKFLOWS[number]

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const data = await req.json()

    const secret = data.secret ?? req.headers.get("x-nmi-webhook-secret")
    if (!secret || secret !== process.env.NMI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
    }

    const workflow = data.workflow as WorkflowName
    if (!WORKFLOWS.includes(workflow)) {
      return NextResponse.json({
        error:   `Unknown workflow. Valid: ${WORKFLOWS.join(", ")}`,
        code:    "VALIDATION",
      }, { status: 400 })
    }

    const payload = (data.payload ?? {}) as Record<string, unknown>
    let result: unknown

    switch (workflow) {
      case "email_classify":  result = await workflowEmailClassify(payload);  break
      case "stock_alert":     result = await workflowStockAlert(payload);     break
      case "royalty_check":   result = await workflowRoyaltyCheck(payload);   break
      case "daily_briefing":  result = await workflowDailyBriefing();         break
      case "task_reminder":   result = await workflowTaskReminder();          break
    }

    return NextResponse.json({ workflow, result, timestamp: new Date().toISOString() })

  } catch (err) {
    console.error("[POST /api/n8n/trigger]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
