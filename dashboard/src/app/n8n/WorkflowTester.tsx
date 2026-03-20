"use client"

import { useState } from "react"

const WORKFLOWS = [
  { name: "email_classify",  label: "Email Classify",  payload: { from: "test@school.cm", subject: "Commande urgente de livres", body: "Bonjour, nous souhaitons commander 50 livres de mathématiques CM2." } },
  { name: "stock_alert",     label: "Stock Alert",     payload: { threshold: 10 } },
  { name: "royalty_check",   label: "Royalty Check",   payload: { daysOverdue: 30 } },
  { name: "daily_briefing",  label: "Daily Briefing",  payload: {} },
  { name: "task_reminder",   label: "Task Reminder",   payload: {} },
] as const

type WorkflowName = typeof WORKFLOWS[number]["name"]

export default function WorkflowTester({ secret }: { secret: string }) {
  const [results, setResults]   = useState<Record<WorkflowName, unknown>>({} as Record<WorkflowName, unknown>)
  const [loading, setLoading]   = useState<WorkflowName | null>(null)
  const [errors, setErrors]     = useState<Record<string, string>>({})

  async function trigger(wf: typeof WORKFLOWS[number]) {
    setLoading(wf.name)
    setErrors(prev => { const n = { ...prev }; delete n[wf.name]; return n })

    try {
      const res = await fetch("/api/n8n/trigger", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ workflow: wf.name, payload: wf.payload, secret }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrors(prev => ({ ...prev, [wf.name]: json.error ?? "Failed" }))
      } else {
        setResults(prev => ({ ...prev, [wf.name]: json.result }))
      }
    } catch {
      setErrors(prev => ({ ...prev, [wf.name]: "Network error" }))
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {WORKFLOWS.map(wf => (
        <div key={wf.name} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#111" }}>{wf.label}</span>
              <code style={{ marginLeft: 10, fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>{wf.name}</code>
            </div>
            <button
              onClick={() => trigger(wf)}
              disabled={loading === wf.name}
              style={{
                background: loading === wf.name ? "#e5e7eb" : "#1a1a2e",
                color:      loading === wf.name ? "#6b7280"  : "#fff",
                border: "none", borderRadius: 6, padding: "7px 16px",
                fontSize: 13, fontWeight: 600, cursor: loading === wf.name ? "not-allowed" : "pointer",
              }}
            >
              {loading === wf.name ? "Running…" : "▶ Run"}
            </button>
          </div>

          {errors[wf.name] && (
            <div style={{ marginTop: 10, fontSize: 12, color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 6 }}>
              {errors[wf.name]}
            </div>
          )}

          {results[wf.name] !== undefined && (
            <pre style={{
              marginTop: 10, fontSize: 11, background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 6, padding: "10px 12px", overflow: "auto", maxHeight: 120,
              color: "#374151", lineHeight: 1.5,
            }}>
              {JSON.stringify(results[wf.name], null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  )
}
