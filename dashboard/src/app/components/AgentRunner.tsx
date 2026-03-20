"use client"

import { useState } from "react"

interface RunResult {
  actions: number
  summary: string
  details: Record<string, unknown>
}

export default function AgentRunner({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [running, setRunning] = useState(false)
  const [result,  setResult]  = useState<RunResult | null>(null)
  const [error,   setError]   = useState("")

  async function run() {
    setRunning(true)
    setResult(null)
    setError("")
    try {
      const res  = await fetch(`/api/agents/run/${agentId}`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? json.detail ?? "Run failed")
      } else {
        setResult(json.result)
      }
    } catch {
      setError("Network error — please try again")
    } finally {
      setRunning(false)
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={running}
        style={{
          background:   running ? "#f1f5f9" : "#1a1a2e",
          color:        running ? "#9ca3af" : "#fff",
          border:       "none",
          borderRadius: "6px",
          padding:      "7px 16px",
          fontSize:     "13px",
          fontWeight:   700,
          cursor:       running ? "not-allowed" : "pointer",
          display:      "flex",
          alignItems:   "center",
          gap:          "6px",
          whiteSpace:   "nowrap",
        }}
        title={`Run ${agentName}`}
      >
        {running ? (
          <>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 14 }}>⟳</span>
            Running…
          </>
        ) : (
          <>▶ Run Now</>
        )}
      </button>

      {error && (
        <div style={{
          marginTop:    8,
          padding:      "6px 10px",
          background:   "#fef2f2",
          border:       "1px solid #fecaca",
          borderRadius: 6,
          fontSize:     12,
          color:        "#dc2626",
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop:    8,
          padding:      "8px 12px",
          background:   "#f0fdf4",
          border:       "1px solid #bbf7d0",
          borderRadius: 6,
          fontSize:     12,
          color:        "#166534",
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>✓ Completed — {result.actions} action{result.actions !== 1 ? "s" : ""}</div>
          <div style={{ color: "#15803d" }}>{result.summary}</div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
