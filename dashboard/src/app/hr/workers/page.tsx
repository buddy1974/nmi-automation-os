import { cookies }          from "next/headers"
import { redirect }          from "next/navigation"
import { prisma }            from "@/lib/db"
import { getSession, getActiveCompanyId } from "@/lib/auth"
import WorkerForm            from "./WorkerForm"
import WorkerControls        from "./WorkerControls"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "hr", "manager", "owner"]

export default async function WorkersPage() {

  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  // Company filter — owner/admin see all, others see only their company
  const activeCompanyId = getActiveCompanyId(session, jar.get("nmi_company")?.value)
  const companyWhere    = activeCompanyId ? { companyId: activeCompanyId } : {}

  const [workers, companies] = await Promise.all([
    prisma.worker.findMany({
      where:   companyWhere,
      include: { company: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ])

  const activeCount = workers.filter(w => w.status === "active").length

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111", maxWidth: "1100px" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "24px" }}>Workers</h1>
          <p style={{ margin: 0, color: "#666", fontSize: "13px" }}>
            HR — {workers.length} worker{workers.length !== 1 ? "s" : ""} · {activeCount} active
            {activeCompanyId && <span style={{ marginLeft: "8px", color: "#0891b2", fontWeight: 600 }}>
              · filtered by company
            </span>}
          </p>
        </div>
        <a href="/import?module=workers" style={{ border: "1px solid #2563eb", color: "#2563eb", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0, marginTop: 4 }}>↑ Import</a>
      </div>

      {/* Admin/hr/owner can add workers */}
      {["admin", "hr", "owner"].includes(session.role) && (
        <WorkerForm companies={companies} />
      )}

      {workers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: "14px" }}>
          No workers found{activeCompanyId ? " for this company" : ""}. Add one above.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#1a1a2e" }}>
                {["Name", "Role", "Department", "Contract", "Salary (XAF)", "Company", "Status", "Actions"].map(h => (
                  <th key={h} style={{
                    padding: "10px 12px", textAlign: "left",
                    fontSize: "11px", textTransform: "uppercase",
                    letterSpacing: "0.5px", color: "white", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workers.map((w, i) => (
                <tr key={w.id} style={{ borderBottom: "1px solid #eee", background: i % 2 === 0 ? "white" : "#fafafa" }}>

                  <td style={td}><span style={{ fontWeight: 700 }}>{w.name}</span></td>
                  <td style={{ ...td, color: "#555" }}>{w.role || "—"}</td>
                  <td style={{ ...td, color: "#555" }}>{w.department || "—"}</td>
                  <td style={td}>
                    <span style={{ fontSize: "11px", background: "#f3f4f6", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                      {w.contractType}
                    </span>
                  </td>
                  <td style={{ ...td, fontWeight: 600 }}>{Number(w.salaryBase).toLocaleString()}</td>

                  {/* Company */}
                  <td style={td}>
                    {w.company ? (
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "11px",
                        fontWeight: 600, color: "#0891b2",
                        background: "#e0f2fe", border: "1px solid #bae6fd",
                      }}>
                        {w.company.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#aaa" }}>—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td style={td}>
                    <span style={{
                      fontSize: "11px", fontWeight: 600,
                      color: w.status === "active" ? "#16a34a" : "#dc2626",
                    }}>
                      {w.status}
                    </span>
                  </td>

                  {/* Actions — client component */}
                  <WorkerControls
                    workerId={w.id}
                    status={w.status}
                    companyId={w.companyId}
                    companies={companies}
                  />

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

const td: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
}
