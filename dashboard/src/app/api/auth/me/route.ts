import { NextResponse } from "next/server"
import { requireAuth }  from "@/lib/api-auth"

// ── GET /api/auth/me — returns current session identity ───────────────────────
// Used by client components (e.g. ChatWidget) that need to know who is logged in.

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  return NextResponse.json({
    id:        auth.id,
    name:      auth.name,
    role:      auth.role,
    companyId: auth.companyId ?? null,
  })
}
