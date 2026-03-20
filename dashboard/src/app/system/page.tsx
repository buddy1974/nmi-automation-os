import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { S, row }     from "@/lib/ui"

export const dynamic = "force-dynamic"

const ALLOWED_ROLES = ["owner", "admin"]

const ROLE_COLOR: Record<string, string> = {
  owner:      "#7c3aed",
  admin:      "#dc2626",
  manager:    "#2563eb",
  accountant: "#d97706",
  editor:     "#0891b2",
  printer:    "#64748b",
  hr:         "#16a34a",
  viewer:     "#888",
}

export default async function SystemPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)

  if (!session || !ALLOWED_ROLES.includes(session.role)) {
    return (
      <div style={S.page}>
        <h1 style={S.heading}>System</h1>
        <div style={S.alertBox}>Access denied. Owner or admin role required.</div>
      </div>
    )
  }

  const [companies, users, orderCount, invoiceCount, productCount, workerCount, manuscriptCount, authorCount] = await Promise.all([
    prisma.company.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.count(),
    prisma.invoice.count(),
    prisma.product.count(),
    prisma.worker.count(),
    prisma.manuscript.count(),
    prisma.author.count(),
  ])

  return (
    <div style={S.page}>
      <h1 style={S.heading}>System Admin</h1>
      <p style={S.subtitle}>Global system overview — owner/admin access only</p>

      {/* ── System Stats ─────────────────────────────────────────────────── */}
      <div style={S.statBar}>
        {[
          { label: "Orders",      value: orderCount },
          { label: "Invoices",    value: invoiceCount },
          { label: "Products",    value: productCount },
          { label: "Workers",     value: workerCount },
          { label: "Manuscripts", value: manuscriptCount },
          { label: "Authors",     value: authorCount },
          { label: "Companies",   value: companies.length },
          { label: "Users",       value: users.length },
        ].map(s => (
          <div key={s.label} style={S.statCard}>
            <div style={S.statLabel}>{s.label}</div>
            <div style={S.statValue}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Companies ────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Companies ({companies.length})</h2>
      {companies.length === 0 ? <p style={S.mutedText}>No companies created yet</p> : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>{["Name","City","Active","Company ID"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {companies.map((c, i) => (
                <tr key={c.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{c.name}</td>
                  <td style={S.td}>{c.city || "—"}</td>
                  <td style={S.td}><span style={S.badge(c.active ? "#16a34a" : "#888")}>{c.active ? "Active" : "Inactive"}</span></td>
                  <td style={{ ...S.td, ...S.mutedText, fontSize: "11px" }}>{c.id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Users ────────────────────────────────────────────────────────── */}
      <h2 style={S.sectionTitle}>Users ({users.length})</h2>
      {users.length === 0 ? <p style={S.mutedText}>No users created yet</p> : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead><tr>{["Name","Email","Role","Company","Active","Created"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={row(i)}>
                  <td style={{ ...S.td, fontWeight: 600 }}>{u.name}</td>
                  <td style={S.td}>{u.email}</td>
                  <td style={S.td}><span style={S.badge(ROLE_COLOR[u.role] ?? "#888")}>{u.role}</span></td>
                  <td style={{ ...S.td, ...S.mutedText, fontSize: "11px" }}>{u.companyId ?? "—"}</td>
                  <td style={S.td}><span style={S.badge(u.active ? "#16a34a" : "#888")}>{u.active ? "Yes" : "No"}</span></td>
                  <td style={{ ...S.td, ...S.mutedText }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
