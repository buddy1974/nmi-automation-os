"use client"

import { useState } from "react"

type WAMsg = {
  id:           string
  from:         string
  customerName: string | null
  message:      string
  reply:        string | null
  status:       string
  handled:      boolean
  lang:         string
  createdAt:    string
}

const TABS = ["All", "Unhandled", "Today", "French", "English"] as const
type Tab = typeof TABS[number]

function statusStyle(s: string): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    received:  { background: "#eff6ff", color: "#1a73e8" },
    replied:   { background: "#f0fdf4", color: "#16a34a" },
    escalated: { background: "#fff7ed", color: "#ea580c" },
    handled:   { background: "#f9fafb", color: "#6b7280" },
  }
  return { ...(map[s] ?? map.received), padding: "2px 9px", borderRadius: 10, fontSize: 11, fontWeight: 700 }
}

function trunc(s: string, n: number) { return s.length > n ? s.slice(0, n) + "…" : s }

export default function WATable({ messages }: { messages: WAMsg[] }) {
  const [tab, setTab] = useState<Tab>("All")

  const today = new Date(); today.setHours(0, 0, 0, 0)

  const filtered = messages.filter(m => {
    if (tab === "All")       return true
    if (tab === "Unhandled") return !m.handled
    if (tab === "Today")     return new Date(m.createdAt) >= today
    if (tab === "French")    return m.lang === "French"
    if (tab === "English")   return m.lang === "English"
    return true
  })

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              cursor: "pointer", border: "none",
              background: tab === t ? "#25d366" : "#f3f4f6",
              color:      tab === t ? "#fff"    : "#374151",
            }}
          >
            {t}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>
          {filtered.length} messages
        </span>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>No messages in this view.</div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["Customer", "Message", "AI Reply", "Lang", "Status", "Date"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{m.customerName ?? "Unknown"}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>{m.from}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151", maxWidth: 240 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{trunc(m.message, 60)}</div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#6b7280", maxWidth: 260 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.reply ? trunc(m.reply, 60) : <em>—</em>}</div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                      background: m.lang === "French" ? "#eff6ff" : m.lang === "English" ? "#f0fdf4" : "#f3f4f6",
                      color:      m.lang === "French" ? "#1a73e8" : m.lang === "English" ? "#16a34a" : "#6b7280",
                    }}>
                      {m.lang}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={statusStyle(m.status)}>{m.status}</span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap" }}>
                    {m.createdAt.slice(0, 10)}
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
