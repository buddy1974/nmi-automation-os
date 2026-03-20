import Link            from "next/link"
import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany } from "@/lib/companyFilter"
import EmailTable     from "./EmailTable"

export const dynamic = "force-dynamic"

function statCard(label: string, value: number | string, color = "#374151") {
  return (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: "16px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 4 }}>{label.toUpperCase()}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

export default async function EmailPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const emails = await prisma.emailLog.findMany({
    where:   cid ? { companyId: cid } : {},
    orderBy: { createdAt: "desc" },
    take:    200,
  })

  const total     = emails.length
  const urgent    = emails.filter(e => e.priority === "urgent").length
  const unhandled = emails.filter(e => !e.handled).length

  const byCat = emails.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={{ padding: 32, maxWidth: 1300, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>Email Intelligence</h1>
          <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
            AI-classified incoming emails — auto-routed to departments
          </p>
        </div>
        <Link
          href="/email/compose"
          style={{ background: "#1a1a2e", color: "#fff", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
        >
          + Test Classifier
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 28 }}>
        {statCard("Total", total)}
        {statCard("Urgent",    urgent,    urgent > 0    ? "#dc2626" : "#374151")}
        {statCard("Unhandled", unhandled, unhandled > 0 ? "#d97706" : "#16a34a")}
        {statCard("Sales",      byCat.sales      ?? 0, "#16a34a")}
        {statCard("CEO",        byCat.ceo        ?? 0, "#1a1a2e")}
        {statCard("HR",         byCat.hr         ?? 0, "#9333ea")}
      </div>

      {/* Category breakdown */}
      {total > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {Object.entries(byCat)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, count]) => (
              <span key={cat} style={{ background: "#f3f4f6", color: "#374151", padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
                {cat} <span style={{ color: "#9ca3af" }}>({count})</span>
              </span>
            ))
          }
        </div>
      )}

      {total === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          No emails classified yet.{" "}
          <Link href="/email/compose" style={{ color: "#2563eb" }}>Test the classifier →</Link>
        </div>
      ) : (
        <EmailTable emails={emails} />
      )}
    </div>
  )
}
