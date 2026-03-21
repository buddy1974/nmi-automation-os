"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  headers:   string[]
  preview:   Record<string, string>[]
  totalRows: number
  analysis: {
    mapping:          Record<string, string>
    missingRequired:  string[]
    issues:           string[]
    successEstimate:  number
    summary:          string
  }
}

interface ImportResult {
  total:    number
  imported: number
  skipped:  number
  errors:   string[]
}

interface ImportLog {
  id:        string
  module:    string
  source:    string
  totalRows: number
  imported:  number
  skipped:   number
  importedBy: string | null
  createdAt: string
}

// ── Module config ─────────────────────────────────────────────────────────────

const MODULES = [
  { id: "workers",      label: "Workers",      icon: "👷", fields: "name, role, department, contract, salary, phone, email" },
  { id: "products",     label: "Products",     icon: "📚", fields: "code, title, subject, level, class, price, stock, ISBN" },
  { id: "customers",    label: "Customers",    icon: "🏪", fields: "name, email, phone, address, region, type" },
  { id: "authors",      label: "Authors",      icon: "✍️",  fields: "name, email, phone, nationality, bio" },
  { id: "royalties",    label: "Royalties",    icon: "💰", fields: "authorName, bookTitle, amount, period, paid" },
  { id: "orders",       label: "Orders",       icon: "📦", fields: "customerName, productCode, quantity, date, status" },
  { id: "distributors", label: "Distributors", icon: "🚚", fields: "name, region, city, phone, email, address" },
]

