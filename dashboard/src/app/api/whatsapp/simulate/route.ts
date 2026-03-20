import { NextResponse }          from "next/server"
import { checkRateLimit }         from "@/lib/rateLimit"
import { generateWhatsAppReply, saveMessage } from "@/lib/whatsappAgent"

export const runtime = "nodejs"

// ── POST /api/whatsapp/simulate — test pipeline without real WhatsApp ──────────

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const { from, customerName, message } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: "message is required", code: "VALIDATION" }, { status: 400 })
    }

    const reply = await generateWhatsAppReply(String(message))

    const saved = await saveMessage({
      from:         String(from ?? "+237000000000"),
      customerName: customerName ? String(customerName) : undefined,
      message:      String(message),
      reply,
    })

    return NextResponse.json({ message: saved, reply })

  } catch (err) {
    console.error("[POST /api/whatsapp/simulate]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
