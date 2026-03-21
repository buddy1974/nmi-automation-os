import { cookies }           from "next/headers"
import { prisma }            from "@/lib/db"
import { getSession }        from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import { S, row, statusBadge } from "@/lib/ui"
import OrderForm             from "./OrderForm"
import type { Metadata }     from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Orders — NMI Automation OS" }

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

  const products  = dbProducts.map(p  => ({ id: p.id, code: p.code, title: p.title, price: Number(p.price), stock: p.stock }))
  const customers = dbCustomers.map(c => ({ id: c.id, name: c.name }))

  const totalRevenue = savedOrders.reduce((s, o) => s + Number(o.total), 0)
  const counts       = savedOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})

  const STATUS_ORDER = ["pending", "confirmed", "shipped", "delivered", "cancelled"]

  return (
    <div style={S.page}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ ...S.heading, margin: 0 }}>Orders</h1>
          <p style={{ ...S.subtitle, margin: "4px 0 0" }}>
            Manage and track all customer orders — company-scoped
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/import?module=orders" style={{ border: "1px solid #2563eb", color: "#2563eb", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", display: "flex", alignItems: "center" }}>↑ Import</a>
          <a
            href="#new-order"
            style={{
              background:     "#1a1a2e",
              color:          "#fff",
              borderRadius:   "8px",
              padding:        "10px 20px",
              fontSize:       "14px",
              fontWeight:     700,
              textDecoration: "none",
              whiteSpace:     "nowrap",
            }}
          >
            + New Order
          </a>
        </div>
      </div>

      {/* ── Stats bar ───────────────────────────────────────────────────── */}
      <div style={S.statBar}>
        <div style={S.statCard}>
          <div style={S.statValue}>{savedOrders.length}</div>
          <div style={S.statLabel}>Total Orders</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#16a34a" }}>{totalRevenue.toLocaleString()}</div>
          <div style={S.statLabel}>Total Revenue (XAF)</div>
        </div>
        {STATUS_ORDER.filter(s => counts[s] !== undefined).map(status => (
          <div key={status} style={S.statCard}>
            <div style={{
              ...S.statValue,
              color: status === "delivered" ? "#16a34a"
                   : status === "cancelled"  ? "#ef4444"
                   : status === "confirmed"  ? "#2563eb"
                   : status === "shipped"    ? "#7c3aed"
                   : "#f97316",
            }}>
              {counts[status]}
            </div>
            <div style={S.statLabel}>{status}</div>
          </div>
        ))}
      </div>

      {/* ── Orders table ────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Order History ({savedOrders.length})</h2>

      {savedOrders.length === 0 ? (
        <div style={{
          background:   "#fff",
          border:       "1px solid #e2e8f0",
          borderRadius: "8px",
          padding:      "48px",
          textAlign:    "center",
          color:        "#9ca3af",
          fontSize:     "14px",
          marginBottom: "32px",
        }}>
          No orders yet. Create your first order below.
        </div>
      ) : (
        <div style={{ ...S.tableWrap, marginBottom: "32px" }}>
          <table style={S.table}>
            <thead>
              <tr>
                {["Order #", "Customer", "Items", "Total (XAF)", "Status", "Date"].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {savedOrders.map((o, i) => (
                <tr key={o.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 700, color: "#2563eb" }}>
                    {o.number}
                  </td>
                  <td style={{ ...S.td, fontWeight: 500 }}>
                    {o.customerName || "—"}
                  </td>
                  <td style={S.td}>
                    <span style={{
                      background:   "#f1f5f9",
                      color:        "#475569",
                      borderRadius: "999px",
                      padding:      "2px 10px",
                      fontSize:     "12px",
                      fontWeight:   600,
                    }}>
                      {o.items.length} {o.items.length === 1 ? "item" : "items"}
                    </span>
                  </td>
                  <td style={{ ...S.td, fontWeight: 700, color: "#16a34a" }}>
                    {Number(o.total).toLocaleString()}
                  </td>
                  <td style={S.td}>
                    <span style={statusBadge(o.status)}>{o.status}</span>
                  </td>
                  <td style={{ ...S.td, color: "#64748b" }}>
                    {new Date(o.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── New Order form ───────────────────────────────────────────────── */}
      <div id="new-order">
        <h2 style={S.sectionTitle}>Create New Order</h2>
        <div style={{
          background:   "#f8fafc",
          border:       "1px solid #e2e8f0",
          borderRadius: "10px",
          padding:      "24px",
        }}>
          <OrderForm products={products} customers={customers} />
        </div>
      </div>

    </div>
  )
}
