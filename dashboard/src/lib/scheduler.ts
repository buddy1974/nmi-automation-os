import { prisma }  from "./db"
import { runJob }  from "./automation"

// ── Scheduler ─────────────────────────────────────────────────────────────────
// Picks up to BATCH_SIZE pending jobs and executes them in order.
// Called manually via GET /api/scheduler or later by a cron trigger.

const BATCH_SIZE = 5

export async function runScheduler(): Promise<{
  processed: number
  results: Array<{ id: number; type: string; status: string }>
}> {

  const jobs = await prisma.automationJob.findMany({
    where:   { status: "pending" },
    orderBy: { id: "asc" },
    take:    BATCH_SIZE,
  })

  if (jobs.length === 0) {
    return { processed: 0, results: [] }
  }

  const results = []

  for (const job of jobs) {

    await prisma.automationJob.update({
      where: { id: job.id },
      data:  { status: "running" },
    })

    try {
      const result = await runJob(job)

      await prisma.automationJob.update({
        where: { id: job.id },
        data:  { status: "done", result: result as object },
      })

      results.push({ id: job.id, type: job.type, status: "done" })

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error"

      await prisma.automationJob.update({
        where: { id: job.id },
        data:  { status: "failed", result: { error: message } as object },
      })

      results.push({ id: job.id, type: job.type, status: "failed" })
    }
  }

  return { processed: jobs.length, results }
}

// ── Alert scan ────────────────────────────────────────────────────────────────
// Runs on every GET /api/scheduler call.
// Scans DB state and creates Notification records for current issues.
// Deduplicated: skips creating a notification if an unread one already exists
// with the same type and title (prevents duplicate flooding).

export async function runAlertScan(): Promise<{ triggered: number; alerts: string[] }> {
  const alerts: string[] = []

  // ── 1. Low stock (< 10 units) ──────────────────────────────────────────────
  const lowStock = await prisma.product.findMany({ where: { stock: { lt: 10 } } })
  for (const p of lowStock) {
    const title = `Low stock: ${p.code}`
    const exists = await prisma.notification.findFirst({
      where: { type: "low_stock_alert", title, read: false },
    })
    if (!exists) {
      await prisma.notification.create({
        data: {
          type:     "low_stock_alert",
          title,
          message:  `"${p.title}" has ${p.stock} unit${p.stock === 1 ? "" : "s"} remaining — reorder needed.`,
          severity: p.stock === 0 ? "high" : "medium",
        },
      })
      alerts.push(title)
    }
  }

  // ── 2. Unpaid royalties > 30 days ─────────────────────────────────────────
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const overdueRoyalties = await prisma.royalty.findMany({
    where: { status: "unpaid", date: { lt: cutoff } },
  })
  for (const r of overdueRoyalties) {
    const title = `Unpaid royalty: ${r.author}`
    const exists = await prisma.notification.findFirst({
      where: { type: "royalty_reminder", title, read: false },
    })
    if (!exists) {
      await prisma.notification.create({
        data: {
          type:     "royalty_reminder",
          title,
          message:  `Royalty for "${r.book}" (${Number(r.amount).toLocaleString()} XAF) has been unpaid for over 30 days.`,
          severity: "medium",
        },
      })
      alerts.push(title)
    }
  }

  // ── 3. Performance score < 50% ────────────────────────────────────────────
  const perfRecords = await prisma.performanceRecord.findMany({
    select:  { workerId: true, scorePercent: true, worker: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  const seenWorkers = new Set<number>()
  for (const r of perfRecords) {
    if (seenWorkers.has(r.workerId)) continue
    seenWorkers.add(r.workerId)
    if (r.scorePercent < 50) {
      const title = `Low performance: ${r.worker.name}`
      const exists = await prisma.notification.findFirst({
        where: { type: "performance_alert", title, read: false },
      })
      if (!exists) {
        await prisma.notification.create({
          data: {
            type:     "performance_alert",
            title,
            message:  `${r.worker.name} has a performance score of ${r.scorePercent.toFixed(0)}% — below the 50% threshold.`,
            severity: r.scorePercent < 30 ? "high" : "medium",
          },
        })
        alerts.push(title)
      }
    }
  }

  return { triggered: alerts.length, alerts }
}
