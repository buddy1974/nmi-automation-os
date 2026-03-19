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

    // Mark as running
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
