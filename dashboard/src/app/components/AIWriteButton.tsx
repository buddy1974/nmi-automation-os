"use client"

import { useState } from "react"

export type WriteField =
  | "performance_evaluation"
  | "manuscript_review"
  | "order_description"
  | "hr_alert"
  | "author_letter"
  | "school_outreach"
  | "general"

interface Props {
  /** Current textarea value — keywords the user typed */
  value:    string
  /** Which writing context to use for the AI prompt */
  field:    WriteField
  /** Detected or forced language. "auto" = detect from input. */
  language?: "fr" | "en" | "auto"
  /** Called with the generated text. Replace or append is up to the caller. */
  onWrite:  (text: string) => void
}

export default function AIWriteButton({ value, field, language = "auto", onWrite }: Props) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState("")

  async function write() {
    if (!value.trim()) { setError("Type some keywords first"); return }
    setLoading(true)
    setError("")

    try {
      const res  = await fetch("/api/ai/write", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ input: value, field, language }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Write failed"); return }
      onWrite(json.text as string)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
      <button
        type="button"
        onClick={write}
        disabled={loading}
        title="Type keywords, then click to generate professional text with AI"
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        5,
          background: loading ? "#e5e7eb" : "#1a73e8",
          color:      loading ? "#9ca3af" : "#fff",
          border:     "none",
          borderRadius: 6,
          padding:    "6px 13px",
          fontSize:   12,
          fontWeight: 700,
          cursor:     loading ? "not-allowed" : "pointer",
          whiteSpace: "nowrap",
          letterSpacing: "0.2px",
        }}
      >
        <span style={{ fontSize: 13 }}>✦</span>
        {loading ? "Writing..." : "AI Write"}
      </button>
      {error && (
        <span style={{ fontSize: 11, color: "#dc2626" }}>{error}</span>
      )}
    </div>
  )
}
