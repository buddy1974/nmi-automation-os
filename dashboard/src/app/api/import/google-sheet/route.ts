import { NextRequest, NextResponse } from "next/server"
import { requireAuth }               from "@/lib/api-auth"
import { parseBuffer, MODULE_FIELDS } from "@/lib/importParser"
import Anthropic                     from "@anthropic-ai/sdk"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

function toCSVExportUrl(sheetUrl: string): string | null {
  // https://docs.google.com/spreadsheets/d/SHEET_ID/edit... → CSV export
  const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) return null
  const gid = sheetUrl.match(/gid=(\d+)/)?.[1] ?? "0"
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { sheetUrl, module } = await req.json() as { sheetUrl: string; module: string }

  if (!sheetUrl || !module) {
    return NextResponse.json({ error: "sheetUrl and module required" }, { status: 400 })
  }
  if (!MODULE_FIELDS[module]) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
  }

  const csvUrl = toCSVExportUrl(sheetUrl)
  if (!csvUrl) {
    return NextResponse.json({ error: "Invalid Google Sheets URL" }, { status: 400 })
  }

  const res = await fetch(csvUrl)
  if (!res.ok) {
    return NextResponse.json({ error: "Could not fetch sheet — ensure it is publicly accessible" }, { status: 400 })
  }

  const csvText   = await res.text()
  const buffer    = Buffer.from(csvText, "utf-8")
  const { headers, rows } = parseBuffer(buffer, "sheet.csv")

  if (!headers.length) {
    return NextResponse.json({ error: "Sheet appears to be empty" }, { status: 422 })
  }

  const fields  = MODULE_FIELDS[module]
  const preview = rows.slice(0, 5)

  const prompt = `You are a data import assistant for NMI Education, a Cameroonian publishing company.

Analyse these spreadsheet headers and map them to NMI ${module} fields.

Spreadsheet headers: ${JSON.stringify(headers)}
Sample data (first 3 rows): ${JSON.stringify(rows.slice(0, 3))}

NMI ${module} fields:
- Required: ${fields.required.join(", ")}
- All available: ${fields.all.join(", ")}

Return ONLY valid JSON, no markdown:
{
  "mapping": { "<spreadsheet_column>": "<nmi_field_or___skip__>" },
  "missingRequired": ["<field>"],
  "issues": ["<issue description>"],
  "successEstimate": <0-100>,
  "summary": "<one sentence summary>"
}`

  const msg = await ai.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 600,
    system:     "You are a data import assistant. Return only valid JSON.",
    messages:   [{ role: "user", content: prompt }],
  })

  let analysis: Record<string, unknown>
  try {
    const text = msg.content[0]?.type === "text" ? msg.content[0].text.trim() : "{}"
    analysis   = JSON.parse(text)
  } catch {
    analysis = { mapping: {}, missingRequired: fields.required, issues: ["Analysis failed"], successEstimate: 0, summary: "" }
  }

  return NextResponse.json({ headers, preview, analysis, totalRows: rows.length, source: "google_sheet" })
}
