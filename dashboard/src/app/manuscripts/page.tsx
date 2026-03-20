import { prisma }      from "@/lib/db"
import { S, row, statusBadge } from "@/lib/ui"

export const dynamic = "force-dynamic"

const STATUS_ORDER = ["submitted","reviewing","editing","approved","rejected","ready_for_print","printing"]

export default async function ManuscriptsPage() {
  const manuscripts = await prisma.manuscript.findMany({ orderBy: { date: "desc" } })

  const printQueue    = manuscripts.filter(m => m.readyForPrint)
  const countByStatus = STATUS_ORDER.map(s => ({ status: s, count: manuscripts.filter(m => m.status === s).length }))

  return (
    <div style={S.page}>
      <h1 style={S.heading}>Manuscripts</h1>
      <p style={S.subtitle}>Editorial pipeline — all manuscripts and print queue</p>

      <div style={S.statBar}>
        {([
          { label: "Total", value: manuscripts.length },
          ...countByStatus.filter(s => s.count > 0).map(s => ({ label: s.status, value: s.count })),
        ] as { label: string; value: number }[]).map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={S.statValue}>{s.value}</div>
            <div style={S.statLabel}>{s.label.replace(/_/g," ")}</div>
          </div>
        ))}
      </div>

      {/* ── Print Queue ──────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Print Queue ({printQueue.length})</h2>
      {printQueue.length === 0 ? (
        <p style={S.mutedText}>No manuscripts ready for print</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{["#","Title","Author","Subject","Level / Class","Code","Version"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {printQueue.map((m, i) => (
                <tr key={m.id} style={row(i)}>
                  <td style={{ ...S.td, ...S.mutedText }}>{i + 1}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{m.title}</td>
                  <td style={S.td}>{m.author || "—"}</td>
                  <td style={S.td}>{m.subject || "—"}</td>
                  <td style={S.td}>{m.level} {m.class}</td>
                  <td style={S.td}>{m.suggestedCode || "—"}</td>
                  <td style={S.td}>v{m.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── All Manuscripts ──────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>All Manuscripts ({manuscripts.length})</h2>
      {manuscripts.length === 0 ? (
        <p style={S.mutedText}>No manuscripts recorded</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{["Title","Author","Subject","Level / Class","Status","Version","Editor","Date"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {manuscripts.map((m, i) => (
                <tr key={m.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{m.title}</td>
                  <td style={S.td}>{m.author || "—"}</td>
                  <td style={S.td}>{m.subject || "—"}</td>
                  <td style={S.td}>{m.level} {m.class}</td>
                  <td style={S.td}><span style={statusBadge(m.status)}>{m.status.replace(/_/g," ")}</span></td>
                  <td style={S.td}>v{m.version}</td>
                  <td style={S.td}>{m.editor || "—"}</td>
                  <td style={{ ...S.td, ...S.mutedText }}>{new Date(m.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
