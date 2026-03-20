import { cookies }    from "next/headers"
import Link           from "next/link"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import { S, row }     from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const companyWhere = directFilter(cid)

  const [
    orderCount,
    revenueAgg,
    activeWorkerCount,
    pendingInvoiceCount,
    lowStockBooks,
    printReadyManuscripts,
    unpaidRoyalties,
    workersWithoutCnps,
  ] = await Promise.all([
    prisma.order.count({ where: companyWhere }),
    prisma.order.aggregate({ _sum: { total: true }, where: companyWhere }),
    prisma.worker.count({ where: { ...companyWhere, status: "active" } }),
    prisma.invoice.count({ where: { ...companyWhere, status: { not: "paid" } } }),
    prisma.product.findMany({ where: { stock: { lt: 10 } }, orderBy: { stock: "asc" }, select: { code: true, title: true, stock: true } }),
    prisma.manuscript.findMany({ where: { readyForPrint: true }, select: { id: true, title: true, author: true } }),
    prisma.royalty.findMany({ where: { status: "unpaid" }, select: { id: true, author: true, book: true, amount: true } }),
    prisma.worker.findMany({
      where: { ...companyWhere, cnpsNumber: "", contractType: { in: ["CDI", "CDD"] } },
      select: { id: true, name: true, contractType: true },
    }),
  ])

  const totalRevenue = Number(revenueAgg._sum.total ?? 0)

  return (
    <div style={S.page}>

      <h1 style={S.heading}>Dashboard</h1>
      <p style={S.subtitle}>Live overview — all data is company-scoped and real-time</p>

      {/* ── KPI bar ──────────────────────────────────────────────────────── */}
      <div style={S.statBar}>
        {[
          { label: "Orders",            value: orderCount },
          { label: "Revenue (XAF)",     value: totalRevenue.toLocaleString() },
          { label: "Active Workers",    value: activeWorkerCount },
          { label: "Pending Invoices",  value: pendingInvoiceCount },
          { label: "Low Stock Titles",  value: lowStockBooks.length },
          { label: "Print Ready",       value: printReadyManuscripts.length },
          { label: "Unpaid Royalties",  value: unpaidRoyalties.length },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={S.statLabel}>{s.label}</div>
            <div style={S.statValue}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Quick links ──────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Quick Links</h2>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
        {["/orders","/stock","/manuscripts","/printing","/accounting","/hr","/customers","/royalties","/authors"].map(href => (
          <Link key={href} href={href}>
            <button style={{ padding: "8px 16px", cursor: "pointer" }}>{href.slice(1).charAt(0).toUpperCase() + href.slice(2)}</button>
          </Link>
        ))}
      </div>

      {/* ── Alerts ───────────────────────────────────────────────────────── */}
      {(lowStockBooks.length > 0 || unpaidRoyalties.length > 0 || workersWithoutCnps.length > 0) && (
        <>
          <h2 style={S.sectionTitle}>Alerts</h2>
          {workersWithoutCnps.map(w => (
            <div key={w.id} style={S.alertBox}>⚠ {w.name} ({w.contractType}) — CNPS number missing</div>
          ))}
          {lowStockBooks.map(b => (
            <div key={b.code} style={{ ...S.alertBox, borderLeftColor: "#d97706", background: "#fffbeb", color: "#78350f" }}>
              ⚠ Low stock: {b.code} — {b.title} ({b.stock} units)
            </div>
          ))}
          {unpaidRoyalties.map(r => (
            <div key={r.id} style={{ ...S.alertBox, borderLeftColor: "#2563eb", background: "#eff6ff", color: "#1e3a8a" }}>
              ⚠ Unpaid royalty: {r.author} — {r.book} — {Number(r.amount).toLocaleString()} XAF
            </div>
          ))}
        </>
      )}

      {/* ── Print queue ──────────────────────────────────────────────────── */}
      {printReadyManuscripts.length > 0 && (
        <>
          <h2 style={S.sectionTitle}>Ready for Print</h2>
          {printReadyManuscripts.map(m => (
            <div key={m.id} style={{ padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: "13px" }}>
              📄 {m.title} — <span style={S.mutedText}>{m.author || "unknown author"}</span>
            </div>
          ))}
        </>
      )}

      {/* ── Reports ──────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Reports</h2>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[["Accounting", "/accounting"], ["Royalties", "/royalties"], ["Printing", "/printing"], ["HR", "/hr"], ["Finance", "/finance"]].map(([label, href]) => (
          <Link key={href} href={href}>
            <button style={{ padding: "8px 16px", cursor: "pointer" }}>{label}</button>
          </Link>
        ))}
      </div>

    </div>
  )
}
