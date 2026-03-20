import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import { S, row }     from "@/lib/ui"

export const dynamic = "force-dynamic"

const STATUS_COLOR: Record<string, string> = {
  pending:   "#d97706",
  confirmed: "#2563eb",
  shipped:   "#7c3aed",
  delivered: "#16a34a",
  cancelled: "#dc2626",
}

export default async function SalesPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const orders = await prisma.order.findMany({
    where:   directFilter(cid),
    include: { branch: true },
    orderBy: { id: "desc" },
  })

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0)
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div style={S.page}>

      <h1 style={S.heading}>Sales</h1>
      <p style={S.subtitle}>All orders — company-scoped, sorted by most recent</p>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statLabel}>Total Orders</div><div style={S.statValue}>{orders.length}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Total Revenue (XAF)</div><div style={{ ...S.statValue, color: "#16a34a" }}>{totalRevenue.toLocaleString()}</div></div>
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} style={S.statCard}>
            <div style={S.statLabel}>{status}</div>
            <div style={{ ...S.statValue, fontSize: "18px" }}>{count}</div>
          </div>
        ))}
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>{["Order #","Customer","Branch","Date","Status","Total (XAF)"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: "center", color: "#94a3b8" }}>No orders found</td></tr>
            ) : (
              orders.map((o, i) => (
                <tr key={o.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{o.number}</td>
                  <td style={S.td}>{o.customerName}</td>
                  <td style={S.td}>{o.branch?.name ?? "—"}</td>
                  <td style={S.td}>{new Date(o.date).toLocaleDateString()}</td>
                  <td style={S.td}>
                    <span style={S.badge(STATUS_COLOR[o.status] ?? "#888")}>{o.status}</span>
                  </td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{Number(o.total).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
