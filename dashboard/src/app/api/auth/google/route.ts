import { NextResponse }  from "next/server"
import { requireAuth }   from "@/lib/api-auth"
import { getAuthUrl }    from "@/lib/google"

const ALLOWED = ["owner", "admin"]

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth
  if (!ALLOWED.includes(auth.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = getAuthUrl(auth.id)
  return NextResponse.redirect(url)
}
