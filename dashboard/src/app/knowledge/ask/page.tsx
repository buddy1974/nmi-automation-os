"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface Source { id: string; title: string; category: string }

interface Answer {
  question: string
  answer:   string
  sources:  Source[]
}

const QUICK_QUESTIONS = [
  "What is the annual leave policy?",
  "How are royalties calculated?",
  "What is the editorial process?",
  "What discounts do schools get?",
  "What are the printing standards?",
  "What does the author contract include?",
]

const CAT_COLORS: Record<string, string> = {
  HR:           "#9333ea",
  Finance:      "#d97706",
  Editorial:    "#1a73e8",
  Sales:        "#16a34a",
  Distribution: "#0284c7",
  Printing:     "#ea580c",
  Legal:        "#dc2626",
}

export default function AskKBPage() {
  const searchParams = useSearchParams()
  const [question, setQuestion] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [history,  setHistory]  = useState<Answer[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)

  // Pre-fill from ?q= param (coming from knowledge table "Ask →" link)
  useEffect(() => {
    const q = searchParams.get("q")
    if (q) setQuestion(q)
  }, [searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [history, loading])

  async function ask(q?: string) {
    const text = (q ?? question).trim()
    if (!text || loading) return

    setLoading(true)
    setError("")
    if (!q) setQuestion("")

    try {
      const res  = await fetch("/api/knowledge/ask", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question: text }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed"); return }
      setHistory(prev => [...prev, { question: text, answer: data.answer, sources: data.sources ?? [] }])
    } catch {
      setError("Network error — please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask() }
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", margin: 0 }}>Ask the Knowledge Base</h1>
          <p style={{ color: "#6b7280", marginTop: 4, fontSize: 13 }}>
            AI answers from company policies, SOPs, and guidelines
          </p>
        </div>
        <Link href="/knowledge" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Documents</Link>
      </div>

      {/* Quick chips */}
      {history.length === 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 10 }}>SUGGESTED QUESTIONS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => ask(q)}
                style={{
                  padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                  background: "#f3f4f6", color: "#374151", border: "none", cursor: "pointer",
                  transition: "all .15s",
                }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = "#e5e7eb" }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "#f3f4f6" }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Q&A history */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 24 }}>
        {history.map((item, i) => (
          <div key={i}>
            {/* Question */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
              <div style={{
                background: "#1a1a2e", color: "#fff", padding: "10px 16px",
                borderRadius: "16px 16px 4px 16px", fontSize: 14, fontWeight: 500,
                maxWidth: "80%", lineHeight: 1.5,
              }}>
                {item.question}
              </div>
            </div>

            {/* Answer */}
            <div style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px 16px 16px 16px",
              padding: "14px 18px", fontSize: 14, lineHeight: 1.7, color: "#1e293b",
              whiteSpace: "pre-wrap",
            }}>
              {item.answer}

              {/* Sources */}
              {item.sources.length > 0 && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6 }}>SOURCES USED</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {item.sources.map(s => (
                      <span key={s.id} style={{
                        background: "#f9fafb", border: "1px solid #e5e7eb",
                        padding: "3px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                        color: CAT_COLORS[s.category] ?? "#374151",
                      }}>
                        {s.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{
              background: "#fff", border: "1px solid #e5e7eb", borderRadius: "4px 16px 16px 16px",
              padding: "14px 18px", display: "flex", gap: 5, alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 7, height: 7, borderRadius: "50%", background: "#94a3b8", display: "inline-block",
                  animation: "kbDot 1.2s infinite", animationDelay: `${i * 0.18}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {error && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {/* Input */}
      <div style={{
        position: "sticky", bottom: 24,
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "10px 12px", display: "flex", gap: 8,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about company policies, procedures, or guidelines…"
          disabled={loading}
          style={{
            flex: 1, padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
            fontSize: 14, outline: "none", background: loading ? "#f8fafc" : "#fff", color: "#1e293b",
          }}
          onFocus={e  => { e.target.style.borderColor = "#1a73e8" }}
          onBlur={e   => { e.target.style.borderColor = "#e2e8f0" }}
          autoFocus
        />
        <button
          onClick={() => ask()}
          disabled={loading || !question.trim()}
          style={{
            padding: "10px 20px", background: question.trim() && !loading ? "#1a73e8" : "#e5e7eb",
            color: question.trim() && !loading ? "#fff" : "#9ca3af",
            border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700,
            cursor: question.trim() && !loading ? "pointer" : "not-allowed",
            flexShrink: 0, transition: "all .15s",
          }}
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>

      <style>{`@keyframes kbDot { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }`}</style>
    </div>
  )
}
