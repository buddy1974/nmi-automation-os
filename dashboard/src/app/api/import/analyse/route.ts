import { NextRequest, NextResponse } from "next/server"
import { requireAuth }               from "@/lib/api-auth"
import { parseBuffer, MODULE_FIELDS } from "@/lib/importParser"
import Anthropic                     from "@anthropic-ai/sdk"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const formData = await req.formData()
  const file     = formData.get("file") as File | null
  const module   = formData.get("module") as string | null

  if (!file || !module) {
    return NextResponse.json({ error: "file and module required" }, { status: 400 })
  }
  if (!MODULE_FIELDS[module]) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)
  const { headers, rows } = parseBuffer(buffer, file.name)

  if (!headers.length) {
    return NextResponse.json({ error: "File appears to be empty or unreadable" }, { status: 422 })
  }

  const preview = rows.slice(0, 5)
  const fields  = MODULE_FIELDS[module]

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
  "summary": "<one sentence summary of the data quality>"
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
    analysis = { mapping: {}, missingRequired: fields.required, issues: ["Could not parse AI response"], successEstimate: 0, summary: "Analysis failed" }
  }

  return NextResponse.json({ headers, preview, analysis, totalRows: rows.length })
}
