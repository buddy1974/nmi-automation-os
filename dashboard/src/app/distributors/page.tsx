import { prisma }     from "@/lib/db"
import { S, row, badge } from "@/lib/ui"
import CitySearch    from "@/app/components/CitySearch"

export const dynamic = "force-dynamic"

const REGION_FLAG: Record<string, string> = {
  "Adamawa":   "#f97316",
  "Centre":    "#1a73e8",
  "East":      "#16a34a",
  "Far North": "#ef4444",
  "Littoral":  "#0891b2",
  "North":     "#7c3aed",
  "North West":"#d97706",
  "South":     "#0f766e",
  "South West":"#9333ea",
  "West":      "#db2777",
}

export default async function DistributorsPage() {
  const distributors = await prisma.distributor.findMany({ orderBy: { region: "asc" } })

  const activeCount = distributors.filter(d => d.active).length
  const regions     = [...new Set(distributors.map(d => d.region))].sort()

  return (
    <div style={S.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={S.heading}>Distributors</h1>
          <p style={S.subtitle}>Regional distribution network across Cameroon — {distributors.length} partners</p>
        </div>
        <a href="/import?module=distributors" style={{ border: "1px solid #1a73e8", color: "#1a73e8", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none", flexShrink: 0, marginTop: 4 }}>↑ Import</a>
      </div>

      {/* Cameroon city search */}
      <CitySearch />

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div style={S.statBar}>
        <div style={S.statCard}><div style={S.statValue}>{distributors.length}</div><div style={S.statLabel}>Total Distributors</div></div>
        <div style={S.statCard}><div style={{ ...S.statValue, color: "#16a34a" }}>{activeCount}</div><div style={S.statLabel}>Active</div></div>
        <div style={S.statCard}><div style={S.statValue}>{regions.length}</div><div style={S.statLabel}>Regions Covered</div></div>
      </div>

      {/* ── Region cards ───────────────────────────────────────────────────── */}
      {distributors.length === 0 ? (
        <p style={S.mutedText}>No distributors yet. Run the seed script to populate.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {distributors.map(d => {
            const accent = REGION_FLAG[d.region] ?? "#475569"
            return (
              <div key={d.id} style={{
                background: "#fff",
                border: `1px solid #e2e8f0`,
                borderTop: `4px solid ${accent}`,
                borderRadius: "10px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}>
                {/* Region badge + status */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.8px", color: accent,
                  }}>
                    {d.region}
                  </span>
                  <span style={badge(d.active ? "green" : "grey")}>{d.active ? "Active" : "Inactive"}</span>
                </div>

                {/* Name */}
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", lineHeight: 1.3 }}>{d.name}</div>

                {/* City */}
                <div style={{ fontSize: "13px", color: "#64748b" }}>📍 {d.city}</div>

                {/* Phone */}
                {d.phone && (
                  <div style={{ fontSize: "13px", color: "#475569" }}>📞 {d.phone}</div>
                )}

                {/* Email */}
                {d.email && (
                  <div style={{ fontSize: "12px", color: "#1a73e8" }}>✉ {d.email}</div>
                )}

                {/* Address */}
                {d.address && (
                  <div style={{ fontSize: "12px", color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                    {d.address}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Full table ─────────────────────────────────────────────────────── */}
      {distributors.length > 0 && (
        <>
          <h2 style={S.sectionTitle}>All Distributors</h2>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>{["Region","Name","City","Phone","Email","Status"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {distributors.map((d, i) => (
                  <tr key={d.id} style={row(i)}>
                    <td style={S.td}>
                      <span style={{ fontWeight: 700, color: REGION_FLAG[d.region] ?? "#475569" }}>{d.region}</span>
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{d.name}</td>
                    <td style={S.td}>{d.city}</td>
                    <td style={S.td}>{d.phone || "—"}</td>
                    <td style={S.td}>{d.email || "—"}</td>
                    <td style={S.td}><span style={badge(d.active ? "green" : "grey")}>{d.active ? "Active" : "Inactive"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
