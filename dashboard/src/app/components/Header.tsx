import { cookies }          from "next/headers"
import { getSession }        from "@/lib/auth"
import { prisma }            from "@/lib/db"
import CompanySelector       from "@/components/CompanySelector"

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

      {/* Right: user info */}
      <div style={{ fontSize: "13px", color: "#555", flexShrink: 0, fontFamily: "Arial, sans-serif" }}>
        {session ? `${session.name} · ${session.role}` : "Not logged in"}
      </div>

    </div>
  )
}
