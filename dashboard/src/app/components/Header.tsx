import { cookies }          from "next/headers"
import { getSession }        from "@/lib/auth"
import { prisma }            from "@/lib/db"
import CompanySelector       from "@/components/CompanySelector"
import Link                  from "next/link"

const OWNER_ROLES = ["admin", "owner", "manager"]

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

      {/* Right: notification bell + user info */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>

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

        <div style={{ fontSize: "13px", color: "#555", fontFamily: "Arial, sans-serif" }}>
          {session ? `${session.name} · ${session.role}` : "Not logged in"}
        </div>

      </div>

    </div>
  )
}
