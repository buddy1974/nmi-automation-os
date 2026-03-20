import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"

function getIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
}

// ── POST /api/work/clock ──────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { action, note } = await req.json() as { action: "in" | "out"; note?: string }

    if (action !== "in" && action !== "out") {
      return NextResponse.json({ error: "action must be 'in' or 'out'", code: "VALIDATION" }, { status: 400 })
    }

    if (action === "in") {
      // Check not already clocked in
      const open = await prisma.workSession.findFirst({
        where:   { workerId: auth.id, clockOut: null },
        orderBy: { clockIn: "desc" },
      })
      if (open) {
        return NextResponse.json({ error: "Already clocked in", code: "CONFLICT", session: open }, { status: 409 })
      }

      const session = await prisma.workSession.create({
        data: {
          workerId:  auth.id,
          clockIn:   new Date(),
          note:      note ?? null,
          companyId: auth.companyId ?? null,
        },
      })
      return NextResponse.json({ action: "in", session }, { status: 201 })
    }

    // action === "out"
    const open = await prisma.workSession.findFirst({
      where:   { workerId: auth.id, clockOut: null },
      orderBy: { clockIn: "desc" },
    })
    if (!open) {
      return NextResponse.json({ error: "No active clock-in found", code: "NOT_FOUND" }, { status: 404 })
    }

    const clockOut   = new Date()
    const hoursTotal = (clockOut.getTime() - open.clockIn.getTime()) / 3_600_000

    const session = await prisma.workSession.update({
      where: { id: open.id },
      data:  {
        clockOut,
        hoursTotal: Math.round(hoursTotal * 100) / 100,
        note:       note ?? open.note,
      },
    })
    return NextResponse.json({ action: "out", session })

  } catch (err) {
    console.error("[POST /api/work/clock]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
