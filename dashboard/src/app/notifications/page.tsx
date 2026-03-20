import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany } from "@/lib/companyFilter"
import { S, badge }   from "@/lib/ui"
import { markAsRead, markAllAsRead } from "./actions"

export const dynamic = "force-dynamic"

const SEVERITY_ORDER = { high: 0, medium: 1, info: 2 }
const TYPE_LABEL: Record<string, string> = {
  low_stock_alert:  "Stock Alert",
  royalty_reminder: "Royalty",
  performance_alert:"Performance",
}

function severityBadgeVariant(severity: string): "red" | "orange" | "blue" | "grey" {
  if (severity === "high")   return "red"
  if (severity === "medium") return "orange"
  if (severity === "info")   return "blue"
  return "grey"
}

function relativeTime(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 60)  return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  return `${days}d ago`
}

export default async function NotificationsPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const notifications = await prisma.notification.findMany({
    where:   cid && cid !== "all" ? { companyId: cid } : {},
    orderBy: { createdAt: "desc" },
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const highCount   = notifications.filter(n => n.severity === "high" && !n.read).length

  // Group by severity for display order
  const high   = notifications.filter(n => n.severity === "high")
  const medium = notifications.filter(n => n.severity === "medium")
  const info   = notifications.filter(n => n.severity === "info" || !["high","medium"].includes(n.severity))

  const sections = [
    { label: "High Priority", color: "#ef4444", bg: "#fef2f2", items: high },
    { label: "Medium",        color: "#f97316", bg: "#fff7ed", items: medium },
    { label: "Info",          color: "#2563eb", bg: "#eff6ff", items: info },
  ].filter(s => s.items.length > 0)

  return (
    <div style={S.page}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "8px" }}>
        <div>
          <h1 style={S.heading}>Notifications</h1>
          <p style={S.subtitle}>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}${highCount > 0 ? ` — ${highCount} high priority` : ""}`
              : "All caught up — no unread notifications"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllAsRead.bind(null, cid && cid !== "all" ? cid : undefined)}>
            <button
              type="submit"
              style={{
                marginTop:    "4px",
                padding:      "8px 16px",
                fontSize:     "13px",
                fontWeight:   600,
                background:   "#f1f5f9",
                color:        "#475569",
                border:       "1px solid #e2e8f0",
                borderRadius: "6px",
                cursor:       "pointer",
              }}
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div style={S.statBar}>
        <div style={S.statCard}>
          <div style={S.statValue}>{notifications.length}</div>
          <div style={S.statLabel}>Total</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#ef4444" }}>{unreadCount}</div>
          <div style={S.statLabel}>Unread</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#ef4444" }}>{high.length}</div>
          <div style={S.statLabel}>High Priority</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#f97316" }}>{medium.length}</div>
          <div style={S.statLabel}>Medium</div>
        </div>
      </div>

      {notifications.length === 0 ? (
        <p style={S.mutedText}>No notifications yet. Run the scheduler to scan for alerts.</p>
      ) : (
        sections.map(section => (
          <div key={section.label} style={{ marginBottom: "28px" }}>
            {/* Section header */}
            <div style={{
              display:      "flex",
              alignItems:   "center",
              gap:          "8px",
              marginBottom: "10px",
              paddingBottom:"6px",
              borderBottom: `2px solid ${section.color}`,
            }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: section.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {section.label}
              </span>
              <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                ({section.items.filter(n => !n.read).length} unread of {section.items.length})
              </span>
            </div>

            {/* Notification cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {section.items.map(n => (
                <div
                  key={n.id}
                  style={{
                    display:      "flex",
                    alignItems:   "flex-start",
                    gap:          "14px",
                    background:   n.read ? "#fafafa" : "#fff",
                    border:       `1px solid ${n.read ? "#f1f5f9" : "#e2e8f0"}`,
                    borderLeft:   `4px solid ${n.read ? "#e2e8f0" : section.color}`,
                    borderRadius: "7px",
                    padding:      "12px 16px",
                    opacity:      n.read ? 0.6 : 1,
                  }}
                >
                  {/* Left: type badge + severity */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", flexShrink: 0, paddingTop: "2px" }}>
                    <span style={badge(severityBadgeVariant(n.severity))}>{n.severity}</span>
                    <span style={{ fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>
                      {TYPE_LABEL[n.type] ?? n.type}
                    </span>
                  </div>

                  {/* Centre: title + message */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: n.read ? 400 : 700, fontSize: "14px", color: "#1e293b", marginBottom: "3px" }}>
                      {n.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>
                      {relativeTime(n.createdAt)}
                    </div>
                  </div>

                  {/* Right: mark as read */}
                  {!n.read && (
                    <form action={markAsRead.bind(null, n.id)} style={{ flexShrink: 0 }}>
                      <button
                        type="submit"
                        title="Mark as read"
                        style={{
                          padding:      "4px 10px",
                          fontSize:     "11px",
                          fontWeight:   600,
                          background:   "#f1f5f9",
                          color:        "#475569",
                          border:       "1px solid #e2e8f0",
                          borderRadius: "5px",
                          cursor:       "pointer",
                          whiteSpace:   "nowrap",
                        }}
                      >
                        ✓ Read
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
