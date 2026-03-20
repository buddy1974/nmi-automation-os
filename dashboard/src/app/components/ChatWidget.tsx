"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"

type Message  = { role: "user" | "assistant"; content: string }
type UserInfo = { id: string; name: string; role: string; companyId: string | null }

const QUICK_CHIPS = ["Business overview", "Stock alerts", "Unpaid royalties"]

function greeting(name: string): string {
  const h = new Date().getHours()
  const period = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"
  return `Good ${period}, ${name}. I'm your NMI Intelligence assistant. What would you like to know today?`
}

export default function ChatWidget() {
  const [open,    setOpen]    = useState(false)
  const [greeted, setGreeted] = useState(false)
  const [user,    setUser]    = useState<UserInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input,   setInput]   = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Fetch current user on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then((data: UserInfo | null) => { if (data) setUser(data) })
      .catch(() => {})
  }, [])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  // Show greeting when widget first opens
  function handleOpen() {
    setOpen(true)
    if (!greeted && user) {
      setMessages([{ role: "assistant", content: greeting(user.name) }])
      setGreeted(true)
    }
    setTimeout(() => inputRef.current?.focus(), 80)
  }

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: "user", content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res  = await fetch("/api/ai/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: trimmed, history: messages }),
      })
      const data = await res.json()
      const reply = res.ok ? (data.reply ?? "No response.") : (data.error ?? "Something went wrong.")
      setMessages(prev => [...prev, { role: "assistant", content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  const hasMessages = messages.length > 0

  return (
    <>
      <style>{`
        @keyframes wDot  { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
        @keyframes wPop  { from{opacity:0;transform:scale(.92) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes wFade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .w-dot  { animation: wDot 1.2s infinite; display:inline-block; width:7px; height:7px; border-radius:50%; background:#94a3b8; }
        .w-msg  { animation: wFade .18s ease; }
        .w-panel{ animation: wPop .2s ease; }
        .w-chip:hover { background:#1e293b !important; color:#e2e8f0 !important; }
        .w-send:hover:not(:disabled) { background:#1d4ed8 !important; }
        .w-fab:hover  { background:#2563eb !important; transform:scale(1.05); }
      `}</style>

      {/* ── Expanded panel ──────────────────────────────────────────── */}
      {open && (
        <div
          className="w-panel"
          style={{
            position:      "fixed",
            bottom:        96,
            right:         24,
            width:         380,
            height:        520,
            zIndex:        9999,
            display:       "flex",
            flexDirection: "column",
            borderRadius:  "16px",
            overflow:      "hidden",
            boxShadow:     "0 24px 48px rgba(0,0,0,0.22), 0 4px 12px rgba(0,0,0,0.14)",
            fontFamily:    "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Header */}
          <div style={{
            background:     "#0f172a",
            padding:        "14px 16px",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            flexShrink:     0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: 32, height: 32, background: "#2563eb",
                borderRadius: "9px", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "15px", flexShrink: 0,
              }}>✦</div>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "13px", lineHeight: 1.2 }}>
                  NMI Intelligence
                </div>
                {user && (
                  <div style={{
                    marginTop: "2px",
                    display: "inline-block",
                    background: "#1e3a5f",
                    color: "#93c5fd",
                    fontSize: "10px",
                    fontWeight: 600,
                    padding: "1px 7px",
                    borderRadius: "999px",
                    textTransform: "capitalize",
                  }}>
                    {user.role}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "transparent", border: "none",
                color: "#64748b", fontSize: "18px",
                cursor: "pointer", padding: "4px 6px",
                borderRadius: "6px", lineHeight: 1,
              }}
              title="Close"
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{
            flex:          1,
            overflowY:     "auto",
            background:    "#f8fafc",
            padding:       "16px 14px",
            display:       "flex",
            flexDirection: "column",
            gap:           "10px",
          }}>
            {/* Quick chips — show when no user messages yet */}
            {!hasMessages && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "4px" }}>
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip}
                    onClick={() => send(chip)}
                    className="w-chip"
                    style={{
                      padding:      "5px 11px",
                      borderRadius: "999px",
                      background:   "#0f172a",
                      color:        "#94a3b8",
                      border:       "1px solid #1e293b",
                      fontSize:     "11px",
                      fontWeight:   600,
                      cursor:       "pointer",
                      transition:   "all .15s",
                    }}
                  >{chip}</button>
                ))}
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className="w-msg"
                style={{
                  display:        "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth:     "82%",
                  padding:      "9px 13px",
                  borderRadius: m.role === "user"
                    ? "14px 14px 3px 14px"
                    : "14px 14px 14px 3px",
                  background:   m.role === "user" ? "#2563eb" : "#fff",
                  color:        m.role === "user" ? "#fff"    : "#1e293b",
                  fontSize:     "13px",
                  lineHeight:   1.55,
                  boxShadow:    m.role === "assistant" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  border:       m.role === "assistant" ? "1px solid #e2e8f0" : "none",
                  whiteSpace:   "pre-wrap",
                  wordBreak:    "break-word",
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Typing dots */}
            {loading && (
              <div className="w-msg" style={{ display: "flex" }}>
                <div style={{
                  padding: "10px 14px",
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "14px 14px 14px 3px",
                  display: "flex", gap: "4px", alignItems: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-dot" style={{ animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            background:   "#fff",
            borderTop:    "1px solid #e2e8f0",
            padding:      "10px 12px",
            display:      "flex",
            gap:          "8px",
            flexShrink:   0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything…"
              disabled={loading}
              style={{
                flex:         1,
                padding:      "9px 13px",
                borderRadius: "8px",
                border:       "1.5px solid #e2e8f0",
                fontSize:     "13px",
                outline:      "none",
                background:   loading ? "#f8fafc" : "#fff",
                color:        "#1e293b",
                minWidth:     0,
              }}
              onFocus={e => { e.target.style.borderColor = "#2563eb" }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0" }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="w-send"
              style={{
                padding:      "9px 16px",
                background:   input.trim() && !loading ? "#2563eb" : "#e2e8f0",
                color:        input.trim() && !loading ? "#fff"    : "#94a3b8",
                border:       "none",
                borderRadius: "8px",
                fontSize:     "13px",
                fontWeight:   600,
                cursor:       input.trim() && !loading ? "pointer" : "not-allowed",
                transition:   "all .15s",
                flexShrink:   0,
              }}
            >
              {loading ? "…" : "Send"}
            </button>
          </div>
        </div>
      )}

      {/* ── FAB toggle button ──────────────────────────────────────── */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="w-fab"
        title={open ? "Close assistant" : "Open NMI Intelligence"}
        style={{
          position:      "fixed",
          bottom:        24,
          right:         24,
          zIndex:        9999,
          width:         60,
          height:        60,
          borderRadius:  "50%",
          background:    "#1a1a2e",
          border:        "none",
          cursor:        "pointer",
          display:       "flex",
          alignItems:    "center",
          justifyContent:"center",
          fontSize:      "24px",
          color:         "#fff",
          boxShadow:     "0 4px 16px rgba(0,0,0,0.28)",
          transition:    "all .2s",
        }}
      >
        {open ? "✕" : "✦"}
      </button>
    </>
  )
}
