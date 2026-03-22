"use client"

import { useState, useRef, useEffect, type KeyboardEvent } from "react"

type Message = { role: "user" | "assistant"; content: string }

const QUICK_PROMPTS = [
  "Give me a full business overview",
  "What are our current stock alerts?",
  "Show me all unpaid royalties",
  "How are our recent orders and revenue?",
  "Which workers have low performance?",
  "What manuscripts are ready to print?",
  "Show outstanding invoices",
  "List our distributors by region",
  "What unread notifications exist?",
  "Summarize today's key issues",
]

export default function AIPage() {
  const [messages,  setMessages]  = useState<Message[]>([])
  const [input,     setInput]     = useState("")
  const [loading,   setLoading]   = useState(false)
  const [activeIdx, setActiveIdx] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

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
      const reply = res.ok
        ? (data.reply ?? "No response.")
        : (data.error ?? "Something went wrong.")
      setMessages(prev => [...prev, { role: "assistant", content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please check your network and try again." }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  function clearChat() {
    setMessages([])
    setInput("")
    inputRef.current?.focus()
  }

  // Session history (user messages only, for sidebar)
  const userMsgs = messages.filter(m => m.role === "user")

  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes nmiBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes nmiFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .nmi-msg { animation: nmiFadeIn 0.2s ease; }
        .nmi-dot { animation: nmiBounce 1.2s infinite; }
        .nmi-quick:hover { background: #1e293b !important; color: #e2e8f0 !important; }
        .nmi-send:hover:not(:disabled) { background: #1d4ed8 !important; }
        .nmi-clear:hover { background: #1e293b !important; }
      `}</style>

      {/* Full-height flex layout that overrides the parent main padding */}
      <div style={{
        display:   "flex",
        height:    "calc(100vh - 100px)",
        margin:    "-20px",
        overflow:  "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}>

        {/* ── Left panel — quick prompts + session history ─────────────── */}
        <div style={{
          width:          "230px",
          background:     "#0f172a",
          display:        "flex",
          flexDirection:  "column",
          flexShrink:     0,
          overflowY:      "auto",
          borderRight:    "1px solid #1e293b",
        }}>

          {/* Brand */}
          <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: 32, height: 32, background: "#1a73e8",
                borderRadius: "8px", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "16px", flexShrink: 0,
              }}>✦</div>
              <div>
                <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "13px" }}>NMI Intelligence</div>
                <div style={{ color: "#475569", fontSize: "10px" }}>Claude-powered</div>
              </div>
            </div>
          </div>

          {/* Clear button */}
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="nmi-clear"
              style={{
                margin: "10px 12px 0",
                padding: "7px 12px",
                background: "transparent",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                color: "#64748b",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              + New conversation
            </button>
          )}

          {/* Quick prompts */}
          <div style={{ padding: "14px 16px 6px", color: "#334155", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Quick Queries
          </div>
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => { setActiveIdx(i); send(p) }}
              className="nmi-quick"
              style={{
                background:   activeIdx === i ? "#1e293b" : "transparent",
                border:       "none",
                borderBottom: "1px solid #0d1829",
                color:        activeIdx === i ? "#e2e8f0" : "#64748b",
                fontSize:     "12px",
                padding:      "9px 16px",
                textAlign:    "left",
                cursor:       "pointer",
                lineHeight:   1.4,
                transition:   "all 0.15s",
              }}
            >
              {p}
            </button>
          ))}

          {/* Session history */}
          {userMsgs.length > 0 && (
            <>
              <div style={{ padding: "16px 16px 6px", color: "#334155", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginTop: "8px" }}>
                This Session
              </div>
              {userMsgs.map((m, i) => (
                <div key={i} style={{
                  padding:  "6px 16px",
                  color:    "#475569",
                  fontSize: "11px",
                  lineHeight: 1.35,
                  borderBottom: "1px solid #0d1829",
                }}>
                  {m.content.length > 42 ? m.content.slice(0, 42) + "…" : m.content}
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Right panel — chat ───────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8fafc", minWidth: 0 }}>

          {/* Chat header */}
          <div style={{
            padding:      "14px 24px",
            background:   "#fff",
            borderBottom: "1px solid #e2e8f0",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "space-between",
            flexShrink:   0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: 36, height: 36, background: "#0f172a",
                borderRadius: "10px", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "17px",
              }}>✦</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b" }}>NMI Intelligence</div>
                <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Real-time business data · Ask anything
                </div>
              </div>
            </div>
            <div style={{
              fontSize: "11px", color: "#94a3b8",
              background: "#f1f5f9", padding: "4px 10px",
              borderRadius: "999px", border: "1px solid #e2e8f0",
            }}>
              {messages.length > 0 ? `${userMsgs.length} message${userMsgs.length !== 1 ? "s" : ""}` : "Ready"}
            </div>
          </div>

          {/* Messages area */}
          <div style={{
            flex:      1,
            overflowY: "auto",
            padding:   "28px 24px",
            display:   "flex",
            flexDirection: "column",
            gap:       "14px",
          }}>

            {/* Empty state */}
            {messages.length === 0 && (
              <div style={{
                margin:    "auto",
                textAlign: "center",
                color:     "#94a3b8",
                maxWidth:  "400px",
              }}>
                <div style={{ fontSize: "36px", marginBottom: "14px" }}>✦</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#334155", marginBottom: "8px" }}>
                  Ask anything about NMI
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.6 }}>
                  Stock levels, royalties, orders, invoices, workers, manuscripts — real data, instant answers.
                </div>
                <div style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                  {["Stock alerts", "Unpaid royalties", "Revenue summary", "Low performers"].map(tag => (
                    <button key={tag} onClick={() => send(tag)} style={{
                      padding: "6px 12px", borderRadius: "999px",
                      background: "#fff", border: "1px solid #e2e8f0",
                      color: "#475569", fontSize: "12px", cursor: "pointer",
                      fontWeight: 500,
                    }}>{tag}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((m, i) => (
              <div
                key={i}
                className="nmi-msg"
                style={{
                  display:        "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                  alignItems:     "flex-end",
                  gap:            "8px",
                }}
              >
                {/* AI avatar */}
                {m.role === "assistant" && (
                  <div style={{
                    width: 28, height: 28, background: "#0f172a",
                    borderRadius: "8px", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "13px", flexShrink: 0, marginBottom: "2px",
                  }}>✦</div>
                )}

                <div style={{
                  maxWidth:     "68%",
                  padding:      "12px 16px",
                  borderRadius: m.role === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                  background:   m.role === "user" ? "#1a73e8" : "#fff",
                  color:        m.role === "user" ? "#fff"    : "#1e293b",
                  fontSize:     "14px",
                  lineHeight:   1.65,
                  boxShadow:    m.role === "assistant"
                    ? "0 1px 4px rgba(0,0,0,0.07)"
                    : "none",
                  border:       m.role === "assistant" ? "1px solid #e2e8f0" : "none",
                  whiteSpace:   "pre-wrap",
                  wordBreak:    "break-word",
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Thinking indicator */}
            {loading && (
              <div className="nmi-msg" style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div style={{
                  width: 28, height: 28, background: "#0f172a",
                  borderRadius: "8px", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "13px", flexShrink: 0,
                }}>✦</div>
                <div style={{
                  padding:      "14px 18px",
                  background:   "#fff",
                  border:       "1px solid #e2e8f0",
                  borderRadius: "18px 18px 18px 4px",
                  display:      "flex",
                  gap:          "5px",
                  alignItems:   "center",
                  boxShadow:    "0 1px 4px rgba(0,0,0,0.07)",
                }}>
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="nmi-dot"
                      style={{
                        width: 7, height: 7,
                        background:    "#94a3b8",
                        borderRadius:  "50%",
                        display:       "inline-block",
                        animationDelay: `${i * 0.18}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div style={{
            padding:      "14px 24px",
            background:   "#fff",
            borderTop:    "1px solid #e2e8f0",
            display:      "flex",
            gap:          "10px",
            flexShrink:   0,
          }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about stock, orders, royalties, workers, invoices…"
              disabled={loading}
              autoFocus
              style={{
                flex:         1,
                padding:      "12px 16px",
                borderRadius: "10px",
                border:       "1.5px solid #e2e8f0",
                fontSize:     "14px",
                outline:      "none",
                background:   loading ? "#f8fafc" : "#fff",
                color:        "#1e293b",
                transition:   "border-color 0.15s",
              }}
              onFocus={e  => { e.target.style.borderColor = "#1a73e8" }}
              onBlur={e   => { e.target.style.borderColor = "#e2e8f0" }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="nmi-send"
              style={{
                padding:      "12px 22px",
                background:   input.trim() && !loading ? "#1a73e8" : "#e2e8f0",
                color:        input.trim() && !loading ? "#fff"    : "#94a3b8",
                border:       "none",
                borderRadius: "10px",
                fontSize:     "14px",
                fontWeight:   600,
                cursor:       input.trim() && !loading ? "pointer" : "not-allowed",
                transition:   "all 0.15s",
                flexShrink:   0,
              }}
            >
              {loading ? "…" : "Send"}
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
