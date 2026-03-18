import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

// Edge-compatible — jose only (no bcryptjs, no Prisma, no auth.ts import)
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

// ── Public routes (no auth required) ─────────────────────────────────────────
const PUBLIC = ["/login"]

// ── Role → allowed path prefixes ─────────────────────────────────────────────
// Keep in sync with ROLE_ACCESS in src/lib/auth.ts
const ROLE_ACCESS: Record<string, string[]> = {
  admin:      ["*"],
  manager:    ["/", "/dashboard", "/orders", "/invoices", "/finance", "/customers", "/stock", "/catalogue", "/sales", "/exec"],
  accountant: ["/", "/dashboard", "/finance", "/invoices", "/royalties", "/accounting"],
  editor:     ["/", "/dashboard", "/manuscripts", "/authors", "/editorial"],
  printer:    ["/", "/dashboard", "/printing", "/stock"],
  hr:         ["/", "/dashboard", "/hr", "/users"],
  viewer:     ["/", "/dashboard"],
}

function canAccess(role: string, pathname: string): boolean {
  if (role === "admin") return true
  const allowed = ROLE_ACCESS[role] ?? []
  return allowed.some((path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path)
  )
}

// ── Middleware ────────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always pass public routes
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get("nmi_session")?.value

  // Not logged in → login page
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    const role = (payload.role as string) ?? "viewer"

    // Logged in but role not allowed → back to dashboard
    if (!canAccess(role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()

  } catch {
    // Token expired or tampered → clear + redirect to login
    const res = NextResponse.redirect(new URL("/login", req.url))
    res.cookies.delete("nmi_session")
    return res
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
