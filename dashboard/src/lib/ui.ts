import type { CSSProperties } from "react"

// ── Design tokens ─────────────────────────────────────────────────────────────

export const C = {
  bg:         "#f4f6f9",
  white:      "#ffffff",
  sidebar:    "#1a1a2e",
  accent:     "#2563eb",
  textPri:    "#1e293b",
  textSec:    "#64748b",
  border:     "#e2e8f0",
  borderLight:"#f1f5f9",
}

// ── Page ──────────────────────────────────────────────────────────────────────

export const S = {
  page: {
    padding:    "32px",
    background: C.bg,
    minHeight:  "100vh",
    fontFamily: "Arial, sans-serif",
    color:      C.textPri,
  } satisfies CSSProperties,

  heading: {
    fontSize:     "28px",
    fontWeight:   700,
    color:        "#1a1a2e",
    margin:       "0 0 4px",
    lineHeight:   1.2,
  } satisfies CSSProperties,

  subtitle: {
    fontSize:     "14px",
    color:        C.textSec,
    margin:       "0 0 24px",
  } satisfies CSSProperties,

  sectionTitle: {
    fontSize:     "16px",
    fontWeight:   700,
    color:        "#1a1a2e",
    margin:       "32px 0 12px",
    paddingBottom:"8px",
    borderBottom: `1px solid ${C.border}`,
  } satisfies CSSProperties,

  // ── KPI cards ───────────────────────────────────────────────────────────────

  statBar: {
    display:      "flex",
    flexWrap:     "wrap",
    gap:          "16px",
    marginBottom: "32px",
  } satisfies CSSProperties,

  statCard: {
    background:   C.white,
    border:       `1px solid ${C.border}`,
    borderRadius: "8px",
    padding:      "20px",
    minWidth:     "150px",
    flex:         "1 1 150px",
  } satisfies CSSProperties,

  statValue: {
    fontSize:   "32px",
    fontWeight: 700,
    color:      C.accent,
    lineHeight: 1,
    marginBottom:"4px",
  } satisfies CSSProperties,

  statLabel: {
    fontSize:      "11px",
    textTransform: "uppercase",
    letterSpacing: "1px",
    color:         C.textSec,
  } satisfies CSSProperties,

  // ── Table ───────────────────────────────────────────────────────────────────

  tableWrap: {
    background:   C.white,
    border:       `1px solid ${C.border}`,
    borderRadius: "8px",
    overflow:     "hidden",
    marginBottom: "8px",
  } satisfies CSSProperties,

  table: {
    width:          "100%",
    borderCollapse: "collapse",
  } satisfies CSSProperties,

  th: {
    background:    "#f8fafc",
    padding:       "12px 16px",
    textAlign:     "left",
    fontSize:      "12px",
    fontWeight:    600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color:         C.textSec,
    borderBottom:  `2px solid ${C.border}`,
    whiteSpace:    "nowrap",
  } satisfies CSSProperties,

  td: {
    padding:      "12px 16px",
    fontSize:     "14px",
    color:        C.textPri,
    borderBottom: `1px solid ${C.borderLight}`,
    verticalAlign:"top",
  } satisfies CSSProperties,

  rowEven: { background: C.white    } satisfies CSSProperties,
  rowOdd:  { background: "#f8fafc" } satisfies CSSProperties,

  // ── Alert boxes ─────────────────────────────────────────────────────────────

  alertRed: {
    padding:      "12px 16px",
    borderRadius: "8px",
    borderLeft:   "4px solid #ef4444",
    background:   "#fee2e2",
    color:        "#991b1b",
    fontSize:     "14px",
    marginBottom: "8px",
  } satisfies CSSProperties,

  alertOrange: {
    padding:      "12px 16px",
    borderRadius: "8px",
    borderLeft:   "4px solid #f97316",
    background:   "#fff7ed",
    color:        "#9a3412",
    fontSize:     "14px",
    marginBottom: "8px",
  } satisfies CSSProperties,

  alertBlue: {
    padding:      "12px 16px",
    borderRadius: "8px",
    borderLeft:   "4px solid #2563eb",
    background:   "#dbeafe",
    color:        "#1d4ed8",
    fontSize:     "14px",
    marginBottom: "8px",
  } satisfies CSSProperties,

  successText: {
    color:      "#166534",
    fontWeight: 600,
    fontSize:   "14px",
  } satisfies CSSProperties,

  mutedText: {
    color:    C.textSec,
    fontSize: "13px",
  } satisfies CSSProperties,

  // ── KPI accent card (owner) ──────────────────────────────────────────────────

  kpiCard: (accent: string): CSSProperties => ({
    background:   C.white,
    border:       `1px solid ${C.border}`,
    borderTop:    `4px solid ${accent}`,
    borderRadius: "8px",
    padding:      "20px",
    flex:         "1 1 180px",
  }),
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Zebra row style by index */
export function row(i: number): CSSProperties {
  return i % 2 === 0 ? S.rowEven : S.rowOdd
}

/** Pill badge — soft semantic colours */
export function badge(
  variant: "green" | "red" | "orange" | "blue" | "grey",
  text?: string,
): CSSProperties {
  const map: Record<string, [string, string]> = {
    green:  ["#dcfce7", "#166534"],
    red:    ["#fee2e2", "#991b1b"],
    orange: ["#fff7ed", "#9a3412"],
    blue:   ["#dbeafe", "#1d4ed8"],
    grey:   ["#f1f5f9", "#475569"],
  }
  const [bg, color] = map[variant]
  return {
    display:      "inline-block",
    borderRadius: "999px",
    padding:      "2px 10px",
    fontSize:     "12px",
    fontWeight:   600,
    background:   bg,
    color,
    whiteSpace:   "nowrap",
  }
}

/** Pick badge variant by status string */
export function statusBadge(status: string): CSSProperties {
  const greens  = ["active","paid","approved","delivered","in_stock","printed","yes"]
  const reds    = ["cancelled","rejected","suspended","inactive","overdue","no","missing"]
  const oranges = ["pending","partial","reviewing","editing","planned","warning","unpaid"]
  const blues   = ["issued","confirmed","printing","ready_for_print","reviewing","submitted"]

  if (greens.some(s  => status.toLowerCase().includes(s))) return badge("green")
  if (reds.some(s    => status.toLowerCase().includes(s))) return badge("red")
  if (oranges.some(s => status.toLowerCase().includes(s))) return badge("orange")
  if (blues.some(s   => status.toLowerCase().includes(s))) return badge("blue")
  return badge("grey")
}
