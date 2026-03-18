import { NextResponse }  from "next/server"
import { cookies }       from "next/headers"
import { verifyToken }   from "@/lib/auth"

export async function GET() {

  const jar   = await cookies()
  const token = jar.get("nmi_session")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user = await verifyToken(token)

  if (!user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  return NextResponse.json({
    ok:   true,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
}
