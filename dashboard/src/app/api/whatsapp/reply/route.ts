import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"

export const runtime = "nodejs"

// ── POST /api/whatsapp/reply — staff manual reply ─────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { messageId, reply } = await req.json()

    if (!messageId || !reply?.trim()) {
      return NextResponse.json({ error: "messageId and reply are required", code: "VALIDATION" }, { status: 400 })
    }

    const msg = await prisma.whatsAppMessage.findUnique({ where: { id: messageId } })
    if (!msg) {
      return NextResponse.json({ error: "Message not found", code: "NOT_FOUND" }, { status: 404 })
    }

    const updated = await prisma.whatsAppMessage.update({
      where: { id: messageId },
      data:  { reply, status: "replied", handled: true, handledBy: auth.name },
    })

    return NextResponse.json(updated)

  } catch (err) {
    console.error("[POST /api/whatsapp/reply]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
