"use client"

import { useRef, useState } from "react"

export type DocumentType = "school_order" | "author_submission" | "delivery_note" | "invoice" | "general"

const DOC_LABELS: Record<DocumentType, string> = {
  school_order:      "School Order",
  author_submission: "Author Submission",
  delivery_note:     "Delivery Note",
  invoice:           "Invoice",
  general:           "General",
}

interface Props {
  defaultType?: DocumentType
  onImport?:   (data: Record<string, unknown>, documentType: DocumentType) => void
}

type ScanResult = Record<string, unknown>

export default function DocumentScanner({ defaultType = "general", onImport }: Props) {
  const [open,      setOpen]      = useState(false)
  const [docType,   setDocType]   = useState<DocumentType>(defaultType)
  const [preview,   setPreview]   = useState<string | null>(null)
  const [mediaType, setMediaType] = useState("image/jpeg")
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState<ScanResult | null>(null)
  const [error,     setError]     = useState("")

  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    setMediaType(file.type || "image/jpeg")
    reader.onload = e => {
      setPreview(e.target?.result as string)
      setResult(null)
      setError("")
    }
    reader.readAsDataURL(file)
  }

  async function scan() {
    if (!preview) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const base64 = preview.split(",")[1] ?? ""
      const res    = await fetch("/api/ocr", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ imageBase64: base64, mediaType, documentType: docType }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Scan failed"); return }
      setResult(json.data as ScanResult)
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setOpen(false)
    setPreview(null)
    setResult(null)
    setError("")
  }

  const confidence      = result?.confidence as string | undefined
  const confColor       = confidence === "high" ? "#16a34a" : confidence === "medium" ? "#d97706" : "#dc2626"
  const confBg          = confidence === "high" ? "#dcfce7" : confidence === "medium" ? "#fff7ed" : "#fee2e2"

  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── Trigger ─────────────────────────────────────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "#fff", border: "1px solid #1a73e8",
            color: "#1a73e8", borderRadius: 8, padding: "8px 16px",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 16 }}>📷</span> Scan Document
        </button>
      )}

      {/* ── Expanded panel ──────────────────────────────────────────────── */}
      {open && (
        <div style={{
          background: "#fff", border: "1px solid #e2e8f0",
          borderRadius: 10, padding: 20,
          display: "flex", flexDirection: "column", gap: 16,
        }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e", display: "flex", alignItems: "center", gap: 8 }}>
              <span>📷</span> Document Scanner
            </div>
            <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 18, lineHeight: 1 }}>
              ✕
            </button>
          </div>

          {/* Document type selector */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Document Type
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(Object.entries(DOC_LABELS) as [DocumentType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setDocType(key)}
                  style={{
                    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                    border: "1px solid", cursor: "pointer",
                    borderColor: docType === key ? "#1a73e8" : "#e2e8f0",
                    background:  docType === key ? "#1a73e8" : "#f8fafc",
                    color:       docType === key ? "#fff"    : "#475569",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Capture / Upload */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => cameraRef.current?.click()}
              style={{
                flex: 1, padding: "10px", border: "2px dashed #1a73e8",
                background: "#eff6ff", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 600, color: "#1a73e8",
              }}
            >
              📸 Take Photo
            </button>
            <button
              onClick={() => uploadRef.current?.click()}
              style={{
                flex: 1, padding: "10px", border: "2px dashed #e2e8f0",
                background: "#f8fafc", borderRadius: 8, cursor: "pointer",
                fontSize: 13, fontWeight: 600, color: "#475569",
              }}
            >
              ⬆ Upload Image
            </button>
          </div>

          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
          <input ref={uploadRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />

          {/* Preview + Scan */}
          {preview && (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Document preview" style={{
                width: 80, height: 80, objectFit: "cover",
                borderRadius: 6, border: "1px solid #e2e8f0", flexShrink: 0,
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>
                  Image ready — click to extract data
                </div>
                <button
                  onClick={scan}
                  disabled={loading}
                  style={{
                    background:   loading ? "#e5e7eb" : "#1a73e8",
                    color:        loading ? "#9ca3af" : "#fff",
                    border:       "none", borderRadius: 6,
                    padding:      "8px 18px", fontSize: 13, fontWeight: 600,
                    cursor:       loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "AI is reading document..." : "✦ Scan & Extract"}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ color: "#dc2626", fontSize: 13, padding: "8px 12px", background: "#fee2e2", borderRadius: 6 }}>
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#1a1a2e" }}>Extracted Data</div>
                {confidence && (
                  <span style={{ background: confBg, color: confColor, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>
                    {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(result)
                  .filter(([k]) => k !== "confidence")
                  .map(([key, value]) => (
                    <div key={key} style={{ display: "flex", gap: 8, fontSize: 13, alignItems: "flex-start" }}>
                      <span style={{ color: "#16a34a", flexShrink: 0, marginTop: 1 }}>✓</span>
                      <span style={{ fontWeight: 600, color: "#475569", minWidth: 130, flexShrink: 0, textTransform: "capitalize" }}>
                        {key.replace(/([A-Z])/g, " $1").trim()}:
                      </span>
                      <span style={{ color: "#1e293b", wordBreak: "break-word" }}>
                        {Array.isArray(value)
                          ? value.map((v, i) =>
                              typeof v === "object" && v !== null
                                ? <div key={i} style={{ fontSize: 12, color: "#64748b" }}>{JSON.stringify(v)}</div>
                                : <div key={i}>{String(v)}</div>
                            )
                          : typeof value === "object" && value !== null
                          ? JSON.stringify(value)
                          : String(value || "—")}
                      </span>
                    </div>
                  ))}
              </div>

              {onImport && (
                <button
                  onClick={() => onImport(result, docType)}
                  style={{
                    marginTop: 14, width: "100%",
                    background: "#f97316", color: "#fff",
                    border: "none", borderRadius: 6,
                    padding: "9px 0", fontSize: 13, fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Apply to Form →
                </button>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
