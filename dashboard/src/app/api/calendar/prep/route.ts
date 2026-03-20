import { NextRequest, NextResponse }  from "next/server"
import { requireAuth }                 from "@/lib/api-auth"
import { getMeetingPrepNotes }         from "@/lib/calendar"
import type { CalendarEvent }          from "@/lib/calendar"

const ALLOWED = ["owner", "admin"]

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  if (!ALLOWED.includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const event: CalendarEvent = await req.json()
  try {
    const notes = await getMeetingPrepNotes(event)
    return NextResponse.json({ notes })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate prep notes"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
