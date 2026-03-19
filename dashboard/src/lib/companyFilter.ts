// ── Multi-company filter helpers ──────────────────────────────────────────────
// Used by all dashboard pages to scope queries to the active company.
//
// Filter resolution:
//   owner/admin + cookie "all" (or no cookie) → no filter → see everything
//   owner/admin + cookie = companyId           → filter by that company
//   non-owner                                  → always filter by session.companyId
//
// Usage:
//   const cid    = resolveCompany(session, jar.get("nmi_company")?.value)
//   const where  = perfFilter(cid)             // for PerformanceRecord (via worker)
//   const where2 = directFilter(cid)           // for Worker / Order / Invoice

import type { SessionPayload } from "./auth"

const OWNER_ROLES = ["admin", "owner", "manager"]

/** Returns the active companyId string, or undefined (= no filter). */
export function resolveCompany(
  session:     SessionPayload,
  cookieValue?: string,
): string | undefined {
  if (!OWNER_ROLES.includes(session.role)) {
    // Non-owner: always locked to their own company
    return session.companyId ?? undefined
  }
  // Owner/admin: use cookie selection
  if (!cookieValue || cookieValue === "all") return undefined
  return cookieValue
}

/** Prisma where fragment for models with a direct companyId column (Worker, Order, Invoice). */
export function directFilter(companyId?: string): { companyId?: string } {
  return companyId ? { companyId } : {}
}

/** Prisma where fragment for PerformanceRecord (no companyId — scoped via worker). */
export function perfFilter(companyId?: string): { worker?: { companyId: string } } {
  return companyId ? { worker: { companyId } } : {}
}
