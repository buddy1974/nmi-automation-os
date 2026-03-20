import { NextResponse }          from "next/server"
import { generateWhatsAppReply, saveMessage } from "@/lib/whatsappAgent"

export const runtime = "nodejs"

// ── GET /api/whatsapp/webhook — verification handshake ────────────────────────

export async function GET(req: Request) {
  const url    = new URL(req.url)
  const mode   = url.searchParams.get("hub.mode")
  const token  = url.searchParams.get("hub.verify_token")
  const challenge = url.searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp] Webhook verified")
    return new Response(challenge ?? "ok", { status: 200 })
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 })
}

// ── POST /api/whatsapp/webhook — incoming message ─────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Extract message from WhatsApp Cloud API payload format
    const entry   = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value   = changes?.value
    const msgObj  = value?.messages?.[0]

    if (!msgObj) {
      // Not a message event (could be status update) — acknowledge silently
      return NextResponse.json({ ok: true })
    }

    const from         = String(msgObj.from ?? "unknown")
    const messageText  = msgObj.text?.body ?? msgObj.type ?? "(non-text message)"
    const contactName  = value?.contacts?.[0]?.profile?.name ?? undefined

    const reply = await generateWhatsAppReply(messageText)

    await saveMessage({ from, customerName: contactName, message: messageText, reply })

    // Return reply for n8n to forward back to WhatsApp
    return NextResponse.json({ ok: true, from, reply })

  } catch (err) {
    console.error("[POST /api/whatsapp/webhook]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
