import { cookies }          from "next/headers"
import { redirect }          from "next/navigation"
import { prisma }            from "@/lib/db"
import { getSession }        from "@/lib/auth"
import { toggleCompany }     from "./actions"
import CreateCompanyForm     from "./CreateCompanyForm"

export const dynamic = "force-dynamic"

const ALLOWED = ["admin", "owner"]

export default async function CompaniesPage() {

  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { users: true, workers: true } },
    },
  })

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111", maxWidth: "900px" }}>

      <h1 style={{ margin: "0 0 4px", fontSize: "24px" }}>Companies</h1>
      <p style={{ margin: "0 0 28px", color: "#666", fontSize: "13px" }}>
        Multi-company mode — {companies.length} company record{companies.length !== 1 ? "s" : ""}
      </p>

      <CreateCompanyForm />

      {companies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#aaa", fontSize: "14px" }}>
          No companies yet. Create one above.
        </div>
      ) : (
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                {["Company", "City", "Status", "Users", "Workers", "Actions"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontWeight: 600, color: "#555", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: "1px solid #f0f0f0", background: i % 2 === 0 ? "white" : "#fafafa" }}>

                  <td style={{ padding: "12px 16px", fontWeight: 700 }}>{c.name}</td>
                  <td style={{ padding: "12px 16px", color: "#555" }}>{c.city || "—"}</td>

                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "2px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
                      background: c.active ? "#f0fdf4" : "#fef2f2",
                      color:      c.active ? "#16a34a" : "#dc2626",
                      border:     `1px solid ${c.active ? "#bbf7d0" : "#fecaca"}`,
                    }}>
                      {c.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td style={{ padding: "12px 16px", color: "#555" }}>{c._count.users}</td>
                  <td style={{ padding: "12px 16px", color: "#555" }}>{c._count.workers}</td>

                  <td style={{ padding: "12px 16px" }}>
                    <form action={toggleCompany.bind(null, c.id)}>
                      <button
                        type="submit"
                        style={{
                          background: c.active ? "#fef2f2" : "#f0fdf4",
                          color:      c.active ? "#dc2626" : "#16a34a",
                          border:     `1px solid ${c.active ? "#fecaca" : "#bbf7d0"}`,
                          borderRadius: "6px",
                          padding:    "4px 12px",
                          fontSize:   "12px",
                          cursor:     "pointer",
                          fontWeight: 600,
                        }}
                      >
                        {c.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
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
