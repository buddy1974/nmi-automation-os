import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

// ── Password ──────────────────────────────────────────────────────────────────

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10)
}

export async function checkPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash)
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export interface SessionPayload extends JWTPayload {
  id:        string
  email:     string
  name:      string
  role:      string
  companyId?: string   // null = owner / admin (sees all companies)
}

export async function createToken(payload: Omit<SessionPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as SessionPayload
  } catch {
    return null
  }
}

// ── Session helper (for server components + actions) ──────────────────────────

export async function getSession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null
  return verifyToken(token)
}

// ── Role permissions ──────────────────────────────────────────────────────────
// Used in middleware (duplicated there for Edge compatibility) and in pages.

export const ROLE_ACCESS: Record<string, string[]> = {
  admin:      ["*"],
  manager:    ["/", "/dashboard", "/orders", "/invoices", "/finance", "/customers", "/stock", "/catalogue", "/sales", "/exec"],
  accountant: ["/", "/dashboard", "/finance", "/invoices", "/royalties", "/accounting"],
  editor:     ["/", "/dashboard", "/manuscripts", "/authors", "/editorial"],
  printer:    ["/", "/dashboard", "/printing", "/stock"],
  hr:         ["/", "/dashboard", "/hr", "/users"],
  viewer:     ["/", "/dashboard"],
}

export function canAccess(role: string, pathname: string): boolean {
  if (role === "admin") return true
  const allowed = ROLE_ACCESS[role] ?? []
  return allowed.some((path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path)
  )
}

// ── Multi-company filter ───────────────────────────────────────────────────────
// Returns a Prisma `where` fragment that scopes queries to the user's company.
// Owner / admin (companyId = undefined) returns {} → sees all records.
//
// Usage:
//   const filter = companyFilter(session)
//   const orders = await prisma.order.findMany({ where: filter })

// Returns the active companyId to use for DB queries.
// - Non-admin/owner → always their own companyId (cookie ignored)
// - Admin/owner + cookie "all" → undefined (no filter)
// - Admin/owner + cookie set → that companyId
export function getActiveCompanyId(
  session:      SessionPayload,
  cookieValue?: string,         // value of nmi_company cookie
): string | undefined {
  if (session.role !== "admin" && session.role !== "owner" && session.role !== "manager") {
    return session.companyId ?? undefined
  }
  if (!cookieValue || cookieValue === "all") return undefined
  return cookieValue
}

export function companyFilter(
  session:      SessionPayload,
  cookieValue?: string,
): { companyId?: string } {
  const id = getActiveCompanyId(session, cookieValue)
  return id ? { companyId: id } : {}
}
