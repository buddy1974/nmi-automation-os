import { prisma } from "@/lib/db"
import { S, row } from "@/lib/ui"

export const dynamic = "force-dynamic"

const STATUS_COLOR: Record<string, string> = {
  planned:  "#888",
  printing: "#2563eb",
  printed:  "#7c3aed",
  received: "#d97706",
  in_stock: "#16a34a",
}

export default async function PrintingPage() {
  const jobs = await prisma.printingJob.findMany({ orderBy: { date: "desc" } })

  const totalCost      = jobs.reduce((s, j) => s + Number(j.cost), 0)
  const totalUnits     = jobs.reduce((s, j) => s + j.quantity, 0)
  const inProgressCount = jobs.filter(j => j.status === "printing").length

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Printing</h1>
      <p style={S.subtitle}>Print job tracker — all books in production pipeline</p>

      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statLabel}>Total Jobs</div><div style={S.statValue}>{jobs.length}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Total Units</div><div style={S.statValue}>{totalUnits.toLocaleString()}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>Total Cost (XAF)</div><div style={{ ...S.statValue, color: "#dc2626" }}>{totalCost.toLocaleString()}</div></div>
        <div style={S.statCard}><div style={S.statLabel}>In Progress</div><div style={{ ...S.statValue, color: "#2563eb" }}>{inProgressCount}</div></div>
      </div>

      {jobs.length === 0 ? (
        <p style={S.mutedText}>No printing jobs recorded</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{["Book","Quantity","Cost (XAF)","Printer","Date","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {jobs.map((j, i) => (
                <tr key={j.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{j.book}</td>
                  <td style={S.td}>{j.quantity.toLocaleString()}</td>
                  <td style={S.td}>{Number(j.cost).toLocaleString()}</td>
                  <td style={S.td}>{j.printer || "—"}</td>
                  <td style={{ ...S.td, ...S.mutedText }}>{new Date(j.date).toLocaleDateString()}</td>
                  <td style={S.td}><span style={S.badge(STATUS_COLOR[j.status] ?? "#888")}>{j.status.replace(/_/g," ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
