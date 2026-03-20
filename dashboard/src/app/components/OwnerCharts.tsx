"use client"

// Pure SVG charts — zero dependencies, no hydration issues

export type CompanyChartData = {
  name: string
  revenue: number
  orders: number
  workers: number
}

export type MonthlyChartData = {
  month: string
  amount: number
}

type Props = {
  companies:      CompanyChartData[]
  monthlyRevenue: MonthlyChartData[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtVal(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`
  return String(n)
}

const W  = 560
const H  = 260
const PL = 64   // pad left  (y-axis labels)
const PR = 16   // pad right
const PT = 24   // pad top
const PB = 48   // pad bottom (x-axis labels)
const CW = W - PL - PR
const CH = H - PT - PB

function GridLines({ maxVal }: { maxVal: number }) {
  return (
    <>
      {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
        const y   = PT + CH - CH * pct
        const val = Math.round(maxVal * pct)
        return (
          <g key={pct}>
            <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#e2e8f0" strokeWidth={1} />
            <text x={PL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#94a3b8">
              {fmtVal(val)}
            </text>
          </g>
        )
      })}
    </>
  )
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

function BarChart({
  data, color, title,
}: {
  data: { label: string; value: number }[]
  color: string
  title: string
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const n      = data.length
  const slot   = CW / n
  const barW   = Math.min(56, slot * 0.55)

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 260 }}>
        <GridLines maxVal={maxVal} />
        {/* x-axis baseline */}
        <line x1={PL} y1={PT + CH} x2={W - PR} y2={PT + CH} stroke="#e2e8f0" strokeWidth={1} />

        {data.map((d, i) => {
          const barH = Math.max((d.value / maxVal) * CH, d.value > 0 ? 2 : 0)
          const x    = PL + i * slot + slot / 2 - barW / 2
          const y    = PT + CH - barH

          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} fill={color} rx={3} opacity={0.9} />
              {d.value > 0 && (
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={10} fill="#475569" fontWeight={600}>
                  {fmtVal(d.value)}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={PT + CH + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#64748b"
              >
                {d.label.length > 14 ? d.label.slice(0, 13) + "…" : d.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Line chart ────────────────────────────────────────────────────────────────

function LineChart({
  data, color, title,
}: {
  data: { label: string; value: number }[]
  color: string
  title: string
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const n      = data.length

  const pts = data.map((d, i) => ({
    x:     n > 1 ? PL + (i / (n - 1)) * CW : PL + CW / 2,
    y:     PT + CH - (d.value / maxVal) * CH,
    value: d.value,
    label: d.label,
  }))

  const polyline = pts.map(p => `${p.x},${p.y}`).join(" ")
  const area     = [
    `${pts[0].x},${PT + CH}`,
    ...pts.map(p => `${p.x},${p.y}`),
    `${pts[pts.length - 1].x},${PT + CH}`,
  ].join(" ")

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>{title}</div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 260 }}>
        <GridLines maxVal={maxVal} />
        <line x1={PL} y1={PT + CH} x2={W - PR} y2={PT + CH} stroke="#e2e8f0" strokeWidth={1} />

        {/* Area fill */}
        <polygon points={area} fill={color} fillOpacity={0.07} />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots + value labels + x-axis labels */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5}  fill={color} />
            <circle cx={p.x} cy={p.y} r={2.5} fill="#fff" />
            {p.value > 0 && (
              <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize={10} fill="#475569" fontWeight={600}>
                {fmtVal(p.value)}
              </text>
            )}
            <text x={p.x} y={PT + CH + 16} textAnchor="middle" fontSize={10} fill="#64748b">
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Card style helpers ────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background:   "#fff",
  border:       "1px solid #e2e8f0",
  borderRadius: "10px",
  padding:      "20px 20px 12px",
}

const titleStyle: React.CSSProperties = {
  fontSize:      "13px",
  fontWeight:    700,
  color:         "#1a1a2e",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom:  "8px",
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function OwnerCharts({ companies, monthlyRevenue }: Props) {
  if (companies.length === 0) return null

  const revenueData = companies.map(c => ({ label: c.name, value: c.revenue }))
  const ordersData  = companies.map(c => ({ label: c.name, value: c.orders  }))
  const monthData   = monthlyRevenue.map(m => ({ label: m.month, value: m.amount }))

  return (
    <div>
      <div style={{
        fontSize: "16px", fontWeight: 700, color: "#1a1a2e",
        margin: "32px 0 16px", paddingBottom: "8px",
        borderBottom: "1px solid #e2e8f0",
      }}>
        Analytics
      </div>

      {/* Row 1 — Revenue + Orders side by side */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
        marginBottom: "20px",
      }}>
        <BarChart data={revenueData} color="#2563eb" title="Revenue per Company (XAF)" />
        <BarChart data={ordersData}  color="#7c3aed" title="Orders per Company" />
      </div>

      {/* Row 2 — Monthly trend full width */}
      <LineChart data={monthData} color="#1a1a2e" title="Monthly Revenue Trend — Last 6 Months (XAF)" />
    </div>
  )
}
