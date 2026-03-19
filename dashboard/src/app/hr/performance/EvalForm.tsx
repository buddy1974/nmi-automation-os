"use client"

import { useActionState } from "react"
import { createPerformanceRecord } from "./actions"

interface Worker { id: number; name: string; role: string }

const KPI_FIELDS: { name: string; label: string; hint: string }[] = [
  { name: "attendance",   label: "Attendance",   hint: "Days present / expected × 100" },
  { name: "productivity", label: "Productivity", hint: "Output vs target" },
  { name: "quality",      label: "Quality",      hint: "Work quality rating" },
  { name: "teamwork",     label: "Teamwork",     hint: "Collaboration score" },
  { name: "discipline",   label: "Discipline",   hint: "Punctuality & compliance" },
]

export default function EvalForm({ workers }: { workers: Worker[] }) {

  const [state, action, pending] = useActionState(createPerformanceRecord, null)

  return (
    <div style={{
      background: "#f8f9ff",
      border: "1px solid #e0e4f8",
      borderRadius: "8px",
      padding: "24px",
      marginBottom: "40px",
      maxWidth: "640px",
    }}>
      <h2 style={{ margin: "0 0 20px", fontSize: "16px", fontWeight: 700 }}>New evaluation</h2>

      {state?.error && (
        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#dc2626" }}>
          {state.error}
        </div>
      )}
      {state?.success && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "6px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", color: "#16a34a" }}>
          Evaluation saved.
        </div>
      )}

      <form action={action}>

        {/* Worker + Period */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={labelStyle}>Worker</label>
            <select name="workerId" required style={inputStyle}>
              <option value="">Select worker…</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.name} — {w.role}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Period</label>
            <input name="period" required placeholder="e.g. 2026-Q1" style={inputStyle} />
          </div>
        </div>

        {/* KPI scores */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          {KPI_FIELDS.map(f => (
            <div key={f.name}>
              <label style={labelStyle} title={f.hint}>{f.label} <span style={{ color: "#aaa", fontWeight: 400 }}>(0–100)</span></label>
              <input
                name={f.name}
                type="number"
                min="0"
                max="100"
                defaultValue="0"
                required
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        {/* Manager note */}
        <div style={{ marginBottom: "16px" }}>
          <label style={labelStyle}>Manager note <span style={{ color: "#aaa", fontWeight: 400 }}>(optional)</span></label>
          <textarea
            name="managerNote"
            rows={3}
            placeholder="Add context, observations, or recommendations…"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          style={{
            padding: "10px 24px",
            background: pending ? "#9ca3af" : "#1a1a2e",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: pending ? "not-allowed" : "pointer",
          }}
        >
          {pending ? "Saving…" : "Save evaluation"}
        </button>

      </form>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: "12px", fontWeight: 600,
  marginBottom: "5px", color: "#374151",
}
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: "1px solid #d1d5db",
  borderRadius: "6px", fontSize: "13px", boxSizing: "border-box",
}
