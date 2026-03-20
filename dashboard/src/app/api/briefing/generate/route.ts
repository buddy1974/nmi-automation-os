import { NextResponse }          from "next/server"
import { requireAuth }           from "@/lib/api-auth"
import { checkRateLimit }        from "@/lib/rateLimit"
import { prisma }                from "@/lib/db"
import { generateDailyBriefing } from "@/lib/briefing"

export const runtime = "nodejs"

// ── POST /api/briefing/generate ───────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (!["admin", "owner"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden — owner/admin only", code: "FORBIDDEN" }, { status: 403 })
    }

    const { briefing, data } = await generateDailyBriefing(auth.companyId ?? undefined)

    const dateStr = data.date
    const notif   = await prisma.notification.create({
      data: {
        type:      "daily_briefing",
        title:     `CEO Morning Briefing — ${dateStr}`,
        message:   briefing,
        severity:  data.urgentNotifs > 0 || data.urgentEmails > 0 ? "high" : "info",
        companyId: auth.companyId ?? null,
      },
    })

    return NextResponse.json({ briefing, data, notificationId: notif.id }, { status: 201 })

  } catch (err) {
    console.error("[POST /api/briefing/generate]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
