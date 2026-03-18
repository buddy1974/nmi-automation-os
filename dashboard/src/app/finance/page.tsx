import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

const STATUS_COLOR: Record<string, string> = {
  draft:     "#888",
  issued:    "#2563eb",
  partial:   "#d97706",
  paid:      "#16a34a",
  cancelled: "#dc2626",
}

export default async function FinancePage() {

  const invoices = await prisma.invoice.findMany({
    orderBy: [
      { status: "asc" },   // issued / partial first (alphabetically before "paid")
      { dueDate: "asc" },  // oldest due date first
    ],
  })

  // ── Aggregates ────────────────────────────────────────────────────────────────

  const totalRevenue  = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid     = invoices.reduce((s, i) => s + Number(i.paid),   0)
  const totalUnpaid   = totalRevenue - totalPaid

  const countAll      = invoices.length
  const countPaid     = invoices.filter(i => i.status === "paid").length
  const countPartial  = invoices.filter(i => i.status === "partial").length
  const countUnpaid   = invoices.filter(i => i.status === "issued" || i.status === "draft").length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const overdueList = invoices.filter(
    i => i.status !== "paid" && i.status !== "cancelled" && new Date(i.dueDate) < today
  )

  // Sort: unpaid/partial first, then paid
  const sorted = [
    ...invoices.filter(i => i.status !== "paid" && i.status !== "cancelled"),
    ...invoices.filter(i => i.status === "paid"),
    ...invoices.filter(i => i.status === "cancelled"),
  ]

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111" }}>

      <h1 style={{ margin: "0 0 8px", fontSize: "24px" }}>Finance — Receivables</h1>
      <p style={{ margin: "0 0 32px", color: "#666", fontSize: "13px" }}>
        Revenue tracking, payment status, and outstanding balances
      </p>

      {/* ── Summary cards ───────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>

        <div style={cardStyle("#f0fdf4", "#16a34a")}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#16a34a" }}>Total Revenue</div>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>{totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>FCFA across {countAll} invoice{countAll !== 1 ? "s" : ""}</div>
        </div>

        <div style={cardStyle("#f0fdf4", "#16a34a")}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#16a34a" }}>Total Collected</div>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>{totalPaid.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>FCFA — {countPaid} fully paid</div>
        </div>

        <div style={cardStyle("#fff7ed", "#d97706")}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: "#d97706" }}>Outstanding</div>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>{totalUnpaid.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>FCFA — {countUnpaid} unpaid, {countPartial} partial</div>
        </div>

        <div style={cardStyle(overdueList.length > 0 ? "#fff1f2" : "#f9fafb", overdueList.length > 0 ? "#dc2626" : "#888")}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px", color: overdueList.length > 0 ? "#dc2626" : "#888" }}>Overdue</div>
          <div style={{ fontSize: "22px", fontWeight: 700 }}>{overdueList.length}</div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
            {overdueList.length === 0 ? "None overdue" : `invoice${overdueList.length !== 1 ? "s" : ""} past due date`}
          </div>
        </div>

      </div>

      {/* ── Progress bar ────────────────────────────────────────────────────────── */}
      {totalRevenue > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "#555" }}>
            <span>Collection progress</span>
            <span>{Math.round((totalPaid / totalRevenue) * 100)}% collected</span>
          </div>
          <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min((totalPaid / totalRevenue) * 100, 100)}%`,
              background: "#16a34a",
              borderRadius: "99px",
              transition: "width 0.3s",
            }} />
          </div>
        </div>
      )}

      {/* ── Invoices table ──────────────────────────────────────────────────────── */}
      <h2 style={{ fontSize: "16px", margin: "0 0 16px" }}>All invoices</h2>

      {sorted.length === 0 ? (
        <p style={{ color: "#aaa" }}>No invoices yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr>
              {["Invoice", "Customer", "Total", "Paid", "Balance", "Status", "Due date"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((inv) => {
              const total   = Number(inv.amount)
              const paid    = Number(inv.paid)
              const balance = total - paid
              const overdue = inv.status !== "paid" && inv.status !== "cancelled" && new Date(inv.dueDate) < today

              return (
                <tr key={inv.id} style={{ background: overdue ? "#fff8f8" : "white" }}>
                  <td style={tdStyle}>
                    <a href={`/invoices/${inv.id}`} style={{ color: "#1a1a2e", textDecoration: "underline" }}>
                      {inv.number}
                    </a>
                  </td>
                  <td style={tdStyle}>{inv.customerName || "—"}</td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>{total.toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: paid > 0 ? "#16a34a" : "#aaa" }}>
                    {paid.toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right", color: balance > 0 ? "#dc2626" : "#16a34a", fontWeight: balance > 0 ? 600 : 400 }}>
                    {balance > 0 ? balance.toLocaleString() : "—"}
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      color: STATUS_COLOR[inv.status] ?? "#888",
                      border: `1px solid ${STATUS_COLOR[inv.status] ?? "#888"}`,
                    }}>
                      {inv.status}
                    </span>
                    {overdue && (
                      <span style={{ marginLeft: "6px", fontSize: "10px", color: "#dc2626", fontWeight: 700 }}>OVERDUE</span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, color: overdue ? "#dc2626" : "#555" }}>
                    {new Date(inv.dueDate).toLocaleDateString("fr-CM", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function cardStyle(bg: string, accent: string): React.CSSProperties {
  return {
    background: bg,
    border: `1px solid ${accent}22`,
    borderRadius: "8px",
    padding: "20px",
  }
}

const thStyle: React.CSSProperties = {
  background: "#1a1a2e",
  color: "white",
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  fontWeight: 600,
}

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #eee",
}
