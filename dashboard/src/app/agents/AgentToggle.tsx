"use client"

import { useState } from "react"

export default function AgentToggle({ agentId, enabled: initialEnabled }: { agentId: string; enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    try {
      const res = await fetch("/api/agents", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ agentId, enabled: !enabled }),
      })
      if (res.ok) setEnabled(e => !e)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        display:      "flex",
        alignItems:   "center",
        gap:          6,
        background:   "transparent",
        border:       `1px solid ${enabled ? "#bbf7d0" : "#e2e8f0"}`,
        borderRadius: "999px",
        padding:      "3px 12px",
        fontSize:     11,
        fontWeight:   700,
        color:        enabled ? "#16a34a" : "#9ca3af",
        cursor:       loading ? "not-allowed" : "pointer",
        flexShrink:   0,
        whiteSpace:   "nowrap",
        transition:   "all 0.15s",
      }}
    >
      <span style={{
        width:        8,
        height:       8,
        borderRadius: "50%",
        background:   enabled ? "#16a34a" : "#d1d5db",
        display:      "inline-block",
        flexShrink:   0,
      }} />
      {loading ? "…" : enabled ? "Enabled" : "Disabled"}
    </button>
  )
}
