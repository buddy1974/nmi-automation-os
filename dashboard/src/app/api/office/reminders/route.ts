import { NextResponse }      from "next/server"
import { requireAuth }        from "@/lib/api-auth"
import { getTodayEvents }     from "@/lib/calendar"
import type { CalendarEvent } from "@/lib/calendar"

const ALLOWED = ["owner", "admin"]

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  if (!ALLOWED.includes(auth.role)) {
    return NextResponse.json({ reminders: [] })
  }

  try {
    const events = await getTodayEvents(auth.id)
    const now    = Date.now()
    const soon   = now + 30 * 60 * 1000 // 30 minutes

    const reminders = events.filter((e: CalendarEvent) => {
      const start = e.start.dateTime ? new Date(e.start.dateTime).getTime() : null
      return start && start > now && start <= soon
    })

    return NextResponse.json({ reminders })
  } catch {
    // Not connected — silently return empty
    return NextResponse.json({ reminders: [] })
  }
}
