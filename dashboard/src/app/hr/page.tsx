import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter, perfFilter } from "@/lib/companyFilter"

export const dynamic = "force-dynamic"

export default async function HRPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const companyWhere = directFilter(cid)

  const [workers, performanceRecords] = await Promise.all([
    prisma.worker.findMany({
      where:   companyWhere,
      orderBy: { name: "asc" },
    }),

    prisma.performanceRecord.findMany({
      where:   perfFilter(cid),
      include: { worker: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // ── AI Alerts (computed) ────────────────────────────────────────────────────

  const missingCnps = workers.filter(
    w => !w.cnpsNumber && ["CDI", "CDD"].includes(w.contractType) && w.status === "active"
  )

  const missingSalary = workers.filter(
    w => Number(w.salaryBase) === 0 && w.contractType === "CDI" && w.status === "active"
  )

  // latest performance record per worker
  const latestPerf = new Map<number, typeof performanceRecords[0]>()
  for (const rec of performanceRecords) {
    if (!latestPerf.has(rec.workerId)) latestPerf.set(rec.workerId, rec)
  }

  const lowPerformers = [...latestPerf.values()].filter(r => r.scorePercent < 50)

  // ── Summary totals ──────────────────────────────────────────────────────────

  const activeCount  = workers.filter(w => w.status === "active").length
  const totalSalary  = workers
    .filter(w => w.status === "active")
    .reduce((sum, w) => sum + Number(w.salaryBase), 0)

  return (
    <div>
      <h1>HR / PeopleOS</h1>


      {/* ── Summary ──────────────────────────────────────────────────────────── */}

      <h2>Summary</h2>

      <table>
        <tbody>
          <tr><td>Total workers</td>            <td>{workers.length}</td></tr>
          <tr><td>Active workers</td>           <td>{activeCount}</td></tr>
          <tr><td>Total base salary (XAF)</td>  <td>{totalSalary.toLocaleString()}</td></tr>
          <tr><td>Performance records</td>      <td>{performanceRecords.length}</td></tr>
        </tbody>
      </table>


      {/* ── AI Alerts ────────────────────────────────────────────────────────── */}

      <h2>AI Alerts</h2>

      {missingCnps.length === 0 && missingSalary.length === 0 && lowPerformers.length === 0 ? (
        <p>✓ No HR alerts</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Worker</th>
              <th>Alert</th>
            </tr>
          </thead>
          <tbody>
            {missingCnps.map(w => (
              <tr key={`cnps-${w.id}`}>
                <td>{w.name}</td>
                <td>⚠ CNPS number missing ({w.contractType})</td>
              </tr>
            ))}
            {missingSalary.map(w => (
              <tr key={`salary-${w.id}`}>
                <td>{w.name}</td>
                <td>⚠ Base salary not set (CDI)</td>
              </tr>
            ))}
            {lowPerformers.map(r => (
              <tr key={`perf-${r.id}`}>
                <td>{r.worker.name}</td>
                <td>⚠ Low performance: {r.scorePercent.toFixed(1)}% — {r.rating ?? "unrated"} ({r.period})</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      {/* ── Workers ──────────────────────────────────────────────────────────── */}

      <h2>Workers ({workers.length})</h2>

      {workers.length === 0 ? (
        <p>No workers found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Department</th>
              <th>Contract</th>
              <th>Base Salary (XAF)</th>
              <th>CNPS #</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {workers.map(w => (
              <tr key={w.id}>
                <td>{w.name}</td>
                <td>{w.role || "—"}</td>
                <td>{w.department || "—"}</td>
                <td>{w.contractType}</td>
                <td>{Number(w.salaryBase).toLocaleString()}</td>
                <td>{w.cnpsNumber || <em>missing</em>}</td>
                <td>{w.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}


      {/* ── Performance ──────────────────────────────────────────────────────── */}

      <h2>Performance Records ({performanceRecords.length})</h2>

      {performanceRecords.length === 0 ? (
        <p>No performance records yet — use HR &gt; Performance to add evaluations</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Worker</th>
              <th>Period</th>
              <th>Score</th>
              <th>%</th>
              <th>Rating</th>
              <th>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {performanceRecords.map(r => (
              <tr key={r.id}>
                <td>{r.worker.name}</td>
                <td>{r.period}</td>
                <td>{r.totalScore.toFixed(1)}</td>
                <td>{r.scorePercent.toFixed(1)}%</td>
                <td>{r.rating ?? "—"}</td>
                <td>{r.recommendation ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

    </div>
  )
}
