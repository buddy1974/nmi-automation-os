"use client"

import { useEffect, useState, useCallback } from "react"
import type { CalendarEvent }                from "@/lib/calendar"
import type { GmailSummary }                 from "@/lib/gmail"

interface Props {
  connected: boolean
  userName:  string
}

function formatTime(dt?: string, d?: string): string {
  if (dt) return new Date(dt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  return d ?? ""
}

function formatDate(dt?: string, d?: string): string {
  const src = dt ?? d
  if (!src) return ""
  return new Date(src).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
}

function renderMarkdown(text: string) {
  return text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("## ")) return <h3 key={i} style={{ color: "#60a5fa", margin: "12px 0 4px", fontSize: 14, fontWeight: 700 }}>{line.slice(3)}</h3>
      if (line.startsWith("# "))  return <h2 key={i} style={{ color: "#93c5fd", margin: "14px 0 6px", fontSize: 16, fontWeight: 700 }}>{line.slice(2)}</h2>
      if (line.startsWith("- "))  return <li  key={i} style={{ marginLeft: 16, color: "#cbd5e1", fontSize: 13 }}>{line.slice(2)}</li>
      if (!line.trim())            return <br  key={i} />
      return <p key={i} style={{ color: "#94a3b8", fontSize: 13, margin: "2px 0" }}>{line}</p>
    })
}

const card: React.CSSProperties = {
  background:   "#1e293b",
  border:       "1px solid #334155",
  borderRadius: 10,
  padding:      "20px 24px",
}

