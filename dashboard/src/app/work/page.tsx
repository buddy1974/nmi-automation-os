"use client"

import { useState, useEffect, useCallback } from "react"

// ── Types ─────────────────────────────────────────────────────────────────────

type UserInfo = { id: string; name: string; role: string; companyId: string | null }

type WorkSession = {
  id: string; workerId: string; clockIn: string; clockOut: string | null
  hoursTotal: number | null; note: string | null
}

type Task = {
  id: string; title: string; description: string | null
  status: string; priority: string; department: string | null
  ownerId: string | null; ownerName: string | null
  estimatedH: number | null; actualH: number | null
  dueDate: string | null; createdAt: string; updatedAt: string
}

type SessionData = {
  openSession: WorkSession | null
  todaySessions: WorkSession[]
  todayHours: number
  weeklyHours: number
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const card: React.CSSProperties = {
  background: "#fff", border: "1px solid #e2e8f0",
  borderRadius: "10px", padding: "20px",
}

const PRIORITY_STYLE: Record<string, React.CSSProperties> = {
  urgent: { background: "#fee2e2", color: "#991b1b", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" },
  high:   { background: "#fff7ed", color: "#9a3412", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" },
  medium: { background: "#dbeafe", color: "#1d4ed8", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" },
  low:    { background: "#f1f5f9", color: "#475569", fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px" },
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
}

function elapsed(from: string): string {
  const s = Math.floor((Date.now() - new Date(from).getTime()) / 1000)
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60)
  return `${h}h ${m.toString().padStart(2, "0")}m`
}

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkPage() {
  const [user,        setUser]        = useState<UserInfo | null>(null)
  const [sessions,    setSessions]    = useState<SessionData | null>(null)
  const [tasks,       setTasks]       = useState<Task[]>([])
  const [clockNote,   setClockNote]   = useState("")
  const [clockLoading,setClockLoading]= useState(false)
  const [tick,        setTick]        = useState(0)   // drives elapsed time re-render

  // New task form state
  const [showForm,  setShowForm]  = useState(false)
  const [formTitle, setFormTitle] = useState("")
  const [formDesc,  setFormDesc]  = useState("")
  const [formPri,   setFormPri]   = useState("medium")
  const [formDept,  setFormDept]  = useState("")
  const [formH,     setFormH]     = useState("")
  const [formSaving,setFormSaving]= useState(false)
  const [msg,       setMsg]       = useState("")

  const isPriv = user?.role === "admin" || user?.role === "owner"

  // ── Data loaders ───────────────────────────────────────────────────────────

  const loadUser = useCallback(async () => {
    const r = await fetch("/api/auth/me")
    if (r.ok) setUser(await r.json())
  }, [])

  const loadSessions = useCallback(async () => {
    const r = await fetch("/api/work/sessions")
    if (r.ok) setSessions(await r.json())
  }, [])

  const loadTasks = useCallback(async () => {
    const r = await fetch("/api/tasks")
    if (r.ok) setTasks(await r.json())
  }, [])

  useEffect(() => { loadUser() }, [loadUser])
  useEffect(() => { loadSessions(); loadTasks() }, [loadSessions, loadTasks])

  // Elapsed-time ticker (every 30 s)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  // CEO auto-refresh tasks every 30 s
  useEffect(() => {
    if (!isPriv) return
    const id = setInterval(loadTasks, 30_000)
    return () => clearInterval(id)
  }, [isPriv, loadTasks])

  // ── Clock actions ──────────────────────────────────────────────────────────

  async function handleClock() {
    if (!sessions) return
    const action = sessions.openSession ? "out" : "in"
    setClockLoading(true)
    const r = await fetch("/api/work/clock", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: clockNote || undefined }),
    })
    if (r.ok) {
      await loadSessions()
      setClockNote("")
      setMsg(action === "in" ? "Clocked in ✓" : "Clocked out ✓")
      setTimeout(() => setMsg(""), 3000)
    }
    setClockLoading(false)
  }

  // ── Task actions ───────────────────────────────────────────────────────────

  async function moveTask(id: string, status: string) {
    const r = await fetch(`/api/tasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (r.ok) setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  async function deleteTask(id: string) {
    const r = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    if (r.ok) setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return
    setFormSaving(true)
    const r = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formTitle, description: formDesc || undefined,
        priority: formPri, department: formDept || undefined,
        estimatedH: formH ? Number(formH) : undefined,
        ownerName: user?.name,
      }),
    })
    if (r.ok) {
      const task = await r.json()
      setTasks(prev => [task, ...prev])
      setFormTitle(""); setFormDesc(""); setFormPri("medium")
      setFormDept(""); setFormH(""); setShowForm(false)
    }
    setFormSaving(false)
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const todo       = tasks.filter(t => t.status === "todo")
  const inProgress = tasks.filter(t => t.status === "in_progress")
  const done       = tasks.filter(t => t.status === "done")
  const isClockedIn = !!sessions?.openSession

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: "8px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#1e293b", margin: 0 }}>Work OS</h1>
        <p style={{ color: "#64748b", fontSize: "13px", margin: "4px 0 0" }}>
          Clock in/out · Task board · {isPriv ? "Full team view" : "Your tasks"}
        </p>
      </div>

      {msg && (
        <div style={{ background: "#dcfce7", color: "#166534", padding: "8px 14px", borderRadius: "7px", fontSize: "13px", fontWeight: 600, marginBottom: "16px" }}>
          {msg}
        </div>
      )}

      {/* ── Section A — Clock panel ───────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "28px" }}>

        {/* Clock button card */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Attendance
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: 12, height: 12, borderRadius: "50%",
              background: isClockedIn ? "#16a34a" : "#94a3b8",
              boxShadow: isClockedIn ? "0 0 0 4px #dcfce7" : "none",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "13px", fontWeight: 600, color: isClockedIn ? "#16a34a" : "#64748b" }}>
              {isClockedIn
                ? `Clocked in — ${elapsed(sessions!.openSession!.clockIn)} (${tick >= 0 ? "" : ""}${fmtTime(sessions!.openSession!.clockIn)})`
                : "Not clocked in"}
            </span>
          </div>

          <input
            value={clockNote}
            onChange={e => setClockNote(e.target.value)}
            placeholder="Optional note…"
            style={{ padding: "7px 10px", borderRadius: "7px", border: "1px solid #e2e8f0", fontSize: "12px", outline: "none" }}
          />

          <button
            onClick={handleClock}
            disabled={clockLoading || !sessions}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: isClockedIn ? "#ef4444" : "#16a34a",
              color: "#fff",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              opacity: clockLoading ? 0.7 : 1,
            }}
          >
            {clockLoading ? "…" : isClockedIn ? "CLOCK OUT" : "CLOCK IN"}
          </button>
        </div>

        {/* Today stats */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Today
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#2563eb" }}>
            {sessions?.todayHours.toFixed(1) ?? "—"}<span style={{ fontSize: "14px", color: "#64748b", marginLeft: "4px" }}>hrs</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {(sessions?.todaySessions ?? []).slice(0, 4).map((s, i) => (
              <div key={i} style={{ fontSize: "11px", color: "#64748b", display: "flex", justifyContent: "space-between" }}>
                <span>{fmtTime(s.clockIn)} — {s.clockOut ? fmtTime(s.clockOut) : "active"}</span>
                <span style={{ fontWeight: 600, color: s.clockOut ? "#16a34a" : "#f97316" }}>
                  {s.hoursTotal ? `${s.hoursTotal}h` : "…"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Week stats */}
        <div style={{ ...card, display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            This Week
          </div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#7c3aed" }}>
            {sessions?.weeklyHours.toFixed(1) ?? "—"}<span style={{ fontSize: "14px", color: "#64748b", marginLeft: "4px" }}>hrs</span>
          </div>
          <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "999px", background: "#7c3aed",
              width: `${Math.min(((sessions?.weeklyHours ?? 0) / 40) * 100, 100)}%`,
              transition: "width .4s",
            }} />
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            {sessions ? `${Math.round(((sessions.weeklyHours ?? 0) / 40) * 100)}% of 40h target` : "Loading…"}
          </div>
          <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(["todo", "in_progress", "done"] as const).map((s, _, arr) => {
              const count = tasks.filter(t => t.status === s && (isPriv || t.ownerId === user?.id)).length
              const label = s === "todo" ? "To Do" : s === "in_progress" ? "In Progress" : "Done"
              return (
                <div key={s} style={{ flex: 1, textAlign: "center", background: "#f8fafc", borderRadius: "7px", padding: "8px 4px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>{count}</div>
                  <div style={{ fontSize: "10px", color: "#94a3b8" }}>{label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Section B — Kanban board ──────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b" }}>Task Board</div>
        <button
          onClick={() => setShowForm(f => !f)}
          style={{
            padding: "7px 14px", borderRadius: "7px", border: "none",
            background: showForm ? "#f1f5f9" : "#2563eb", color: showForm ? "#475569" : "#fff",
            fontSize: "12px", fontWeight: 600, cursor: "pointer",
          }}
        >
          {showForm ? "Cancel" : "+ Add Task"}
        </button>
      </div>

      {/* Add Task inline form */}
      {showForm && (
        <form onSubmit={submitTask} style={{ ...card, marginBottom: "16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <input required value={formTitle} onChange={e => setFormTitle(e.target.value)}
            placeholder="Task title *" style={inputStyle} />
          <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
            placeholder="Description" style={inputStyle} />
          <input value={formDept} onChange={e => setFormDept(e.target.value)}
            placeholder="Department (e.g. Editorial)" style={inputStyle} />
          <select value={formPri} onChange={e => setFormPri(e.target.value)} style={inputStyle}>
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
            <option value="urgent">Urgent</option>
          </select>
          <input type="number" min="0.5" step="0.5" value={formH} onChange={e => setFormH(e.target.value)}
            placeholder="Estimated hours" style={inputStyle} />
          <button type="submit" disabled={formSaving || !formTitle.trim()} style={{
            padding: "9px 16px", background: "#2563eb", color: "#fff",
            border: "none", borderRadius: "7px", fontWeight: 600,
            fontSize: "13px", cursor: "pointer", opacity: formSaving ? 0.7 : 1,
          }}>
            {formSaving ? "Saving…" : "Create Task"}
          </button>
        </form>
      )}

      {/* Kanban columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "32px" }}>
        {[
          { key: "todo",        label: "TO DO",       accent: "#64748b", items: todo },
          { key: "in_progress", label: "IN PROGRESS",  accent: "#f97316", items: inProgress },
          { key: "done",        label: "DONE",         accent: "#16a34a", items: done },
        ].map(col => (
          <div key={col.key}>
            {/* Column header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 12px", background: "#f8fafc",
              borderRadius: "8px 8px 0 0", borderBottom: `2px solid ${col.accent}`,
              marginBottom: "8px",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: col.accent, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {col.label}
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8", background: "#e2e8f0", borderRadius: "999px", padding: "1px 6px", fontWeight: 600 }}>
                {col.items.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "80px" }}>
              {col.items.length === 0 && (
                <div style={{ padding: "16px", textAlign: "center", color: "#cbd5e1", fontSize: "12px", border: "1px dashed #e2e8f0", borderRadius: "8px" }}>
                  No tasks
                </div>
              )}
              {col.items.map(task => (
                <div key={task.id} style={{
                  ...card, padding: "12px 14px",
                  borderLeft: `3px solid ${PRIORITY_STYLE[task.priority]?.background ?? "#e2e8f0"}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b", lineHeight: 1.35, flex: 1 }}>
                      {task.title}
                    </div>
                    <span style={PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.medium}>
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "6px", lineHeight: 1.4 }}>
                      {task.description}
                    </div>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                    {task.ownerName && (
                      <span style={{ fontSize: "10px", color: "#475569", background: "#f1f5f9", padding: "2px 7px", borderRadius: "999px" }}>
                        {task.ownerName}
                      </span>
                    )}
                    {task.department && (
                      <span style={{ fontSize: "10px", color: "#7c3aed", background: "#f5f3ff", padding: "2px 7px", borderRadius: "999px" }}>
                        {task.department}
                      </span>
                    )}
                    {task.estimatedH && (
                      <span style={{ fontSize: "10px", color: "#0891b2", background: "#ecfeff", padding: "2px 7px", borderRadius: "999px" }}>
                        ~{task.estimatedH}h
                      </span>
                    )}
                    {task.dueDate && (
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                        due {fmtDate(task.dueDate)}
                      </span>
                    )}
                  </div>

                  {/* Move buttons */}
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {col.key !== "in_progress" && col.key !== "done" && (
                      <button onClick={() => moveTask(task.id, "in_progress")} style={moveBtn("#f97316")}>
                        → In Progress
                      </button>
                    )}
                    {col.key !== "done" && (
                      <button onClick={() => moveTask(task.id, "done")} style={moveBtn("#16a34a")}>
                        ✓ Done
                      </button>
                    )}
                    {col.key !== "todo" && (
                      <button onClick={() => moveTask(task.id, "todo")} style={moveBtn("#64748b")}>
                        ← Back
                      </button>
                    )}
                    {isPriv && (
                      <button onClick={() => deleteTask(task.id)} style={moveBtn("#ef4444")}>
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Section C — CEO/Owner full table ─────────────────────────────── */}
      {isPriv && tasks.length > 0 && (
        <div style={{ ...card }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
              All Tasks — Owner View
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Auto-refreshes every 30s</div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Title", "Owner", "Dept", "Priority", "Status", "Est.", "Actual", "Due", "Updated"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: "11px", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={t.id} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1e293b", maxWidth: "200px" }}>{t.title}</td>
                    <td style={{ padding: "8px 10px", color: "#475569" }}>{t.ownerName ?? "—"}</td>
                    <td style={{ padding: "8px 10px", color: "#7c3aed" }}>{t.department ?? "—"}</td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={PRIORITY_STYLE[t.priority] ?? PRIORITY_STYLE.medium}>{t.priority}</span>
                    </td>
                    <td style={{ padding: "8px 10px" }}>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                        background: t.status === "done" ? "#dcfce7" : t.status === "in_progress" ? "#fff7ed" : "#f1f5f9",
                        color:      t.status === "done" ? "#166534" : t.status === "in_progress" ? "#9a3412" : "#475569",
                      }}>
                        {t.status === "in_progress" ? "In Progress" : t.status === "todo" ? "To Do" : "Done"}
                      </span>
                    </td>
                    <td style={{ padding: "8px 10px", color: "#64748b" }}>{t.estimatedH ? `${t.estimatedH}h` : "—"}</td>
                    <td style={{ padding: "8px 10px", color: t.actualH && t.estimatedH && t.actualH > t.estimatedH ? "#ef4444" : "#16a34a", fontWeight: t.actualH ? 600 : 400 }}>
                      {t.actualH ? `${t.actualH}h` : "—"}
                    </td>
                    <td style={{ padding: "8px 10px", color: "#94a3b8" }}>{t.dueDate ? fmtDate(t.dueDate) : "—"}</td>
                    <td style={{ padding: "8px 10px", color: "#94a3b8" }}>{fmtDate(t.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Micro-style helpers ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: "7px", border: "1px solid #e2e8f0",
  fontSize: "13px", outline: "none", width: "100%", boxSizing: "border-box",
}

function moveBtn(color: string): React.CSSProperties {
  return {
    padding: "3px 8px", border: `1px solid ${color}20`,
    borderRadius: "5px", background: `${color}10`, color,
    fontSize: "10px", fontWeight: 700, cursor: "pointer",
  }
}
