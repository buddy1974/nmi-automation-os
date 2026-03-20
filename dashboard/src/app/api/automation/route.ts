import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"
import { requireAuth }  from "@/lib/api-auth"
import { runJob }       from "@/lib/automation"
import { checkRateLimit } from "@/lib/rateLimit"

// Notification-type jobs execute immediately rather than queuing
const NOTIFICATION_TYPES = ["low_stock_alert", "royalty_reminder", "performance_alert"]

function getIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
}

// ── GET /api/automation ───────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (auth.role !== "admin" && auth.role !== "manager") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    const jobs = await prisma.automationJob.findMany({ orderBy: { id: "desc" } })

    return NextResponse.json(jobs)
  } catch (err) {
    console.error("[GET /api/automation]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}

// ── POST /api/automation ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (auth.role !== "admin" && auth.role !== "manager") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    const data = await req.json()

    if (!data.type || typeof data.type !== "string") {
      return NextResponse.json({ error: "type is required", code: "VALIDATION" }, { status: 400 })
    }

    // Create the automation job record
    const job = await prisma.automationJob.create({
      data: {
        type:    data.type,
        payload: data.payload ?? {},
        status:  "pending",
      },
    })

    // Notification types: execute immediately and return results
    if (NOTIFICATION_TYPES.includes(data.type)) {
      await prisma.automationJob.update({ where: { id: job.id }, data: { status: "running" } })

      try {
        const result = await runJob(job)
        const updated = await prisma.automationJob.update({
          where: { id: job.id },
          data:  { status: "done", result: result as object },
        })
        return NextResponse.json({ job: updated, result }, { status: 201 })
      } catch (runErr) {
        const message = runErr instanceof Error ? runErr.message : "Unexpected error"
        await prisma.automationJob.update({
          where: { id: job.id },
          data:  { status: "failed", result: { error: message } as object },
        })
        return NextResponse.json({ error: message, code: "JOB_FAILED" }, { status: 500 })
      }
    }

    // Other types: return job as pending (picked up by scheduler)
    return NextResponse.json(job, { status: 201 })

  } catch (err) {
    console.error("[POST /api/automation]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
