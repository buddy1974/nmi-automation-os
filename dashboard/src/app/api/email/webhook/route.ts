import { NextResponse }  from "next/server"
import { classifyEmail } from "@/lib/emailClassifier"

export const runtime = "nodejs"

// ── POST /api/email/webhook ────────────────────────────────────────────────────
// Called by Gmail, Outlook, n8n, or any external email service.
// Requires x-nmi-webhook-secret header matching NMI_WEBHOOK_SECRET env var.

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-nmi-webhook-secret")
    if (!secret || secret !== process.env.NMI_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized", code: "UNAUTHORIZED" }, { status: 401 })
    }

    const data = await req.json()

    if (!data.from || !data.subject) {
      return NextResponse.json({ error: "from and subject are required", code: "VALIDATION" }, { status: 400 })
    }

    const result = await classifyEmail({
      from:      String(data.from),
      subject:   String(data.subject),
      body:      data.body      ? String(data.body)      : undefined,
      companyId: data.companyId ? String(data.companyId) : undefined,
    })

    return NextResponse.json({ ok: true, id: result.log.id, classification: result.classification })

  } catch (err) {
    console.error("[POST /api/email/webhook]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
