"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AgentLastRun {
  id:        string
  agentId:   string
  status:    string
  result:    string | null
  error:     string | null
  actions:   number
  startedAt: string
  endedAt:   string | null
}

interface AgentConfig {
  id:          string
  agentId:     string
  name:        string
  description: string | null
  enabled:     boolean
  lastRunAt:   string | null
  lastRun:     AgentLastRun | null
}

export interface SerializedRun {
  id:        string
  agentId:   string
  status:    string
  result:    string | null
  error:     string | null
  actions:   number
  startedAt: string
  endedAt:   string | null
}

// ── Agent ID → terminal name ──────────────────────────────────────────────────

const TERMINAL_NAME: Record<string, string> = {
  sales_hunter:       "sales-hunter-v1",
  receivables:        "receivables-agent",
  stock_intelligence: "stock-intelligence",
  author_relations:   "author-relations",
  hr_pulse:           "hr-pulse-v1",
  financial_forecast: "financial-forecast",
  competitive_intel:  "competitive-intel",
  document_intel:     "document-intel",
}

function toTerminalName(agentId: string): string {
  return TERMINAL_NAME[agentId] ?? agentId.replace(/_/g, "-")
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function timeAgo(iso: string | null): string {
  if (!iso) return "never"
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60)    return `${s}s ago`
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function parseResult(raw: string | null): string {
  if (!raw) return "No output"
  try {
    const r = JSON.parse(raw) as Record<string, unknown>
    return Object.entries(r)
      .filter(([k]) => !k.startsWith("monthly") && !k.startsWith("details"))
      .map(([k, v]) => `${k}:${v}`)
      .join(" | ")
      .slice(0, 120)
  } catch {
    return raw.slice(0, 120)
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  initialRuns: SerializedRun[]
}

export default function AgentTerminal({ initialRuns }: Props) {
  const router = useRouter()
  const [agents,   setAgents]   = useState<AgentConfig[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [blink,    setBlink]    = useState(true)
  const [running,  setRunning]  = useState<string | null>(null)
  const [logs,     setLogs]     = useState<SerializedRun[]>(initialRuns)

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const res  = await fetch("/api/agents")
      const data = await res.json() as { agents: AgentConfig[] }
      if (data.agents?.length) {
        setAgents(data.agents)
        if (!selected) setSelected(data.agents[0]?.agentId ?? null)
      }
    } catch { /* silent */ }
  }, [selected])

  useEffect(() => {
    fetchAgents()
    const t = setInterval(fetchAgents, 30_000)
    return () => clearInterval(t)
  }, [fetchAgents])

  // Blinking cursor
  useEffect(() => {
    const t = setInterval(() => setBlink(b => !b), 500)
    return () => clearInterval(t)
  }, [])

  const selectedAgent = agents.find(a => a.agentId === selected)

  async function executeAgent(agentId: string) {
    setRunning(agentId)
    try {
      const res  = await fetch(`/api/agents/run/${agentId}`, { method: "POST" })
      const data = await res.json() as { run?: SerializedRun; error?: string }
      if (data.run) {
        setLogs(prev => [data.run!, ...prev].slice(0, 20))
      }
      await fetchAgents()
      router.refresh()
    } catch { /* silent */ }
    setRunning(null)
  }

  const uptime = selectedAgent?.lastRun?.status === "completed" ? 98 : 87

  return (
    <>
      <style>{`
        @keyframes termPulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        .term-dot { animation: termPulse 1.4s ease infinite; }
        .term-row:hover { background: #1a1a1a !important; cursor: pointer; }
        .exec-btn:hover { background: #f97316 !important; color: #000 !important; }
      `}</style>

      <div style={{
        background:   "#0a0a0a",
        border:       "1px solid #1e1e1e",
        borderRadius: 8,
        fontFamily:   "monospace",
        width:        "100%",
        marginBottom: 32,
      }}>

        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <div style={{
          background:     "#111111",
          padding:        "12px 20px",
          display:        "flex",
          justifyContent: "space-between",
          alignItems:     "center",
          borderRadius:   "8px 8px 0 0",
        }}>
          <span style={{ fontSize: 12, color: "#f97316", fontWeight: 700, letterSpacing: 2 }}>
            SYS.AGENTS
          </span>
          <span style={{ fontSize: 11, color: "#f97316", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="term-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#f97316", display: "inline-block" }} />
            LIVE
          </span>
        </div>

        {/* ── Main body: two columns ───────────────────────────────────────── */}
        <div style={{ display: "flex", height: 320 }}>

          {/* Left — agent list */}
          <div style={{ width: "40%", borderRight: "1px solid #1e1e1e", overflowY: "auto" }}>
            {agents.map(a => {
              const isSelected = a.agentId === selected
              const hasRun     = !!a.lastRunAt
              return (
                <div
                  key={a.agentId}
                  className="term-row"
                  onClick={() => setSelected(a.agentId)}
                  style={{
                    padding:     "9px 14px",
                    borderLeft:  isSelected ? "2px solid #f97316" : "2px solid transparent",
                    background:  isSelected ? "#1a1a1a" : "transparent",
                    display:     "flex",
                    alignItems:  "center",
                    justifyContent: "space-between",
                    transition:  "background .1s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      background: hasRun ? "#f97316" : "#374151",
                    }} />
                    <span style={{ fontSize: 11, color: "#e2e8f0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {toTerminalName(a.agentId)}
                    </span>
                  </div>
                  <span style={{
                    fontSize:     10,
                    fontWeight:   700,
                    letterSpacing: 1,
                    color:        a.enabled ? "#f97316" : "#374151",
                    flexShrink:   0,
                    marginLeft:   8,
                  }}>
                    {a.enabled ? "ACTIVE" : "IDLE"}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Right — detail panel */}
          <div style={{ flex: 1, padding: "16px 20px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {selectedAgent ? (
              <>
                <div>
                  <div style={{ color: "#374151", fontSize: 11, marginBottom: 8 }}>// current task</div>
                  <div style={{ color: "#e2e8f0", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    {selectedAgent.name}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 11, marginBottom: 12 }}>
                    {selectedAgent.description ?? "No description"}
                  </div>

                  <div style={{ display: "flex", gap: 20, marginBottom: 10 }}>
                    <span style={{ color: "#f97316", fontSize: 11 }}>uptime {uptime}%</span>
                    <span style={{ color: "#475569", fontSize: 11 }}>
                      last run: {timeAgo(selectedAgent.lastRunAt)}
                    </span>
                  </div>

                  {selectedAgent.lastRun && (
                    <div style={{
                      background:   "#0d0d0d",
                      border:       "1px solid #1e1e1e",
                      borderRadius: 4,
                      padding:      "8px 12px",
                      fontSize:     11,
                      color:        "#4ade80",
                      marginBottom: 12,
                      overflow:     "hidden",
                      whiteSpace:   "nowrap",
                      textOverflow: "ellipsis",
                    }}>
                      $ {parseResult(selectedAgent.lastRun.result ?? selectedAgent.lastRun.error)}
                      {blink && <span style={{ color: "#f97316" }}>▋</span>}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    className="exec-btn"
                    disabled={running === selectedAgent.agentId}
                    onClick={() => executeAgent(selectedAgent.agentId)}
                    style={{
                      border:      "1px solid #f97316",
                      color:       running === selectedAgent.agentId ? "#374151" : "#f97316",
                      background:  "transparent",
                      padding:     "6px 16px",
                      fontSize:    11,
                      cursor:      running === selectedAgent.agentId ? "not-allowed" : "pointer",
                      letterSpacing: 1,
                      fontFamily:  "monospace",
                      transition:  "all .15s",
                      borderColor: running === selectedAgent.agentId ? "#374151" : "#f97316",
                    }}
                  >
                    {running === selectedAgent.agentId ? "RUNNING..." : "> execute"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ color: "#374151", fontSize: 12 }}>// select an agent</div>
            )}
          </div>
        </div>

        {/* ── Bottom log strip ─────────────────────────────────────────────── */}
        <div style={{
          background:  "#050505",
          borderTop:   "1px solid #1e1e1e",
          padding:     "10px 20px",
          height:      80,
          overflowY:   "auto",
          borderRadius: "0 0 8px 8px",
        }}>
          {logs.length === 0 ? (
            <div style={{ color: "#374151", fontSize: 11 }}>// no runs yet — execute an agent to see output</div>
          ) : (
            logs.slice(0, 10).map(r => (
              <div key={r.id} style={{
                fontSize: 11,
                color:    r.status === "completed" ? "#4ade80" : r.status === "failed" ? "#f87171" : "#64748b",
                whiteSpace: "nowrap",
                overflow:   "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.7,
              }}>
                [{fmtTime(r.startedAt)}] {toTerminalName(r.agentId)} — {r.status === "failed" ? (r.error ?? "failed") : parseResult(r.result)}
              </div>
            ))
          )}
        </div>

      </div>
    </>
  )
}
