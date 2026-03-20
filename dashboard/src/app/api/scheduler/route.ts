import { NextResponse }              from "next/server"
import { runScheduler, runAlertScan } from "@/lib/scheduler"
import { requireAuth }               from "@/lib/api-auth"
import { checkRateLimit }            from "@/lib/rateLimit"

// ── GET /api/scheduler — run pending jobs + DB alert scan ─────────────────────
// Trigger manually or via external cron (e.g. Vercel cron, uptime monitor).

export async function GET(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (auth.role !== "admin" && auth.role !== "manager") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    // Run pending automation jobs
    const jobSummary = await runScheduler()

    // Scan DB for current alert conditions and create notifications
    const alertSummary = await runAlertScan()

    return NextResponse.json({
      ok:        true,
      jobs:      jobSummary,
      triggered: alertSummary.triggered,
      alerts:    alertSummary.alerts,
    })
  } catch (err) {
    console.error("[GET /api/scheduler]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
