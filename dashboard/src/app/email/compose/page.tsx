"use client"

import { useState } from "react"
import Link         from "next/link"

interface Classification {
  category:   string
  priority:   string
  department: string
  summary:    string
  routedTo:   string
}

interface Result {
  log:            { id: string }
  classification: Classification
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "#dc2626",
  high:   "#ea580c",
  normal: "#2563eb",
  low:    "#6b7280",
}

const CATEGORY_COLORS: Record<string, string> = {
  sales:      "#16a34a",
  hr:         "#9333ea",
  editorial:  "#2563eb",
  accounting: "#d97706",
  support:    "#0284c7",
  ceo:        "#1a1a2e",
  spam:       "#dc2626",
  general:    "#6b7280",
}

export default function ComposeTestPage() {
  const [from, setFrom]       = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody]       = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [result, setResult]   = useState<Result | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!from || !subject) { setError("From and Subject are required."); return }
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/email/classify", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ from, subject, body }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Classification failed"); return }
      setResult(json)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: "0 auto" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>Email Classifier — Test</h1>
          <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
            Paste or type any email to see how the AI routes it.
          </p>
        </div>
        <Link href="/email" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Back to inbox</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 1fr" : "1fr", gap: 24 }}>

        {/* Form */}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

            <div>
              <label style={labelStyle}>FROM</label>
              <input
                value={from}
                onChange={e => setFrom(e.target.value)}
                placeholder="sender@example.com"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>SUBJECT</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject…"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label style={labelStyle}>BODY (optional)</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Paste the email body here for more accurate classification…"
                rows={8}
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            {error && <div style={{ color: "#dc2626", fontSize: 13 }}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8,
                padding: "12px 24px", fontSize: 14, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Classifying…" : "Classify with AI"}
            </button>
          </div>

          {/* Quick test examples */}
          <div style={{ fontSize: 12, color: "#9ca3af" }}>
            Quick tests:
            {[
              { from: "school@lyceedouala.cm",   subject: "Commande de 200 livres de mathématiques" },
              { from: "jean.paul@gmail.com",     subject: "Je veux postuler pour le poste d'éditeur" },
              { from: "imprimerie@print.cm",     subject: "Facture en souffrance — 450 000 XAF" },
              { from: "auteur.nkolo@gmail.com",  subject: "Manuscrit pour révision — Sciences CM2" },
            ].map((ex, i) => (
              <span
                key={i}
                onClick={() => { setFrom(ex.from); setSubject(ex.subject); setBody("") }}
                style={{ display: "block", cursor: "pointer", color: "#2563eb", marginTop: 4, textDecoration: "underline" }}
              >
                "{ex.subject}"
              </span>
            ))}
          </div>
        </form>

        {/* Result card */}
        {result && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111" }}>Classification Result</div>

            <ResultRow label="Category" value={result.classification.category}
              badge style={{ background: "#f3f4f6", color: CATEGORY_COLORS[result.classification.category] ?? "#374151" }} />
            <ResultRow label="Priority" value={result.classification.priority}
              badge style={{ background: "#f3f4f6", color: PRIORITY_COLORS[result.classification.priority] ?? "#374151" }} />
            <ResultRow label="Department" value={result.classification.department} />
            <ResultRow label="Routed To"  value={result.classification.routedTo} />

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", marginBottom: 6 }}>AI SUMMARY</div>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, background: "#f9fafb", padding: "10px 14px", borderRadius: 8 }}>
                {result.classification.summary}
              </div>
            </div>

            <div style={{ fontSize: 12, color: "#9ca3af", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
              Saved to email log — ID: <code style={{ fontSize: 11 }}>{result.log.id}</code>
            </div>

            <Link href="/email" style={{ fontSize: 13, color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              View in Email Inbox →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: "#9ca3af", display: "block", marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", border: "1px solid #d1d5db",
  borderRadius: 6, fontSize: 14, boxSizing: "border-box",
}

function ResultRow({ label, value, badge, style }: { label: string; value: string; badge?: boolean; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#6b7280" }}>{label}</span>
      {badge ? (
        <span style={{ padding: "3px 12px", borderRadius: 12, fontSize: 13, fontWeight: 700, textTransform: "capitalize", ...style }}>{value}</span>
      ) : (
        <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{value}</span>
      )}
    </div>
  )
}
