"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { S, badge } from "@/lib/ui"

type Worker = { id: number; name: string; department: string; role: string }

interface Props {
  workers: Worker[]
}

const SCRUM_FIELDS = [
  { key: "commitment", label: "Commitment", desc: "Delivers on sprint goals" },
  { key: "courage",    label: "Courage",    desc: "Speaks up, raises blockers" },
  { key: "focus",      label: "Focus",      desc: "Stays on sprint objectives" },
  { key: "openness",   label: "Openness",   desc: "Open to feedback & ideas" },
  { key: "respect",    label: "Respect",    desc: "Treats team with respect" },
] as const

const TASK_FIELDS = [
  { key: "taskCompletion", label: "Task Completion", desc: "% tasks completed this period" },
  { key: "deadlineScore",  label: "Deadline Adherence", desc: "Met deadlines on time" },
  { key: "qualityScore",   label: "Quality of Work",    desc: "Output meets standards" },
] as const

function calcLive(vals: Record<string, number>) {
  const scrum = (vals.commitment + vals.courage + vals.focus + vals.openness + vals.respect) / 5
  const task  = (vals.taskCompletion + vals.deadlineScore + vals.qualityScore) / 3
  const scrumScore = scrum * 10
  const taskScore  = task  * 10
  const latenessPenalty  = Math.min(vals.latenessCount  * 2, 20)
  const sickPenalty      = Math.max(vals.sickDaysCount - 3, 0) * 1.5
  const overworkPenalty  = vals.avgTaskHours > 10 ? 5 : 0
  const behavioralPenalty = Math.min(latenessPenalty + sickPenalty + overworkPenalty, 20)
  const weighted = scrumScore * 0.30 + taskScore * 0.50
  const totalScore = Math.max(0, Math.min(100, weighted * (100 / 80) - behavioralPenalty))
  return { totalScore, scrumScore, taskScore, behavioralPenalty }
}

function getRatingColor(score: number) {
  if (score >= 90) return "#16a34a"
  if (score >= 75) return "#1a73e8"
  if (score >= 60) return "#d97706"
  if (score >= 45) return "#ea580c"
  return "#dc2626"
}

function getRatingLabel(score: number) {
  if (score >= 90) return "Exceptional"
  if (score >= 75) return "Strong"
  if (score >= 60) return "Satisfactory"
  if (score >= 45) return "Needs Improvement"
  return "Underperforming"
}

const DEFAULT_VALS: Record<string, number> = {
  commitment: 5, courage: 5, focus: 5, openness: 5, respect: 5,
  taskCompletion: 5, deadlineScore: 5, qualityScore: 5,
  latenessCount: 0, sickDaysCount: 0, avgTaskHours: 8,
}

