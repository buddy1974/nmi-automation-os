import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import { S, row, statusBadge } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function FinancePage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const invoices = await prisma.invoice.findMany({
    where:   directFilter(cid),
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  })

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid    = invoices.reduce((s, i) => s + Number(i.paid),   0)
  const totalUnpaid  = totalRevenue - totalPaid
  const countPaid    = invoices.filter(i => i.status === "paid").length
  const countPartial = invoices.filter(i => i.status === "partial").length
  const countUnpaid  = invoices.filter(i => i.status === "issued" || i.status === "draft").length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdueList = invoices.filter(
    i => i.status !== "paid" && i.status !== "cancelled" && new Date(i.dueDate) < today
  )

  const sorted = [
    ...invoices.filter(i => i.status !== "paid" && i.status !== "cancelled"),
    ...invoices.filter(i => i.status === "paid"),
    ...invoices.filter(i => i.status === "cancelled"),
  ]

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Finance — Receivables</h1>
      <p style={S.subtitle}>Revenue tracking, payment status, and outstanding balances — company-scoped</p>

      <div style={S.statBar}>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#16a34a" }}>{totalRevenue.toLocaleString()}</div>
          <div style={S.statLabel}>Total Revenue (XAF)</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#16a34a" }}>{totalPaid.toLocaleString()}</div>
          <div style={S.statLabel}>Collected — {countPaid} paid</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: "#f97316" }}>{totalUnpaid.toLocaleString()}</div>
          <div style={S.statLabel}>Outstanding — {countUnpaid} unpaid, {countPartial} partial</div>
        </div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: overdueList.length > 0 ? "#ef4444" : "#2563eb" }}>{overdueList.length}</div>
          <div style={S.statLabel}>Overdue</div>
        </div>
      </div>

      {totalRevenue > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "#64748b" }}>
            <span>Collection progress</span>
            <span>{Math.round((totalPaid / totalRevenue) * 100)}% collected</span>
          </div>
          <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min((totalPaid / totalRevenue) * 100, 100)}%`,
              background: "#16a34a",
              borderRadius: "99px",
            }} />
          </div>
        </div>
      )}

      <h2 style={S.sectionTitle}>All Invoices ({invoices.length})</h2>

      {sorted.length === 0 ? (
        <p style={S.mutedText}>No invoices yet.</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{["Invoice #","Customer","Total (XAF)","Paid (XAF)","Balance","Status","Due Date"].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {sorted.map((inv, i) => {
                const total   = Number(inv.amount)
                const paid    = Number(inv.paid)
                const balance = total - paid
                const overdue = inv.status !== "paid" && inv.status !== "cancelled" && new Date(inv.dueDate) < today

                return (
                  <tr key={inv.id} style={overdue ? { ...row(i), background: "#fff5f5" } : row(i)}>
                    <td style={{ ...S.td, fontWeight: 600, color: "#2563eb" }}>{inv.number}</td>
                    <td style={S.td}>{inv.customerName || "—"}</td>
                    <td style={S.td}>{total.toLocaleString()}</td>
                    <td style={{ ...S.td, color: paid > 0 ? "#16a34a" : undefined }}>{paid.toLocaleString()}</td>
                    <td style={{ ...S.td, color: balance > 0 ? "#ef4444" : "#16a34a", fontWeight: balance > 0 ? 600 : 400 }}>
                      {balance > 0 ? balance.toLocaleString() : "—"}
                    </td>
                    <td style={S.td}>
                      <span style={statusBadge(inv.status)}>{inv.status}</span>
                      {overdue && <span style={{ marginLeft: "6px", fontSize: "10px", color: "#ef4444", fontWeight: 700 }}>OVERDUE</span>}
                    </td>
                    <td style={{ ...S.td, color: overdue ? "#ef4444" : undefined }}>
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
