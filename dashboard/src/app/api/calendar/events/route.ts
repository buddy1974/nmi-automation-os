import { NextResponse }                  from "next/server"
import { requireAuth }                    from "@/lib/api-auth"
import { getTodayEvents, getWeekEvents }  from "@/lib/calendar"

const ALLOWED = ["owner", "admin"]

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  if (!ALLOWED.includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const [today, week] = await Promise.all([
      getTodayEvents(auth.id),
      getWeekEvents(auth.id),
    ])
    return NextResponse.json({ today, week })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch events"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