export default function EvalForm({ workers }: Props) {
  const router = useRouter()
  const [workerId, setWorkerId]   = useState("")
  const [workerName, setWorkerName] = useState("")
  const [period, setPeriod]       = useState("")
  const [type, setType]           = useState("quarterly")
  const [vals, setVals]           = useState<Record<string, number>>(DEFAULT_VALS)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [result, setResult]       = useState<{
    session: { id: string; totalScore: number; rating: string; aiSummary: string; aiRecommendation: string }
    scrumScore: number; taskScore: number; behavioralPenalty: number
  } | null>(null)

  const live = calcLive(vals)

  function handleWorker(id: string) {
    setWorkerId(id)
    const w = workers.find(w => String(w.id) === id)
    setWorkerName(w?.name ?? "")
  }

  function setVal(key: string, v: number) {
    setVals(prev => ({ ...prev, [key]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!workerId || !period) { setError("Select worker and period."); return }
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/hr/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, workerName, period, type, ...vals }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Error"); return }
      setResult(json)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = getRatingColor(live.totalScore)

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

      {/* ── Form ── */}
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Worker + Period */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 16, color: "#111" }}>Evaluation Setup</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>EMPLOYEE</label>
              <select
                value={workerId}
                onChange={e => handleWorker(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
                required
              >
                <option value="">Select employee…</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name} — {w.department}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>PERIOD (e.g. Q1 2026)</label>
              <input
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder="Q1 2026"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>TYPE</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
              >
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
                <option value="probation">Probation</option>
                <option value="pip">PIP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Scrum Values */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "#111" }}>Scrum Values <span style={{ fontWeight: 400, color: "#6b7280", fontSize: 13 }}>— 30% of score</span></div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Rate each value 0–10</div>
          {SCRUM_FIELDS.map(f => (
            <SliderRow key={f.key} label={f.label} desc={f.desc} value={vals[f.key]} onChange={v => setVal(f.key, v)} />
          ))}
        </div>

        {/* Task Performance */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "#111" }}>Task Performance <span style={{ fontWeight: 400, color: "#6b7280", fontSize: 13 }}>— 50% of score</span></div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Rate each dimension 0–10</div>
          {TASK_FIELDS.map(f => (
            <SliderRow key={f.key} label={f.label} desc={f.desc} value={vals[f.key]} onChange={v => setVal(f.key, v)} />
          ))}
        </div>

        {/* Behavioral */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20 }}>
          <div style={{ fontWeight: 600, marginBottom: 4, color: "#111" }}>Behavioral Inputs <span style={{ fontWeight: 400, color: "#6b7280", fontSize: 13 }}>— penalty deductions</span></div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Each lateness -2pts · Sick days beyond 3 -1.5pts · Avg task hrs &gt;10 -5pts</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <NumInput label="Lateness incidents" value={vals.latenessCount} onChange={v => setVal("latenessCount", v)} min={0} />
            <NumInput label="Sick days" value={vals.sickDaysCount} onChange={v => setVal("sickDaysCount", v)} min={0} />
            <NumInput label="Avg task hours" value={vals.avgTaskHours} onChange={v => setVal("avgTaskHours", v)} min={0} step={0.5} />
          </div>
        </div>

        {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{ background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Evaluating with AI…" : "Run Evaluation"}
        </button>
      </form>

      {/* ── Right panel: live score + result ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24 }}>

        {/* Live score preview */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 8 }}>LIVE SCORE PREVIEW</div>
          <div style={{ fontSize: 56, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{live.totalScore.toFixed(0)}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: scoreColor, marginTop: 4 }}>{getRatingLabel(live.totalScore)}</div>

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <ScoreBar label="Scrum Values" value={live.scrumScore} color="#7c3aed" />
            <ScoreBar label="Task Perf."   value={live.taskScore}  color="#1a73e8" />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#dc2626" }}>
              <span>Behavioral penalty</span>
              <span>-{live.behavioralPenalty.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* AI Result card */}
        {result && (
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 20 }}>
            <div style={{ fontWeight: 600, color: "#16a34a", marginBottom: 12 }}>✓ Evaluation Complete</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Final Score</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: getRatingColor(result.session.totalScore) }}>
              {result.session.totalScore.toFixed(1)} — {result.session.rating}
            </div>

            {result.session.aiSummary && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>AI SUMMARY</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{result.session.aiSummary}</div>
              </div>
            )}

            {result.session.aiRecommendation && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", marginBottom: 4 }}>RECOMMENDATION</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{result.session.aiRecommendation}</div>
              </div>
            )}

            <button
              onClick={() => router.push("/hr/evaluations")}
              style={{ marginTop: 16, width: "100%", background: "#16a34a", color: "#fff", border: "none", borderRadius: 6, padding: "8px 0", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              View All Evaluations →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SliderRow({ label, desc, value, onChange }: { label: string; desc: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</span>
          <span style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{desc}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", minWidth: 20, textAlign: "right" }}>{value}</span>
      </div>
      <input
        type="range" min={0} max={10} step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: "#1a1a2e" }}
      />
    </div>
  )
}

function NumInput({ label, value, onChange, min = 0, step = 1 }: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#6b7280", display: "block", marginBottom: 6 }}>{label.toUpperCase()}</label>
      <input
        type="number" min={min} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14 }}
      />
    </div>
  )
}

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
        <span style={{ color: "#6b7280" }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{value.toFixed(1)}</span>
      </div>
      <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3 }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 3, transition: "width 0.3s" }} />
      </div>
    </div>
  )
}
