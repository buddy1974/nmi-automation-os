import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import { S, row }     from "@/lib/ui"
import Link           from "next/link"

export const dynamic = "force-dynamic"

const STATUS_COLOR: Record<string, string> = {
  draft:     "#888",
  issued:    "#2563eb",
  partial:   "#d97706",
  paid:      "#16a34a",
  cancelled: "#dc2626",
}

export default async function InvoicesPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const invoices = await prisma.invoice.findMany({
    where:   directFilter(cid),
    orderBy: { createdAt: "desc" },
  })

  const totalAmount  = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid    = invoices.reduce((s, i) => s + Number(i.paid),   0)
  const unpaidCount  = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").length

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Invoices</h1>
      <p style={S.subtitle}>All invoices — company-scoped, sorted by most recent</p>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statLabel}>Total Invoices</div><div style={S.statValue}>{invoices.length}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Total Amount (XAF)</div><div style={{ ...S.statValue, color: "#2563eb" }}>{totalAmount.toLocaleString()}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Collected (XAF)</div><div style={{ ...S.statValue, color: "#16a34a" }}>{totalPaid.toLocaleString()}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Outstanding</div><div style={{ ...S.statValue, color: "#d97706" }}>{unpaidCount}</div></div>
      </div>

      {invoices.length === 0 ? (
        <p style={S.mutedText}>No invoices yet. Create an order to generate one.</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{["Invoice #","Customer","Amount (XAF)","Paid (XAF)","Balance","Status","Due Date","Created"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const balance = Number(inv.amount) - Number(inv.paid)
                return (
                  <tr key={inv.id} style={row(i)}>
                    <td style={{ ...S.td, fontWeight: 600 }}>
                      <Link href={`/invoices/${inv.id}`} style={{ color: "#1a1a2e", textDecoration: "underline" }}>
                        {inv.number}
                      </Link>
                    </td>
                    <td style={S.td}>{inv.customerName || "—"}</td>
                    <td style={S.td}>{Number(inv.amount).toLocaleString()}</td>
                    <td style={{ ...S.td, color: "#16a34a" }}>{Number(inv.paid).toLocaleString()}</td>
                    <td style={{ ...S.td, color: balance > 0 ? "#dc2626" : "#16a34a", fontWeight: 600 }}>
                      {balance > 0 ? balance.toLocaleString() : "—"}
                    </td>
                    <td style={S.td}>
                      <span style={S.badge(STATUS_COLOR[inv.status] ?? "#888")}>{inv.status}</span>
                    </td>
                    <td style={S.td}>{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td style={{ ...S.td, ...S.mutedText }}>{new Date(inv.createdAt).toLocaleDateString()}</td>
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
