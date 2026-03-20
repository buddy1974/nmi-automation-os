import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter, perfFilter } from "@/lib/companyFilter"
import { S, row, badge, statusBadge } from "@/lib/ui"

export const dynamic = "force-dynamic"

export default async function HRPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const [workers, performanceRecords] = await Promise.all([
    prisma.worker.findMany({ where: directFilter(cid), orderBy: { name: "asc" } }),
    prisma.performanceRecord.findMany({
      where:   perfFilter(cid),
      include: { worker: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const missingCnps   = workers.filter(w => !w.cnpsNumber && ["CDI","CDD"].includes(w.contractType) && w.status === "active")
  const missingSalary = workers.filter(w => Number(w.salaryBase) === 0 && w.contractType === "CDI" && w.status === "active")

  const latestPerf = new Map<number, typeof performanceRecords[0]>()
  for (const rec of performanceRecords) {
    if (!latestPerf.has(rec.workerId)) latestPerf.set(rec.workerId, rec)
  }
  const lowPerformers = [...latestPerf.values()].filter(r => r.scorePercent < 50)

  const activeCount = workers.filter(w => w.status === "active").length
  const totalSalary = workers.filter(w => w.status === "active").reduce((s, w) => s + Number(w.salaryBase), 0)

  return (
    <div style={S.page}>
      <h1 style={S.heading}>HR / PeopleOS</h1>
      <p style={S.subtitle}>Workers, performance records and compliance alerts — company-scoped</p>

      {/* ── Summary bar ─────────────────────────────────────────────────────── */}
      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statValue}>{workers.length}</div><div style={S.statLabel}>Total Workers</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#16a34a" }}>{activeCount}</div><div style={S.statLabel}>Active</div></div>
        <div style={S.statCard}><div style={S.statValue}>{totalSalary.toLocaleString()}</div><div style={S.statLabel}>Base Salary Total (XAF)</div></div>
        <div style={S.statCard}><div style={S.statValue}>{performanceRecords.length}</div><div style={S.statLabel}>Performance Records</div></div>
        <div style={S.statCard}>
          <div style={{ ...S.statValue, color: missingCnps.length + missingSalary.length + lowPerformers.length > 0 ? "#ef4444" : "#16a34a" }}>
            {missingCnps.length + missingSalary.length + lowPerformers.length}
          </div>
          <div style={S.statLabel}>Alerts</div>
        </div>
      </div>

      {/* ── AI Alerts ────────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>AI Alerts</h2>
      {missingCnps.length === 0 && missingSalary.length === 0 && lowPerformers.length === 0 ? (
        <p style={S.successText}>✓ No HR alerts</p>
      ) : (
        <>
          {missingCnps.map(w => (
            <div key={`cnps-${w.id}`} style={S.alertRed}>⚠ {w.name} — CNPS number missing ({w.contractType})</div>
          ))}
          {missingSalary.map(w => (
            <div key={`sal-${w.id}`} style={S.alertOrange}>⚠ {w.name} — Base salary not set (CDI)</div>
          ))}
          {lowPerformers.map(r => (
            <div key={`perf-${r.id}`} style={S.alertOrange}>
              ⚠ {r.worker.name} — Low performance: {r.scorePercent.toFixed(1)}% — {r.rating ?? "unrated"} ({r.period})
            </div>
          ))}
        </>
      )}

      {/* ── Workers ──────────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Workers ({workers.length})</h2>
      {workers.length === 0 ? (
        <p style={S.mutedText}>No workers found</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{["Name","Role","Department","Contract","Base Salary (XAF)","CNPS #","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {workers.map((w, i) => (
                <tr key={w.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{w.name}</td>
                  <td style={S.td}>{w.role || "—"}</td>
                  <td style={S.td}>{w.department || "—"}</td>
                  <td style={S.td}>{w.contractType}</td>
                  <td style={S.td}>{Number(w.salaryBase).toLocaleString()}</td>
                  <td style={S.td}>{w.cnpsNumber || <span style={{ color: "#ef4444" }}>missing</span>}</td>
                  <td style={S.td}>
                    <span style={statusBadge(w.status)}>{w.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Performance ──────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Performance Records ({performanceRecords.length})</h2>
      {performanceRecords.length === 0 ? (
        <p style={S.mutedText}>No performance records yet — use HR &gt; Performance to add evaluations</p>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>{["Worker","Period","Score","Score %","Rating","Recommendation"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {performanceRecords.map((r, i) => (
                <tr key={r.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{r.worker.name}</td>
                  <td style={S.td}>{r.period}</td>
                  <td style={S.td}>{r.totalScore.toFixed(1)}</td>
                  <td style={S.td}>
                    <span style={badge(r.scorePercent >= 80 ? "green" : r.scorePercent >= 50 ? "orange" : "red")}>
                      {r.scorePercent.toFixed(1)}%
                    </span>
                  </td>
                  <td style={S.td}>{r.rating ?? "—"}</td>
                  <td style={S.td}>{r.recommendation ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
