import { NextRequest, NextResponse } from "next/server"
import { requireAuth }               from "@/lib/api-auth"
import { sendEmail, draftEmail }     from "@/lib/gmail"

const ALLOWED = ["owner", "admin"]

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  if (!ALLOWED.includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { to, subject, body, draft } = await req.json() as {
    to: string; subject: string; body: string; draft?: boolean
  }

  if (!to || !subject || !body) {
    return NextResponse.json({ error: "Missing to, subject, or body" }, { status: 400 })
  }

  try {
    if (draft) {
      const id = await draftEmail(auth.id, { to, subject, body })
      return NextResponse.json({ id, mode: "draft" })
    }
    const id = await sendEmail(auth.id, { to, subject, body })
    return NextResponse.json({ id, mode: "sent" })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send email"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
