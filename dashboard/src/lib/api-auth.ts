import { cookies }                     from "next/headers"
import { NextResponse }                from "next/server"
import { verifyToken, type SessionPayload } from "./auth"

/**
 * Call at the top of every API route handler.
 * Returns the session payload on success, or a ready-made 401 NextResponse.
 *
 * Usage:
 *   const auth = await requireAuth()
 *   if (auth instanceof NextResponse) return auth
 *   // auth.role, auth.id, etc.
 */
export async function requireAuth(): Promise<SessionPayload | NextResponse> {
  const jar   = await cookies()
  const token = jar.get("nmi_session")?.value

  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user = await verifyToken(token)

  if (!user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  return user
}
