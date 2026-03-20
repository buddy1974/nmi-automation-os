import { prisma }                    from "./db"
import type { AutomationJob }        from "@prisma/client"
import { runAIAction, AI_JOB_TYPES } from "./ai-actions"

// ── Job result type ───────────────────────────────────────────────────────────

export interface JobResult {
  ok:           boolean
  message?:     string
  summary?:     string
  data?:        unknown
  error?:       string
  triggered?:   number
  notifications?: { title: string; message: string; severity: string }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function createNotification(params: {
  type:      string
  title:     string
  message:   string
  severity:  string
  companyId?: string
}) {
  return prisma.notification.create({ data: params })
}

// ── Basic handlers ────────────────────────────────────────────────────────────

async function handlePing(): Promise<JobResult> {
  return { ok: true, message: "pong" }
}

async function handleInvoiceSummary(): Promise<JobResult> {
  const invoices = await prisma.invoice.findMany()
  const total    = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const paid     = invoices.reduce((s, i) => s + Number(i.paid),   0)
  return {
    ok: true,
    summary: "invoice summary",
    data: {
      count:        invoices.length,
      totalRevenue: total,
      totalPaid:    paid,
      totalUnpaid:  total - paid,
      countPaid:    invoices.filter(i => i.status === "paid").length,
      countPartial: invoices.filter(i => i.status === "partial").length,
      countUnpaid:  invoices.filter(i => i.status === "issued").length,
    },
  }
}

async function handleStockCheck(): Promise<JobResult> {
  const products  = await prisma.product.findMany()
  const lowStock  = products.filter(p => p.stock <= 5)
  const zeroStock = products.filter(p => p.stock === 0)
  return {
    ok: true,
    summary: "stock check",
    data: {
      totalProducts:    products.length,
      lowStockCount:    lowStock.length,
      zeroStockCount:   zeroStock.length,
      lowStockTitles:   lowStock.map(p => p.code),
      zeroStockTitles:  zeroStock.map(p => p.code),
    },
  }
}

// ── Notification-creating handlers ────────────────────────────────────────────

async function handleLowStockAlert(payload: Record<string, unknown>): Promise<JobResult> {
  const threshold = typeof payload.threshold === "number" ? payload.threshold : 10
  const products  = await prisma.product.findMany({ where: { stock: { lt: threshold } } })

  if (products.length === 0) {
    return { ok: true, triggered: 0, notifications: [] }
  }

  const created = await Promise.all(
    products.map(p =>
      createNotification({
        type:     "low_stock_alert",
        title:    `Low stock: ${p.code}`,
        message:  `"${p.title}" has only ${p.stock} unit${p.stock === 1 ? "" : "s"} remaining (threshold: ${threshold}).`,
        severity: p.stock === 0 ? "high" : "medium",
        companyId: typeof payload.companyId === "string" ? payload.companyId : undefined,
      })
    )
  )

  return {
    ok:            true,
    triggered:     created.length,
    notifications: created.map(n => ({ title: n.title, message: n.message, severity: n.severity })),
  }
}

async function handleRoyaltyReminder(payload: Record<string, unknown>): Promise<JobResult> {
  const daysOverdue = typeof payload.daysOverdue === "number" ? payload.daysOverdue : 30
  const cutoff      = new Date()
  cutoff.setDate(cutoff.getDate() - daysOverdue)

  const overdue = await prisma.royalty.findMany({
    where: { status: "unpaid", date: { lt: cutoff } },
  })

  if (overdue.length === 0) {
    return { ok: true, triggered: 0, notifications: [] }
  }

  const created = await Promise.all(
    overdue.map(r =>
      createNotification({
        type:     "royalty_reminder",
        title:    `Unpaid royalty: ${r.author}`,
        message:  `Royalty for "${r.book}" (${Number(r.amount).toLocaleString()} XAF) has been unpaid for over ${daysOverdue} days.`,
        severity: "medium",
        companyId: typeof payload.companyId === "string" ? payload.companyId : undefined,
      })
    )
  )

  return {
    ok:            true,
    triggered:     created.length,
    notifications: created.map(n => ({ title: n.title, message: n.message, severity: n.severity })),
  }
}

async function handlePerformanceAlert(payload: Record<string, unknown>): Promise<JobResult> {
  const threshold = typeof payload.threshold === "number" ? payload.threshold : 50

  // Get latest score per worker
  const records = await prisma.performanceRecord.findMany({
    select: { workerId: true, scorePercent: true, worker: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  const seen    = new Set<number>()
  const lowPerf: typeof records = []
  for (const r of records) {
    if (!seen.has(r.workerId)) {
      seen.add(r.workerId)
      if (r.scorePercent < threshold) lowPerf.push(r)
    }
  }

  if (lowPerf.length === 0) {
    return { ok: true, triggered: 0, notifications: [] }
  }

  const created = await Promise.all(
    lowPerf.map(r =>
      createNotification({
        type:     "performance_alert",
        title:    `Low performance: ${r.worker.name}`,
        message:  `${r.worker.name} has a performance score of ${r.scorePercent.toFixed(0)}% — below the ${threshold}% threshold.`,
        severity: r.scorePercent < 30 ? "high" : "medium",
        companyId: typeof payload.companyId === "string" ? payload.companyId : undefined,
      })
    )
  )

  return {
    ok:            true,
    triggered:     created.length,
    notifications: created.map(n => ({ title: n.title, message: n.message, severity: n.severity })),
  }
}

// ── Main runner ───────────────────────────────────────────────────────────────

export async function runJob(job: AutomationJob): Promise<JobResult> {
  // Route AI-specific job types to the AI action handler
  if (AI_JOB_TYPES.includes(job.type)) {
    return runAIAction(job)
  }

  const payload = (job.payload ?? {}) as Record<string, unknown>

  switch (job.type) {
    case "ping":               return handlePing()
    case "invoice_summary":    return handleInvoiceSummary()
    case "stock_check":        return handleStockCheck()
    case "low_stock_alert":    return handleLowStockAlert(payload)
    case "royalty_reminder":   return handleRoyaltyReminder(payload)
    case "performance_alert":  return handlePerformanceAlert(payload)
    default:
      return { ok: false, error: `Unknown job type: "${job.type}"` }
  }
}
