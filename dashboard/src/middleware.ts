import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

// Edge-compatible: jose works on Edge, bcryptjs does not — so no import from auth.ts here
const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

// Routes that do NOT require authentication
const PUBLIC = ["/login"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow public routes
  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const token = req.cookies.get("nmi_session")?.value

  // No cookie → redirect to login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Verify JWT
  try {
    await jwtVerify(token, secret)
    return NextResponse.next()
  } catch {
    // Token expired or tampered → clear cookie and redirect
    const res = NextResponse.redirect(new URL("/login", req.url))
    res.cookies.delete("nmi_session")
    return res
  }
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