const MODULE_PAGES: Record<string, string> = {
  workers:      "/hr/workers",
  products:     "/stock",
  customers:    "/customers",
  authors:      "/authors",
  royalties:    "/royalties",
  orders:       "/orders",
  distributors: "/distributors",
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  card: {
    background:   "#1e293b",
    border:       "1px solid #334155",
    borderRadius: 10,
    padding:      "20px 24px",
  } as React.CSSProperties,
  btn: (variant: "primary" | "secondary" | "danger") => ({
    padding:      "9px 20px",
    borderRadius: 8,
    border:       "none",
    cursor:       "pointer",
    fontSize:     14,
    fontWeight:   600,
    background:   variant === "primary" ? "#2563eb" : variant === "danger" ? "#dc2626" : "#334155",
    color:        "#fff",
  } as React.CSSProperties),
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportPage() {
  const searchParams = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step,        setStep]        = useState<1 | 2 | 3 | 4>(1)
  const [module,      setModule]      = useState("")
  const [source,      setSource]      = useState<"file" | "sheet" | "drive" | "">("")
  const [file,        setFile]        = useState<File | null>(null)
  const [sheetUrl,    setSheetUrl]    = useState("")

  // Auto-select module from ?module= query param
  useEffect(() => {
    const m = searchParams.get("module")
    if (m && MODULES.find(mod => mod.id === m)) {
      setModule(m)
      setStep(2)
    }
  }, [searchParams])
  const [dragging,    setDragging]    = useState(false)
  const [analysing,   setAnalysing]   = useState(false)
  const [analysis,    setAnalysis]    = useState<AnalysisResult | null>(null)
  const [mapping,     setMapping]     = useState<Record<string, string>>({})
  const [importing,   setImporting]   = useState(false)
  const [result,      setResult]      = useState<ImportResult | null>(null)
  const [history,     setHistory]     = useState<ImportLog[]>([])
  const [historyLoad, setHistoryLoad] = useState(false)

  // Load history
  const loadHistory = useCallback(async () => {
    setHistoryLoad(true)
    try {
      const res  = await fetch("/api/import/history")
      const data = await res.json() as ImportLog[]
      setHistory(data)
    } catch { /* silent */ }
    setHistoryLoad(false)
  }, [])

  const handleFile = (f: File) => {
    setFile(f)
    setAnalysis(null)
    setResult(null)
  }

  // ── Analyse ──────────────────────────────────────────────────────────────

  async function analyse() {
    setAnalysing(true)
    setAnalysis(null)

    try {
      let res: Response

      if (source === "sheet" || source === "drive") {
        res = await fetch("/api/import/google-sheet", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ sheetUrl, module }),
        })
      } else {
        if (!file) return
        const fd = new FormData()
        fd.append("file",   file)
        fd.append("module", module)
        res = await fetch("/api/import/analyse", { method: "POST", body: fd })
      }

      const data = await res.json() as AnalysisResult
      setAnalysis(data)
      setMapping(data.analysis?.mapping ?? {})
      setStep(4)
    } catch { /* silent */ }
    setAnalysing(false)
  }

  // ── Execute import ────────────────────────────────────────────────────────

  async function executeImport() {
    if (!file && source !== "sheet") return
    setImporting(true)

    try {
      const fd = new FormData()
      if (file) fd.append("file", file)
      fd.append("module",  module)
      fd.append("mapping", JSON.stringify(mapping))

      const res  = await fetch("/api/import/execute", { method: "POST", body: fd })
      const data = await res.json() as ImportResult
      setResult(data)
      await loadHistory()
    } catch { /* silent */ }
    setImporting(false)
  }

  const reset = () => {
    setStep(1); setModule(""); setSource(""); setFile(null)
    setSheetUrl(""); setAnalysis(null); setMapping({}); setResult(null)
  }

  const estimateColor = (n: number) => n >= 80 ? "#22c55e" : n >= 50 ? "#f59e0b" : "#ef4444"

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1000, margin: "0 auto", color: "#f1f5f9" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Data Import Center</h1>
        <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: 14 }}>
          Migrate data from any source into NMI — Excel, CSV, or Google Sheets
        </p>
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
        {(["1 Module", "2 Source", "3 Upload & Analyse", "4 Review & Import"] as const).map((label, i) => (
          <div key={i} style={{
            flex:         1,
            height:       4,
            borderRadius: 2,
            background:   step > i ? "#2563eb" : step === i + 1 ? "#60a5fa" : "#1e293b",
          }} />
        ))}
      </div>

      {/* STEP 1 — Module */}
      {step === 1 && (
        <div style={S.card}>
          <h2 style={{ margin: "0 0 16px", fontSize: 16 }}>Step 1 — What are you importing?</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {MODULES.map(m => (
              <button
                key={m.id}
                onClick={() => { setModule(m.id); setStep(2) }}
                style={{
                  background:   module === m.id ? "#1d4ed8" : "#0f172a",
                  border:       `1px solid ${module === m.id ? "#2563eb" : "#334155"}`,
                  borderRadius: 8,
                  padding:      "14px 16px",
                  cursor:       "pointer",
                  textAlign:    "left",
                  color:        "#f1f5f9",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{m.label}</div>
                <div style={{ color: "#64748b", fontSize: 11 }}>{m.fields}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2 — Source */}
      {step === 2 && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Step 2 — Choose source</h2>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>← Back</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            {[
              { id: "file",  icon: "📁", label: "Upload File",        sub: "Excel (.xlsx) or CSV" },
              { id: "sheet", icon: "📊", label: "Google Sheet URL",   sub: "Must be publicly accessible" },
              { id: "drive", icon: "💾", label: "Google Drive",       sub: "CSV or Sheet from Drive URL" },
              { id: "tpl",   icon: "📋", label: "Download Template",  sub: `Get the ${module} template CSV` },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => {
                  if (opt.id === "tpl") {
                    window.location.href = `/api/import/template/${module}`
                  } else {
                    setSource(opt.id as "file" | "sheet" | "drive")
                    setStep(3)
                  }
                }}
                style={{
                  background:   "#0f172a",
                  border:       "1px solid #334155",
                  borderRadius: 8,
                  padding:      "20px",
                  cursor:       "pointer",
                  textAlign:    "center",
                  color:        "#f1f5f9",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{opt.label}</div>
                <div style={{ color: "#64748b", fontSize: 12 }}>{opt.sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3 — Upload */}
      {step === 3 && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Step 3 — {source === "sheet" ? "Enter Google Sheet URL" : source === "drive" ? "Enter Google Drive URL" : "Upload your file"}</h2>
            <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>← Back</button>
          </div>

          {(source === "sheet" || source === "drive") ? (
            <div>
              <input
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                placeholder={source === "drive" ? "https://drive.google.com/file/d/... or Sheets URL" : "https://docs.google.com/spreadsheets/d/..."}
                style={{
                  width: "100%", background: "#0f172a", border: "1px solid #334155",
                  borderRadius: 8, padding: "10px 14px", color: "#f1f5f9", fontSize: 14,
                  boxSizing: "border-box", marginBottom: 16,
                }}
              />
              <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 16px" }}>
                {source === "drive"
                  ? "Paste a Google Drive CSV link or Google Sheets URL. The file must be publicly accessible."
                  : "The sheet must be publicly accessible (Share → Anyone with link → Viewer)."}
              </p>
            </div>
          ) : (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              onClick={() => fileRef.current?.click()}
              style={{
                border:       `2px dashed ${dragging ? "#2563eb" : "#334155"}`,
                borderRadius: 10,
                padding:      "40px",
                textAlign:    "center",
                cursor:       "pointer",
                marginBottom: 16,
                background:   dragging ? "#1d4ed820" : "transparent",
                transition:   "all .15s",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
              {file ? (
                <div style={{ color: "#22c55e", fontWeight: 600 }}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</div>
              ) : (
                <>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Drag & drop your file here</div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>or click to browse — Excel (.xlsx) or CSV</div>
                </>
              )}
              <input ref={fileRef} type="file" accept=".xlsx,.csv,.xls" hidden onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          )}

          <button
            onClick={analyse}
            disabled={analysing || (source === "file" && !file) || ((source === "sheet" || source === "drive") && !sheetUrl)}
            style={{ ...S.btn("primary"), opacity: (analysing || (source === "file" && !file) || ((source === "sheet" || source === "drive") && !sheetUrl)) ? 0.5 : 1 }}
          >
            {analysing ? "AI is reading your file…" : "Analyse with AI"}
          </button>
        </div>
      )}

      {/* STEP 4 — Review & Import */}
      {step === 4 && analysis && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16 }}>Step 4 — Review & Import</h2>
            <button onClick={() => setStep(3)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>← Back</button>
          </div>

          {/* Analysis summary */}
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>AI Analysis</div>
                <div style={{ color: "#94a3b8", fontSize: 13 }}>{analysis.analysis.summary}</div>
              </div>
              <div style={{
                background:   estimateColor(analysis.analysis.successEstimate) + "22",
                color:        estimateColor(analysis.analysis.successEstimate),
                border:       `1px solid ${estimateColor(analysis.analysis.successEstimate)}55`,
                borderRadius: 20,
                padding:      "4px 14px",
                fontWeight:   700,
                fontSize:     14,
                flexShrink:   0,
              }}>
                {analysis.analysis.successEstimate}% success estimate
              </div>
            </div>

            {analysis.analysis.missingRequired?.length > 0 && (
              <div style={{ background: "#450a0a", border: "1px solid #991b1b", borderRadius: 6, padding: "8px 12px", marginBottom: 8 }}>
                <strong style={{ color: "#f87171", fontSize: 13 }}>Missing required fields:</strong>{" "}
                <span style={{ color: "#fca5a5", fontSize: 13 }}>{analysis.analysis.missingRequired.join(", ")}</span>
              </div>
            )}

            {analysis.analysis.issues?.map((issue, i) => (
              <div key={i} style={{ background: "#431407", border: "1px solid #9a3412", borderRadius: 6, padding: "6px 12px", marginBottom: 4 }}>
                <span style={{ color: "#fdba74", fontSize: 13 }}>⚠ {issue}</span>
              </div>
            ))}
          </div>

          {/* Column mapping */}
          <div style={{ ...S.card, marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Column Mapping</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(mapping).map(([src, dest]) => (
                <div key={src} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "#64748b", fontSize: 12, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {src}
                  </span>
                  <span style={{ color: "#475569", fontSize: 12 }}>→</span>
                  <select
                    value={dest}
                    onChange={e => setMapping(m => ({ ...m, [src]: e.target.value }))}
                    style={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 4, color: "#f1f5f9", fontSize: 12, padding: "2px 6px", flex: 1 }}
                  >
                    <option value="__skip__">— skip —</option>
                    {MODULES.find(m => m.id === module)?.fields.split(", ").map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview table */}
          {analysis.preview.length > 0 && (
            <div style={{ ...S.card, marginBottom: 16, overflowX: "auto" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14 }}>Data Preview (first 5 rows)</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {analysis.headers.map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #334155", color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysis.preview.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #1e293b" }}>
                      {analysis.headers.map(h => (
                        <td key={h} style={{ padding: "6px 10px", color: "#94a3b8", whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {String(row[h] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Import summary + button */}
          {!result && (
            <div style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600 }}>{analysis.totalRows} rows ready to import into <span style={{ color: "#60a5fa" }}>{module}</span></div>
                <div style={{ color: "#64748b", fontSize: 13, marginTop: 2 }}>Estimated success: {analysis.analysis.successEstimate}%</div>
              </div>
              <button onClick={executeImport} disabled={importing} style={{ ...S.btn("primary"), opacity: importing ? 0.6 : 1 }}>
                {importing ? "Importing…" : "Confirm Import"}
              </button>
            </div>
          )}

          {/* Import result */}
          {result && (
            <div style={{ ...S.card, borderColor: result.imported > 0 ? "#166534" : "#991b1b" }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 15, color: result.imported > 0 ? "#22c55e" : "#f87171" }}>
                {result.imported > 0 ? "Import complete!" : "Import failed"}
              </h3>
              <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
                <div><span style={{ fontWeight: 700, fontSize: 20, color: "#22c55e" }}>{result.imported}</span> <span style={{ color: "#64748b", fontSize: 13 }}>imported</span></div>
                <div><span style={{ fontWeight: 700, fontSize: 20, color: "#f59e0b" }}>{result.skipped}</span> <span style={{ color: "#64748b", fontSize: 13 }}>skipped</span></div>
                <div><span style={{ fontWeight: 700, fontSize: 20, color: "#94a3b8" }}>{result.total}</span> <span style={{ color: "#64748b", fontSize: 13 }}>total</span></div>
              </div>
              {result.errors.length > 0 && (
                <div style={{ background: "#0f172a", borderRadius: 6, padding: "8px 12px", marginBottom: 12 }}>
                  {result.errors.slice(0, 5).map((e, i) => (
                    <div key={i} style={{ color: "#f87171", fontSize: 12 }}>{e}</div>
                  ))}
                  {result.errors.length > 5 && <div style={{ color: "#64748b", fontSize: 12 }}>+{result.errors.length - 5} more errors</div>}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                {MODULE_PAGES[module] && (
                  <a href={MODULE_PAGES[module]} style={{ ...S.btn("primary"), textDecoration: "none", display: "inline-block" }}>
                    View {module}
                  </a>
                )}
                <button onClick={reset} style={S.btn("secondary")}>Import another file</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import History */}
      <div style={{ ...S.card, marginTop: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 15 }}>Import History</h2>
          <button onClick={loadHistory} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 13 }}>
            {historyLoad ? "Loading…" : "↺ Refresh"}
          </button>
        </div>
        {history.length === 0 ? (
          <p style={{ color: "#475569", fontSize: 13 }}>No imports yet. {!historyLoad && <button onClick={loadHistory} style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: 13 }}>Load history</button>}</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Date", "Module", "Source", "Imported", "Skipped", "By"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #334155", color: "#64748b", fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map(log => (
                <tr key={log.id} style={{ borderBottom: "1px solid #1e293b" }}>
                  <td style={{ padding: "8px 10px", color: "#94a3b8" }}>{new Date(log.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td style={{ padding: "8px 10px", color: "#60a5fa", fontWeight: 600 }}>{log.module}</td>
                  <td style={{ padding: "8px 10px", color: "#94a3b8", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.source}</td>
                  <td style={{ padding: "8px 10px", color: "#22c55e", fontWeight: 600 }}>{log.imported}</td>
                  <td style={{ padding: "8px 10px", color: log.skipped > 0 ? "#f59e0b" : "#94a3b8" }}>{log.skipped}</td>
                  <td style={{ padding: "8px 10px", color: "#94a3b8" }}>{log.importedBy ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
