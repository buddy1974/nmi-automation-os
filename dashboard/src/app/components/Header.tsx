import { cookies }          from "next/headers"
import { getSession }        from "@/lib/auth"
import { prisma }            from "@/lib/db"
import CompanySelector       from "@/components/CompanySelector"
import Link                  from "next/link"

const OWNER_ROLES = ["admin", "owner", "manager"]

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  owner:   { bg: "#fdf4ff", color: "#9333ea" },
  admin:   { bg: "#eff6ff", color: "#1a73e8" },
  manager: { bg: "#fff7ed", color: "#ea580c" },
  hr:      { bg: "#f0fdfa", color: "#0d9488" },
  staff:   { bg: "#f9fafb", color: "#6b7280" },
}

function RoleBadge({ role }: { role: string }) {
  const s = ROLE_COLORS[role] ?? ROLE_COLORS.staff
  return (
    <span style={{
      background:   s.bg,
      color:        s.color,
      border:       `1px solid ${s.color}33`,
      borderRadius: "999px",
      padding:      "2px 10px",
      fontSize:     "11px",
      fontWeight:   700,
      textTransform:"uppercase",
      letterSpacing:"0.05em",
    }}>
      {role}
    </span>
  )
}

export default async function Header() {
  const jar             = await cookies()
  const session         = await getSession(jar.get("nmi_session")?.value)
  const activeCompanyId = jar.get("nmi_company")?.value ?? session?.companyId ?? "all"

  const isOwner = session ? OWNER_ROLES.includes(session.role) : false

  // Load companies (only needed for dropdown)
  const companies = isOwner
    ? await prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } })
    : []

  // Resolve display name for non-owner badge
  let companyName: string | undefined
  if (!isOwner && session?.companyId) {
    const c = await prisma.company.findUnique({ where: { id: session.companyId } })
    companyName = c?.name
  }

  // Unread notification count
  const unreadCount = session
    ? await prisma.notification.count({ where: { read: false } })
    : 0

  return (
    <div style={{
      height:         60,
      borderBottom:   "1px solid #ddd",
      display:        "flex",
      alignItems:     "center",
      justifyContent: "space-between",
      padding:        "0 20px",
      background:     "#fff",
      gap:            "16px",
    }}>

      {/* Left: brand */}
      <div style={{ fontWeight: 700, fontSize: "15px", flexShrink: 0 }}>
        NMI Automation OS
      </div>

      {/* Centre: company selector */}
      {session && (
        <CompanySelector
          companies={companies.map(c => ({ id: c.id, name: c.name, city: c.city }))}
          activeCompanyId={activeCompanyId}
          isOwner={isOwner}
          companyName={companyName}
        />
      )}

      {/* Right: command palette hint + notification bell + user info */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>

        {session && (
          <Link
            href="/office"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "6px",
              padding:        "0 12px",
              height:         "34px",
              borderRadius:   "8px",
              background:     "#f8fafc",
              border:         "1px solid #e2e8f0",
              textDecoration: "none",
              fontSize:       "12px",
              color:          "#94a3b8",
              flexShrink:     0,
            }}
            title="Open Command Palette (Ctrl+K)"
          >
            <span>🔍</span>
            <span style={{ fontSize: 11 }}>Ctrl+K</span>
          </Link>
        )}

        {session && (
          <Link
            href="/notifications"
            style={{
              position:       "relative",
              display:        "inline-flex",
              alignItems:     "center",
              justifyContent: "center",
              width:          "34px",
              height:         "34px",
              borderRadius:   "8px",
              background:     unreadCount > 0 ? "#fef2f2" : "#f8fafc",
              border:         `1px solid ${unreadCount > 0 ? "#fecaca" : "#e2e8f0"}`,
              textDecoration: "none",
              fontSize:       "18px",
              flexShrink:     0,
            }}
            title={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position:      "absolute",
                top:           "-5px",
                right:         "-5px",
                minWidth:      "16px",
                height:        "16px",
                padding:       "0 4px",
                borderRadius:  "999px",
                background:    "#ef4444",
                color:         "#fff",
                fontSize:      "10px",
                fontWeight:    700,
                lineHeight:    "16px",
                textAlign:     "center",
              }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        )}

        {session && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "#374151", fontWeight: 600 }}>{session.name}</span>
            <RoleBadge role={session.role} />
          </div>
        )}

      </div>

    </div>
  )
}
