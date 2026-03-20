import { NextRequest, NextResponse } from "next/server"
import { requireAuth }               from "@/lib/api-auth"
import { getRecentEmails, searchEmails, getEmailBody } from "@/lib/gmail"

const ALLOWED = ["owner", "admin"]

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  if (!ALLOWED.includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const query     = searchParams.get("q")
  const messageId = searchParams.get("id")

  try {
    if (messageId) {
      const msg = await getEmailBody(auth.id, messageId)
      return NextResponse.json(msg)
    }
    if (query) {
      const msgs = await searchEmails(auth.id, query)
      return NextResponse.json({ messages: msgs })
    }
    const msgs = await getRecentEmails(auth.id, 20)
    return NextResponse.json({ messages: msgs })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch emails"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
