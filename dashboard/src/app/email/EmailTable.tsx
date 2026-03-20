"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

type EmailLog = {
  id:         string
  from:       string
  subject:    string
  category:   string
  priority:   string
  department: string | null
  summary:    string | null
  routedTo:   string | null
  handled:    boolean
  createdAt:  Date | string
}

interface Props {
  emails: EmailLog[]
}

const TABS = ["all", "urgent", "ceo", "sales", "hr", "editorial", "unhandled"] as const
type Tab = typeof TABS[number]

function priorityStyle(p: string): React.CSSProperties {
  switch (p) {
    case "urgent": return { background: "#fef2f2", color: "#dc2626", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }
    case "high":   return { background: "#fff7ed", color: "#ea580c", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }
    case "normal": return { background: "#eff6ff", color: "#2563eb", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }
    default:       return { background: "#f9fafb", color: "#6b7280", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }
  }
}

function categoryStyle(c: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    sales:      { background: "#f0fdf4", color: "#16a34a" },
    hr:         { background: "#fdf4ff", color: "#9333ea" },
    editorial:  { background: "#eff6ff", color: "#2563eb" },
    accounting: { background: "#fffbeb", color: "#d97706" },
    support:    { background: "#f0f9ff", color: "#0284c7" },
    ceo:        { background: "#1a1a2e", color: "#ffffff" },
    spam:       { background: "#fef2f2", color: "#dc2626" },
    general:    { background: "#f9fafb", color: "#6b7280" },
  }
  const s = map[c] ?? map.general
  return { ...s, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + "…" : s
}

export default function EmailTable({ emails }: Props) {
  const router = useRouter()
  const [tab, setTab]           = useState<Tab>("all")
  const [pending, startTransition] = useTransition()
  const [handlingId, setHandlingId] = useState<string | null>(null)

  const filtered = emails.filter(e => {
    if (tab === "all")       return true
    if (tab === "unhandled") return !e.handled
    return e.category === tab || e.priority === tab
  })

  async function markHandled(id: string) {
    setHandlingId(id)
    await fetch(`/api/email/${id}`, { method: "PATCH" })
    startTransition(() => router.refresh())
    setHandlingId(null)
  }

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
              background: tab === t ? "#1a1a2e" : "#f3f4f6",
              color:      tab === t ? "#fff"    : "#374151",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>No emails in this view.</div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["From", "Subject", "Category", "Priority", "Dept", "Summary", "Routed To", "Date", ""].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr
                  key={e.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    background: e.handled ? (i % 2 === 0 ? "#fafafa" : "#f5f5f5") : (i % 2 === 0 ? "#fff" : "#fafafa"),
                    opacity: e.handled ? 0.6 : 1,
                  }}
                >
                  <td style={{ padding: "10px 12px", fontSize: 13, maxWidth: 160 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{truncate(e.from, 28)}</div>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 13, maxWidth: 220 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: e.handled ? 400 : 600 }}>{truncate(e.subject, 40)}</div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={categoryStyle(e.category)}>{e.category}</span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={priorityStyle(e.priority)}>{e.priority}</span>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280" }}>{e.department ?? "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#374151", maxWidth: 240 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.summary ?? "—"}</div>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#6b7280", whiteSpace: "nowrap" }}>{e.routedTo ?? "—"}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                    {String(e.createdAt).slice(0, 10)}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    {!e.handled && (
                      <button
                        onClick={() => markHandled(e.id)}
                        disabled={handlingId === e.id || pending}
                        style={{
                          background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0",
                          borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer",
                          opacity: handlingId === e.id ? 0.6 : 1,
                        }}
                      >
                        {handlingId === e.id ? "…" : "✓ Done"}
                      </button>
                    )}
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
