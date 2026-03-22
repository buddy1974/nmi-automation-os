"use client"

import { useState, useEffect } from "react"

interface BriefingData {
  date:              string
  yesterdayOrders:   number
  yesterdayRevenue:  number
  pendingInvoices:   number
  pendingInvoiceAmt: number
  unreadNotifs:      number
  urgentNotifs:      number
  openTasks:         number
  overdueTasks:      number
  lowStockItems:     number
  unpaidRoyalties:   number
  unpaidRoyaltyAmt:  number
  unhandledWhatsApp: number
  unhandledEmails:   number
  urgentEmails:      number
  topPerformer:      string | null
  topPerformerScore: number | null
  clockedInToday:    number
}

interface Briefing {
  id:        string
  title:     string
  message:   string
  createdAt: string
  severity:  string
}

interface HistoryItem { id: string; title: string; createdAt: string; message: string }

function todayStr() { return new Date().toISOString().slice(0, 10) }

function KpiPill({ label, value, urgent }: { label: string; value: string | number; urgent?: boolean }) {
  return (
    <div style={{
      background: urgent ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.08)",
      border: `1px solid ${urgent ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.12)"}`,
      borderRadius: 8, padding: "8px 14px", textAlign: "center",
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: urgent ? "#fca5a5" : "#f1f5f9" }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", marginTop: 2, textTransform: "uppercase" }}>{label}</div>
    </div>
  )
}

function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) {
      return <div key={i} style={{ fontSize: 15, fontWeight: 700, color: "#93c5fd", margin: "14px 0 4px" }}>{line.slice(3)}</div>
    }
    if (line.startsWith("**") && line.endsWith("**")) {
      return <div key={i} style={{ fontWeight: 700, color: "#f1f5f9" }}>{line.slice(2, -2)}</div>
    }
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <div key={i}>
        {parts.map((p, j) =>
          j % 2 === 1
            ? <strong key={j} style={{ color: "#f1f5f9" }}>{p}</strong>
            : p
        )}
      </div>
    )
  })
}

export default function BriefingClient() {
  const [loading,      setLoading]      = useState(false)
  const [generating,   setGenerating]   = useState(false)
  const [briefing,     setBriefing]     = useState<Briefing | null>(null)
  const [data,         setData]         = useState<BriefingData | null>(null)
  const [history,      setHistory]      = useState<HistoryItem[]>([])
  const [expanded,     setExpanded]     = useState<string | null>(null)
  const [error,        setError]        = useState("")

  const today = todayStr()

  async function fetchLatest() {
    setLoading(true)
    try {
      const res  = await fetch("/api/briefing/latest")
      if (!res.ok) return
      const json = await res.json()
      if (json.latest) setBriefing(json.latest)
      if (json.history) setHistory(json.history)

      if (!json.latest || !json.latest.title.includes(today)) {
        await generate()
      }
    } catch {
      // silently fail — user can manually generate
    } finally {
      setLoading(false)
    }
  }

  async function generate() {
    setGenerating(true)
    setError("")
    try {
      const res  = await fetch("/api/briefing/generate", { method: "POST" })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Generation failed"); return }
      setBriefing({ id: json.notificationId, title: `CEO Morning Briefing — ${today}`, message: json.briefing, createdAt: new Date().toISOString(), severity: "info" })
      setData(json.data)
      const h = await fetch("/api/briefing/latest")
      if (h.ok) { const hj = await h.json(); setHistory(hj.history ?? []) }
    } catch {
      setError("Network error — please try again.")
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => { fetchLatest() }, [])

  const isToday = briefing?.title.includes(today)

  return (
    <div style={{ padding: 32, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>CEO Morning Briefing</h1>
          <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
            {today} · AI-generated executive summary of all business areas
          </p>
        </div>
        <button
          onClick={generate}
          disabled={generating || loading}
          style={{
            background: generating ? "#e5e7eb" : "#1a1a2e",
            color:      generating ? "#9ca3af"  : "#fff",
            border: "none", borderRadius: 8, padding: "10px 20px",
            fontSize: 14, fontWeight: 700, cursor: generating ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {generating ? (
            <>
              <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
              Generating…
            </>
          ) : isToday ? "↺ Regenerate" : "✦ Generate Today's Briefing"}
        </button>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 16px", color: "#dc2626", fontSize: 13, marginBottom: 20 }}>
          {error}
        </div>
      )}

      {loading && !briefing && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>Loading briefing…</div>
      )}

      {/* Main briefing card */}
      {briefing && (
        <div style={{
          background:   "#1a1a2e",
          borderRadius: 16,
          padding:      32,
          marginBottom: 24,
          boxShadow:    "0 8px 32px rgba(0,0,0,0.2)",
        }}>
          {/* Card header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", marginBottom: 4 }}>
                NMI EDUCATION
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f1f5f9" }}>
                {isToday ? "Today's" : "Latest"} Executive Briefing
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                Generated {new Date(briefing.createdAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })}
              </div>
            </div>
            {!isToday && (
              <span style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                NOT TODAY
              </span>
            )}
          </div>

          {/* Briefing text with markdown */}
          <div style={{
            fontSize:    14,
            lineHeight:  1.8,
            color:       "#cbd5e1",
            borderLeft:  "3px solid #1a73e8",
            paddingLeft: 16,
            marginBottom: data ? 24 : 0,
          }}>
            {renderMarkdown(briefing.message)}
          </div>

          {/* KPI pills */}
          {data && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", marginBottom: 12 }}>
                DATA SNAPSHOT
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                <KpiPill label="Yesterday Orders"  value={data.yesterdayOrders} />
                <KpiPill label="Revenue (XAF)"     value={data.yesterdayRevenue.toLocaleString()} />
                <KpiPill label="Pending Invoices"  value={data.pendingInvoices} urgent={data.pendingInvoices > 5} />
                <KpiPill label="Unpaid (XAF)"      value={data.pendingInvoiceAmt.toLocaleString()} />
                <KpiPill label="Open Tasks"        value={data.openTasks} />
                <KpiPill label="Overdue Tasks"     value={data.overdueTasks} urgent={data.overdueTasks > 0} />
                <KpiPill label="WhatsApp Pending"  value={data.unhandledWhatsApp} urgent={data.unhandledWhatsApp > 3} />
                <KpiPill label="Urgent Emails"     value={data.urgentEmails} urgent={data.urgentEmails > 0} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 1 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111", marginBottom: 12 }}>Previous Briefings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.filter(h => h.id !== briefing?.id).map(h => (
              <div
                key={h.id}
                style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}
              >
                <button
                  onClick={() => setExpanded(expanded === h.id ? null : h.id)}
                  style={{
                    width: "100%", padding: "12px 16px", background: "transparent", border: "none",
                    cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{h.title}</span>
                  <span style={{ fontSize: 12, color: "#9ca3af" }}>
                    {new Date(h.createdAt).toLocaleDateString()} {expanded === h.id ? "▲" : "▼"}
                  </span>
                </button>
                {expanded === h.id && (
                  <div style={{
                    padding:    "0 16px 16px",
                    fontSize:   13,
                    lineHeight: 1.7,
                    color:      "#374151",
                    whiteSpace: "pre-wrap",
                    borderTop:  "1px solid #f3f4f6",
                    paddingTop: 12,
                  }}>
                    {h.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
