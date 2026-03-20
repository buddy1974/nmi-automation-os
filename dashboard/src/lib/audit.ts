import { prisma } from "@/lib/db"

type AuditParams = {
  userId?:  string
  action:   string   // e.g. "LOGIN_SUCCESS", "ORDER_CREATE"
  entity:   string   // e.g. "user", "order", "invoice"
  entityId?: string
  details?: string
  ip?:      string
}

/** Write an audit log entry. Never throws — audit failure is non-fatal. */
export async function auditLog(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({ data: params })
  } catch {
    // Non-fatal: log to stderr but do not crash the request
    console.error("[audit] Failed to write audit log:", params.action, params.entity)
  }
}
