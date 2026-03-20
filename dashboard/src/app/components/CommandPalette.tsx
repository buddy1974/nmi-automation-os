"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter }                                  from "next/navigation"
import type { CommandResult }                         from "@/app/api/office/command/route"

const QUICK_LINKS = [
  { label: "CEO Office",     url: "/office" },
  { label: "Daily Briefing", url: "/briefing" },
  { label: "AI Agents",      url: "/agents" },
  { label: "Orders",         url: "/orders" },
  { label: "Sales",          url: "/sales" },
  { label: "Invoices",       url: "/invoices" },
  { label: "HR",             url: "/hr" },
  { label: "Finance",        url: "/finance" },
]

export default function CommandPalette() {
  const router       = useRouter()
  const inputRef     = useRef<HTMLInputElement>(null)
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState("")
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<CommandResult | null>(null)
  const [reminder, setReminder] = useState<string | null>(null)

  // Ctrl+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setOpen(o => !o)
        setQuery("")
        setResult(null)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Check reminders on mount
  useEffect(() => {
    fetch("/api/office/reminders")
      .then(r => r.json())
      .then(({ reminders }) => {
        if (reminders?.length) {
          const e = reminders[0]
          const t = e.start?.dateTime
            ? new Date(e.start.dateTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
            : ""
          setReminder(`Meeting in 30 min: ${e.summary}${t ? ` at ${t}` : ""}`)
        }
      })
      .catch(() => {})
  }, [])

  const run = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res  = await fetch("/api/office/command", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ command: query }),
      })
      const data: CommandResult = await res.json()
      setResult(data)
      if (data.url) {
        setTimeout(() => {
          router.push(data.url!)
          setOpen(false)
        }, 800)
      }
    } catch {
      setResult({ action: "unknown", message: "Something went wrong." })
    } finally {
      setLoading(false)
    }
  }, [query, router])

  if (!open) {
    return reminder ? (
      <div
        style={{
          position:   "fixed",
          bottom:     20,
          right:      20,
          background: "#1e40af",
          color:      "#fff",
          padding:    "10px 16px",
          borderRadius: 8,
          fontSize:   13,
          zIndex:     9999,
          cursor:     "pointer",
          maxWidth:   320,
          boxShadow:  "0 4px 12px rgba(0,0,0,.3)",
        }}
        onClick={() => setOpen(true)}
      >
        🔔 {reminder}
      </div>
    ) : null
  }

  return (
    <div
      style={{
        position:   "fixed",
        inset:      0,
        background: "rgba(0,0,0,.6)",
        zIndex:     9998,
        display:    "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
      }}
      onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div style={{
        background:   "#1a1a2e",
        border:       "1px solid #334155",
        borderRadius: 12,
        width:        "min(600px, 92vw)",
        overflow:     "hidden",
        boxShadow:    "0 20px 60px rgba(0,0,0,.7)",
      }}>
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #334155" }}>
          <span style={{ color: "#64748b", marginRight: 10, fontSize: 18 }}>⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setResult(null) }}
            onKeyDown={e => e.key === "Enter" && run()}
            placeholder="What do you need? (e.g. go to orders, draft email to...)"
            style={{
              flex:       1,
              background: "transparent",
              border:     "none",
              outline:    "none",
              color:      "#f1f5f9",
              fontSize:   16,
            }}
          />
          {loading && <span style={{ color: "#64748b", fontSize: 13 }}>thinking…</span>}
        </div>

        {/* Result */}
        {result && (
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ color: result.action === "unknown" ? "#f87171" : "#34d399", fontSize: 14 }}>
              {result.message}
            </div>
            {result.url && (
              <div style={{ color: "#64748b", fontSize: 12, marginTop: 4 }}>
                Navigating to {result.url}…
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        {!result && (
          <div style={{ padding: "8px 0" }}>
            {QUICK_LINKS.map(l => (
              <button
                key={l.url}
                onClick={() => { router.push(l.url); setOpen(false) }}
                style={{
                  display:    "block",
                  width:      "100%",
                  textAlign:  "left",
                  padding:    "8px 20px",
                  background: "none",
                  border:     "none",
                  color:      "#94a3b8",
                  fontSize:   14,
                  cursor:     "pointer",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1e293b")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >
                → {l.label}
              </button>
            ))}
          </div>
        )}

        <div style={{ padding: "8px 16px", borderTop: "1px solid #1e293b", color: "#475569", fontSize: 11, display: "flex", justifyContent: "space-between" }}>
          <span>Enter to run · Esc to close</span>
          <span>Ctrl+K</span>
        </div>
      </div>
    </div>
  )
}
