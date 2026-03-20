import { cookies }           from "next/headers"
import { prisma }            from "@/lib/db"
import { getSession }        from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import { S, row, statusBadge } from "@/lib/ui"
import OrderForm             from "./OrderForm"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const [dbProducts, dbCustomers, savedOrders] = await Promise.all([
    prisma.product.findMany({ orderBy: { code: "asc" } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.order.findMany({
      where:   directFilter(cid),
      include: { items: true },
      orderBy: { id: "desc" },
    }),
  ])

  const products  = dbProducts.map(p => ({ id: p.id, code: p.code, title: p.title, price: Number(p.price), stock: p.stock }))
  const customers = dbCustomers.map(c => ({ id: c.id, name: c.name }))

  const totalRevenue = savedOrders.reduce((s, o) => s + Number(o.total), 0)

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Orders</h1>
      <p style={S.subtitle}>Manage and track all customer orders — company-scoped</p>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statValue}>{savedOrders.length}</div><div style={S.statLabel}>Total Orders</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#16a34a" }}>{totalRevenue.toLocaleString()}</div><div style={S.statLabel}>Total Revenue (XAF)</div></div>
        <div style={S.statCard}><div style={S.statValue}>{savedOrders.filter(o => o.status === "pending").length}</div><div style={S.statLabel}>Pending</div></div>
      </div>

      <h2 style={S.sectionTitle}>New Order</h2>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px", marginBottom: "32px" }}>
        <OrderForm products={products} customers={customers} />
      </div>

      <h2 style={S.sectionTitle}>Order History</h2>
      {savedOrders.length === 0 ? (
        <p style={S.mutedText}>No orders yet</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Order #","Customer","Date","Total (XAF)","Items","Status"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {savedOrders.map((o, i) => (
                <tr key={o.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600, color: "#2563eb" }}>{o.number}</td>
                  <td style={S.td}>{o.customerName}</td>
                  <td style={S.td}>{new Date(o.date).toLocaleDateString()}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{Number(o.total).toLocaleString()}</td>
                  <td style={S.td}>{o.items.length}</td>
                  <td style={S.td}><span style={statusBadge(o.status)}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
