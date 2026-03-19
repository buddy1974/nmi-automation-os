import { cookies }     from "next/headers"
import { redirect }    from "next/navigation"
import { prisma }      from "@/lib/db"
import { getSession }  from "@/lib/auth"
import CreateUserForm  from "./CreateUserForm"
import UserControls    from "./UserControls"

export const dynamic = "force-dynamic"

const ROLE_COLOR: Record<string, string> = {
  admin:      "#1a1a2e",
  manager:    "#2563eb",
  accountant: "#d97706",
  editor:     "#7c3aed",
  printer:    "#0891b2",
  hr:         "#db2777",
  viewer:     "#6b7280",
}

export default async function UsersPage() {

  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (session?.role !== "admin") redirect("/dashboard")

  const [users, companies] = await Promise.all([
    prisma.user.findMany({
      include:  { company: { select: { name: true } } },
      orderBy:  { createdAt: "asc" },
    }),
    prisma.company.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
  ])

  return (
    <div style={{ padding: "32px", fontFamily: "Arial, sans-serif", color: "#111" }}>

      <h1 style={{ margin: "0 0 4px", fontSize: "24px" }}>User management</h1>
      <p style={{ margin: "0 0 32px", color: "#666", fontSize: "13px" }}>
        Admin only — create users, assign roles, assign companies, manage access
      </p>

      <CreateUserForm companies={companies} />

      <h2 style={{ fontSize: "16px", margin: "0 0 16px" }}>
        All users ({users.length})
      </h2>

      {users.length === 0 ? (
        <p style={{ color: "#aaa" }}>No users yet. Create one above.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr>
                {["Name", "Email", "Role", "Company", "Status", "Created", "Actions"].map(h => (
                  <th key={h} style={{
                    background: "#1a1a2e", color: "white",
                    padding: "10px 12px", textAlign: "left",
                    fontSize: "11px", textTransform: "uppercase",
                    letterSpacing: "0.5px", whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ background: user.active ? "white" : "#fafafa" }}>

                  <td style={tdStyle}>{user.name}</td>

                  <td style={{ ...tdStyle, color: "#555" }}>{user.email}</td>

                  <td style={tdStyle}>
                    <span style={{
                      padding: "2px 8px", borderRadius: "4px", fontSize: "11px",
                      fontWeight: 700, color: "white",
                      background: ROLE_COLOR[user.role] ?? "#888",
                    }}>
                      {user.role}
                    </span>
                  </td>

                  {/* Company column */}
                  <td style={tdStyle}>
                    {user.company ? (
                      <span style={{
                        padding: "2px 8px", borderRadius: "4px", fontSize: "11px",
                        fontWeight: 600, color: "#0891b2",
                        background: "#e0f2fe", border: "1px solid #bae6fd",
                      }}>
                        {user.company.name}
                      </span>
                    ) : (
                      <span style={{ fontSize: "11px", color: "#aaa" }}>—</span>
                    )}
                  </td>

                  <td style={tdStyle}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: user.active ? "#16a34a" : "#dc2626" }}>
                      {user.active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td style={{ ...tdStyle, color: "#888", whiteSpace: "nowrap" }}>
                    {new Date(user.createdAt).toLocaleDateString("fr-CM", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>

                  <UserControls
                    userId={user.id}
                    role={user.role}
                    active={user.active}
                    isSelf={user.id === session.id}
                    companyId={user.companyId}
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

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #eee",
  verticalAlign: "middle",
}