export default function OfficeClient({ connected, userName }: Props) {
  const [todayEvents, setTodayEvents] = useState<CalendarEvent[]>([])
  const [weekEvents,  setWeekEvents]  = useState<CalendarEvent[]>([])
  const [emails,      setEmails]      = useState<GmailSummary[]>([])
  const [prepNotes,   setPrepNotes]   = useState<string>("")
  const [prepEvent,   setPrepEvent]   = useState<CalendarEvent | null>(null)
  const [loadingCal,  setLoadingCal]  = useState(false)
  const [loadingMail, setLoadingMail] = useState(false)
  const [loadingPrep, setLoadingPrep] = useState(false)
  const [composeOpen, setComposeOpen] = useState(false)
  const [composeTo,   setComposeTo]   = useState("")
  const [composeSub,  setComposeSub]  = useState("")
  const [composeBody, setComposeBody] = useState("")
  const [sendStatus,  setSendStatus]  = useState("")

  const loadCalendar = useCallback(async () => {
    if (!connected) return
    setLoadingCal(true)
    try {
      const res  = await fetch("/api/calendar/events")
      const data = await res.json()
      setTodayEvents(data.today ?? [])
      setWeekEvents(data.week ?? [])
    } catch { /* silent */ }
    setLoadingCal(false)
  }, [connected])

  const loadEmails = useCallback(async () => {
    if (!connected) return
    setLoadingMail(true)
    try {
      const res  = await fetch("/api/gmail/messages")
      const data = await res.json()
      setEmails(data.messages ?? [])
    } catch { /* silent */ }
    setLoadingMail(false)
  }, [connected])

  useEffect(() => {
    loadCalendar()
    loadEmails()
  }, [loadCalendar, loadEmails])

  async function getPrep(event: CalendarEvent) {
    setPrepEvent(event)
    setPrepNotes("")
    setLoadingPrep(true)
    try {
      const res  = await fetch("/api/calendar/prep", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(event),
      })
      const data = await res.json()
      setPrepNotes(data.notes ?? "No notes generated.")
    } catch { setPrepNotes("Failed to generate prep notes.") }
    setLoadingPrep(false)
  }

  async function sendEmail(draft = false) {
    if (!composeTo || !composeSub || !composeBody) { setSendStatus("All fields required."); return }
    setSendStatus("Sending…")
    try {
      const res  = await fetch("/api/gmail/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ to: composeTo, subject: composeSub, body: composeBody, draft }),
      })
      const data = await res.json()
      if (data.error) { setSendStatus(`Error: ${data.error}`); return }
      setSendStatus(draft ? "Draft saved." : "Email sent!")
      setTimeout(() => { setComposeOpen(false); setSendStatus(""); setComposeTo(""); setComposeSub(""); setComposeBody("") }, 1500)
    } catch { setSendStatus("Failed to send.") }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto", color: "#f1f5f9" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>CEO Digital Office</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
            {greeting}, {userName}.{" "}
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {!connected ? (
            <a href="/api/auth/google" style={{
              background: "#1a73e8", color: "#fff", padding: "8px 16px",
              borderRadius: 8, textDecoration: "none", fontSize: 14, fontWeight: 600,
            }}>
              Connect Google Account
            </a>
          ) : (
            <>
              <button onClick={() => setComposeOpen(true)} style={{
                background: "#1d4ed8", color: "#fff", padding: "8px 16px",
                borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14,
              }}>
                ✉ Compose
              </button>
              <button onClick={() => { loadCalendar(); loadEmails() }} style={{
                background: "#1e293b", color: "#94a3b8", padding: "8px 14px",
                borderRadius: 8, border: "1px solid #334155", cursor: "pointer", fontSize: 14,
              }}>
                ↺ Refresh
              </button>
            </>
          )}
          <a href="/briefing" style={{
            background: "#0f172a", color: "#94a3b8", padding: "8px 14px",
            borderRadius: 8, textDecoration: "none", fontSize: 14, border: "1px solid #334155",
          }}>
            📋 Briefing
          </a>
        </div>
      </div>

      {!connected && (
        <div style={{ ...card, background: "#1e293b", borderColor: "#3b4a6b", marginBottom: 28, textAlign: "center", padding: "40px 24px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>Connect Google to unlock your Digital Office</h2>
          <p style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>
            Calendar events, Gmail inbox, and meeting prep notes will appear here once connected.
          </p>
          <a href="/api/auth/google" style={{
            display: "inline-block", background: "#1a73e8", color: "#fff",
            padding: "10px 24px", borderRadius: 8, textDecoration: "none", fontWeight: 600,
          }}>
            Connect Google Account
          </a>
        </div>
      )}

      {connected && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Today's Calendar */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, color: "#60a5fa" }}>
              📅 Today&apos;s Schedule
              {loadingCal && <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>loading…</span>}
            </h2>
            {todayEvents.length === 0 && !loadingCal && (
              <p style={{ color: "#475569", fontSize: 13 }}>No events today.</p>
            )}
            {todayEvents.map(e => (
              <div key={e.id} style={{
                borderLeft: "3px solid #1a73e8", paddingLeft: 12, marginBottom: 14,
                cursor: "pointer",
              }} onClick={() => getPrep(e)}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{e.summary}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>
                  {formatTime(e.start.dateTime, e.start.date)}
                  {e.attendees?.length ? ` · ${e.attendees.length} attendees` : ""}
                </div>
                {e.location && <div style={{ color: "#475569", fontSize: 11 }}>{e.location}</div>}
                <div style={{ color: "#3b82f6", fontSize: 11, marginTop: 2 }}>Click for prep notes →</div>
              </div>
            ))}
          </div>

          {/* Gmail Inbox */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, color: "#34d399" }}>
              ✉ Inbox
              {loadingMail && <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>loading…</span>}
            </h2>
            {emails.length === 0 && !loadingMail && (
              <p style={{ color: "#475569", fontSize: 13 }}>No emails found.</p>
            )}
            {emails.slice(0, 8).map(m => (
              <div key={m.id} style={{
                padding:       "8px 0",
                borderBottom:  "1px solid #1e293b",
                display:       "flex",
                gap:           8,
                alignItems:    "flex-start",
              }}>
                {m.unread && (
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 6 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: m.unread ? 700 : 400, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.subject || "(no subject)"}
                  </div>
                  <div style={{ color: "#64748b", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.from}
                  </div>
                  <div style={{ color: "#475569", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {m.snippet}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* This Week */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, color: "#f59e0b" }}>📆 This Week</h2>
            {weekEvents.length === 0 && !loadingCal && (
              <p style={{ color: "#475569", fontSize: 13 }}>No upcoming events.</p>
            )}
            {weekEvents.slice(0, 8).map(e => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
                <div style={{ fontSize: 13, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {e.summary}
                </div>
                <div style={{ color: "#64748b", fontSize: 11, flexShrink: 0, marginLeft: 8 }}>
                  {formatDate(e.start.dateTime, e.start.date)}{" "}
                  {e.start.dateTime ? formatTime(e.start.dateTime) : ""}
                </div>
              </div>
            ))}
          </div>

          {/* Meeting Prep */}
          <div style={card}>
            <h2 style={{ margin: "0 0 16px", fontSize: 16, color: "#a78bfa" }}>🧠 Meeting Prep</h2>
            {!prepEvent && (
              <p style={{ color: "#475569", fontSize: 13 }}>Click a calendar event to generate AI prep notes.</p>
            )}
            {prepEvent && (
              <>
                <div style={{ marginBottom: 12, padding: "8px 12px", background: "#0f172a", borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{prepEvent.summary}</div>
                  <div style={{ color: "#64748b", fontSize: 12 }}>{formatTime(prepEvent.start.dateTime, prepEvent.start.date)}</div>
                </div>
                {loadingPrep && <p style={{ color: "#64748b", fontSize: 13 }}>Generating notes…</p>}
                {prepNotes && <div>{renderMarkdown(prepNotes)}</div>}
              </>
            )}
          </div>
        </div>
      )}

      {/* Compose Modal */}
      {composeOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
          zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={e => { if (e.target === e.currentTarget) setComposeOpen(false) }}>
          <div style={{
            background: "#1a1a2e", border: "1px solid #334155",
            borderRadius: 12, width: "min(540px, 94vw)", padding: "24px",
          }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>✉ Compose Email</h3>
            {(["To", "Subject"] as const).map(label => (
              <input
                key={label}
                placeholder={label}
                value={label === "To" ? composeTo : composeSub}
                onChange={e => label === "To" ? setComposeTo(e.target.value) : setComposeSub(e.target.value)}
                style={{
                  width: "100%", display: "block", marginBottom: 10,
                  background: "#0f172a", border: "1px solid #334155",
                  borderRadius: 6, padding: "8px 12px", color: "#f1f5f9",
                  fontSize: 14, boxSizing: "border-box",
                }}
              />
            ))}
            <textarea
              placeholder="Body"
              value={composeBody}
              onChange={e => setComposeBody(e.target.value)}
              rows={6}
              style={{
                width: "100%", display: "block", marginBottom: 12,
                background: "#0f172a", border: "1px solid #334155",
                borderRadius: 6, padding: "8px 12px", color: "#f1f5f9",
                fontSize: 14, boxSizing: "border-box", resize: "vertical",
              }}
            />
            {sendStatus && <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>{sendStatus}</div>}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setComposeOpen(false)} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => sendEmail(true)} style={{ background: "#1e293b", color: "#60a5fa", border: "1px solid #3b82f6", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>
                Save Draft
              </button>
              <button onClick={() => sendEmail(false)} style={{ background: "#1a73e8", color: "#fff", border: "none", padding: "8px 20px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
