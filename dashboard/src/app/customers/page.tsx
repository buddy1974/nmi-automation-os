import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany } from "@/lib/companyFilter"
import { S, row }     from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function CustomersPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const customers = await prisma.customer.findMany({
    where:   cid ? { orders: { some: { companyId: cid } } } : undefined,
    orderBy: { name: "asc" },
  })

  const activeCount = customers.filter(c => c.status === "active").length

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Customers</h1>
      <p style={S.subtitle}>All customers — filtered by company via order history</p>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statLabel}>Total Customers</div><div style={S.statValue}>{customers.length}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Active</div><div style={{ ...S.statValue, color: "#16a34a" }}>{activeCount}</div></div>
      </div>

      {customers.length === 0 ? (
        <p style={S.mutedText}>No customers found</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{["Name","Phone","Address","Type","Region","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={c.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{c.name}</td>
                  <td style={S.td}>{c.phone || "—"}</td>
                  <td style={S.td}>{c.address || "—"}</td>
                  <td style={S.td}>{c.type}</td>
                  <td style={S.td}>{c.region || "—"}</td>
                  <td style={S.td}>
                    <span style={S.badge(c.status === "active" ? "#16a34a" : "#888")}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
