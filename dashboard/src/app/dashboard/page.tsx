import { cookies }              from "next/headers"
import Link                     from "next/link"
import { prisma }               from "@/lib/db"
import { getSession }           from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import { S, row }               from "@/lib/ui"
import DashboardLive            from "./DashboardLive"
import SystemStatus             from "@/app/components/SystemStatus"
import type { Metadata }        from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Dashboard — NMI Automation OS" }

export default async function DashboardPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined
  const cw      = directFilter(cid)

  const [
    lowStock, printReady, unpaidRoyalties, missingCnps,
  ] = await Promise.all([
    prisma.product.findMany({ where: { stock: { lt: 10 } }, orderBy: { stock: "asc" }, select: { code: true, title: true, stock: true } }),
    prisma.manuscript.findMany({ where: { readyForPrint: true }, select: { id: true, title: true, author: true } }),
    prisma.royalty.findMany({ where: { status: "unpaid" }, select: { id: true, author: true, book: true, amount: true } }),
    prisma.worker.findMany({ where: { ...cw, cnpsNumber: "", contractType: { in: ["CDI","CDD"] } }, select: { id: true, name: true, contractType: true } }),
  ])

  const hasAlerts = lowStock.length > 0 || unpaidRoyalties.length > 0 || missingCnps.length > 0

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Dashboard</h1>

      {/* Live KPIs + welcome banner — auto-refreshes every 60s */}
      <DashboardLive name={session?.name ?? "Guest"} />

      {/* System status */}
      <div style={{ marginBottom: 24 }}>
        <SystemStatus />
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <>
          <h2 style={S.sectionTitle}>Alerts</h2>
          {missingCnps.map(w => (
            <div key={w.id} style={S.alertRed}>⚠ {w.name} ({w.contractType}) — CNPS number missing</div>
          ))}
          {lowStock.map(b => (
            <div key={b.code} style={b.stock === 0 ? S.alertRed : S.alertOrange}>
              ⚠ Low stock: {b.code} — {b.title} ({b.stock} units)
            </div>
          ))}
          {unpaidRoyalties.map(r => (
            <div key={r.id} style={S.alertOrange}>
              ⚠ Unpaid royalty: {r.author} — {r.book} — {Number(r.amount).toLocaleString()} XAF
            </div>
          ))}
        </>
      )}

      {/* Print queue */}
      {printReady.length > 0 && (
        <>
          <h2 style={S.sectionTitle}>Ready for Print ({printReady.length})</h2>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead><tr><th style={S.th}>Title</th><th style={S.th}>Author</th></tr></thead>
              <tbody>
                {printReady.map((m, i) => (
                  <tr key={m.id} style={row(i)}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{m.title}</td>
                    <td style={S.td}>{m.author || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Quick links */}
      <h2 style={S.sectionTitle}>Quick Links</h2>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        {[["Orders","/orders"],["Stock","/stock"],["Manuscripts","/manuscripts"],["Printing","/printing"],["Accounting","/accounting"],["HR","/hr"],["Finance","/finance"],["Royalties","/royalties"]].map(([label, href]) => (
          <Link key={href} href={href} style={{
            background: "#fff", border: "1px solid #e2e8f0", borderRadius: "6px",
            padding: "8px 16px", fontSize: "14px", color: "#2563eb", fontWeight: 600,
            textDecoration: "none",
          }}>{label}</Link>
        ))}
      </div>
    </div>
  )
}
