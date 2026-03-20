// ── Shared inline style constants ─────────────────────────────────────────────
// Used across all dashboard pages for consistent UI.
// No Tailwind — inline styles only, consistent with existing codebase.

import type { CSSProperties } from "react"

export const S = {
  // ── Page wrapper ──────────────────────────────────────────────────────────
  page: {
    padding:    "28px 32px",
    fontFamily: "Arial, sans-serif",
    maxWidth:   "1200px",
    color:      "#111",
  } satisfies CSSProperties,

  // ── Page header ───────────────────────────────────────────────────────────
  heading: {
    margin:     "0 0 4px",
    fontSize:   "22px",
    fontWeight: 700,
    color:      "#1a1a2e",
  } satisfies CSSProperties,

  subtitle: {
    margin:   "0 0 24px",
    color:    "#64748b",
    fontSize: "13px",
  } satisfies CSSProperties,

  // ── Summary stat bar ──────────────────────────────────────────────────────
  statBar: {
    display:       "flex",
    gap:           "12px",
    marginBottom:  "28px",
    flexWrap:      "wrap",
  } satisfies CSSProperties,

  statCard: {
    background:   "#f8fafc",
    border:       "1px solid #e2e8f0",
    borderRadius: "8px",
    padding:      "14px 20px",
    minWidth:     "140px",
  } satisfies CSSProperties,

  statLabel: {
    fontSize:      "11px",
    color:         "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom:  "4px",
  } satisfies CSSProperties,

  statValue: {
    fontSize:   "22px",
    fontWeight: 700,
    color:      "#1a1a2e",
  } satisfies CSSProperties,

  // ── Section heading ───────────────────────────────────────────────────────
  sectionTitle: {
    fontSize:   "15px",
    fontWeight: 700,
    margin:     "28px 0 12px",
    color:      "#1a1a2e",
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: "6px",
  } satisfies CSSProperties,

  // ── Table ─────────────────────────────────────────────────────────────────
  tableWrap: {
    overflowX:    "auto",
    marginBottom: "8px",
  } satisfies CSSProperties,

  table: {
    width:           "100%",
    borderCollapse:  "collapse",
    fontSize:        "13px",
  } satisfies CSSProperties,

  th: {
    padding:      "10px 14px",
    textAlign:    "left",
    fontWeight:   700,
    color:        "#475569",
    background:   "#f1f5f9",
    borderBottom: "2px solid #e2e8f0",
    whiteSpace:   "nowrap",
  } satisfies CSSProperties,

  td: {
    padding:      "10px 14px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  } satisfies CSSProperties,

  rowEven: { background: "#ffffff" } satisfies CSSProperties,
  rowOdd:  { background: "#f8fafc" } satisfies CSSProperties,

  // ── Badges ────────────────────────────────────────────────────────────────
  badge: (color: string): CSSProperties => ({
    display:      "inline-block",
    padding:      "2px 8px",
    borderRadius: "4px",
    fontSize:     "11px",
    fontWeight:   700,
    color:        "#fff",
    background:   color,
    whiteSpace:   "nowrap",
  }),

  // ── Alert row ─────────────────────────────────────────────────────────────
  alertBox: {
    background:   "#fef2f2",
    border:       "1px solid #fca5a5",
    borderLeft:   "4px solid #dc2626",
    borderRadius: "6px",
    padding:      "10px 14px",
    marginBottom: "8px",
    fontSize:     "13px",
    color:        "#7f1d1d",
  } satisfies CSSProperties,

  successText: {
    color:      "#16a34a",
    fontWeight: 600,
  } satisfies CSSProperties,

  mutedText: {
    color: "#94a3b8",
  } satisfies CSSProperties,

  // ── KPI card (owner/exec) ─────────────────────────────────────────────────
  kpiCard: (accent: string): CSSProperties => ({
    background:   "#ffffff",
    border:       "1px solid #e5e7eb",
    borderTop:    `4px solid ${accent}`,
    borderRadius: "12px",
    padding:      "20px 24px",
    boxShadow:    "0 1px 4px rgba(0,0,0,0.05)",
    flex:         "1 1 180px",
  }),
}

/** Zebra row style by index */
export function row(i: number): CSSProperties {
  return i % 2 === 0 ? S.rowEven : S.rowOdd
}
