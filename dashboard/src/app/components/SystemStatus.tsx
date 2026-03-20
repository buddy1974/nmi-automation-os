"use client"

import { useState, useEffect } from "react"

interface StatusData {
  status:           string
  db:               string
  lastSchedulerRun: string | null
}

function Dot({ ok }: { ok: boolean }) {
  return (
    <span style={{
      display:      "inline-block",
      width:        8,
      height:       8,
      borderRadius: "50%",
      background:   ok ? "#22c55e" : "#ef4444",
      marginRight:  6,
      flexShrink:   0,
    }} />
  )
}

export default function SystemStatus() {
  const [data,    setData]    = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/n8n/status")
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) setData(j) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  const dbOk = data?.db === "connected"
  const aiOk = data?.status === "ok"

  return (
    <div style={{
      display:      "flex",
      alignItems:   "center",
      gap:          20,
      background:   "#fff",
      border:       "1px solid #e2e8f0",
      borderRadius: 8,
      padding:      "10px 18px",
      fontSize:     12,
      color:        "#64748b",
      flexWrap:     "wrap",
    }}>
      <span style={{ fontWeight: 700, color: "#374151", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        System Status
      </span>
      <span style={{ display: "flex", alignItems: "center" }}>
        <Dot ok={dbOk} />
        Database {dbOk ? "connected" : "error"}
      </span>
      <span style={{ display: "flex", alignItems: "center" }}>
        <Dot ok={aiOk} />
        AI engine {aiOk ? "online" : "offline"}
      </span>
      {data?.lastSchedulerRun && (
        <span style={{ display: "flex", alignItems: "center" }}>
          <Dot ok={true} />
          Last briefing: {new Date(data.lastSchedulerRun).toLocaleDateString("en-GB")}
        </span>
      )}
    </div>
  )
}
