import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { checkRateLimit } from "@/lib/rateLimit"

export const runtime = "nodejs"

// ── GET /api/n8n/status — public health endpoint for n8n monitoring ────────────

export async function GET(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const [unreadNotifications, openTasks, urgentEmails, lastBriefing] = await Promise.all([
      prisma.notification.count({ where: { read: false } }),
      prisma.task.count({ where: { status: { not: "done" } } }),
      prisma.emailLog.count({ where: { priority: "urgent", handled: false } }),
      prisma.notification.findFirst({
        where:   { type: "n8n_daily_briefing" },
        orderBy: { createdAt: "desc" },
        select:  { createdAt: true },
      }),
    ])

    return NextResponse.json({
      status:              "ok",
      db:                  "connected",
      unreadNotifications,
      openTasks,
      urgentEmails,
      lastSchedulerRun:    lastBriefing?.createdAt.toISOString() ?? null,
      timestamp:           new Date().toISOString(),
    })

  } catch (err) {
    console.error("[GET /api/n8n/status]", err)
    return NextResponse.json({ status: "error", db: "unreachable", timestamp: new Date().toISOString() }, { status: 500 })
  }
}
