import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export interface EmailClassification {
  category:   "sales" | "hr" | "editorial" | "accounting" | "support" | "ceo" | "spam" | "general"
  priority:   "urgent" | "high" | "normal" | "low"
  department: string
  summary:    string
  routedTo:   string
}

const SYSTEM_PROMPT = `You are an email routing AI for NMI Education, a Cameroonian publishing and printing company. Classify the incoming email and return ONLY valid JSON with fields: category, priority, department, summary, routedTo. Categories: sales, hr, editorial, accounting, support, ceo, spam, general. Priority: urgent, high, normal, low. routedTo: the role or person who should handle this.`

const VALID_CATEGORIES = ["sales", "hr", "editorial", "accounting", "support", "ceo", "spam", "general"]
const VALID_PRIORITIES = ["urgent", "high", "normal", "low"]

export async function classifyEmail(params: {
  from:      string
  subject:   string
  body?:     string
  companyId?: string
}) {
  const { from, subject, body, companyId } = params

  const userMsg = `From: ${from}\nSubject: ${subject}\nBody: ${body ?? "(no body)"}`

  let classification: EmailClassification = {
    category:   "general",
    priority:   "normal",
    department: "General",
    summary:    subject,
    routedTo:   "Manager",
  }

  try {
    const msg = await ai.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 300,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: userMsg }],
    })

    const text = (msg.content[0] as { type: string; text: string }).text.trim()
    const jsonStart = text.indexOf("{")
    const jsonEnd   = text.lastIndexOf("}") + 1
    if (jsonStart !== -1) {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd))
      classification = {
        category:   VALID_CATEGORIES.includes(parsed.category) ? parsed.category   : "general",
        priority:   VALID_PRIORITIES.includes(parsed.priority) ? parsed.priority   : "normal",
        department: typeof parsed.department === "string"       ? parsed.department : "General",
        summary:    typeof parsed.summary    === "string"       ? parsed.summary    : subject,
        routedTo:   typeof parsed.routedTo   === "string"       ? parsed.routedTo   : "Manager",
      }
    }
  } catch {
    // AI failure — use defaults
  }

  const log = await prisma.emailLog.create({
    data: {
      from,
      subject,
      body:       body ?? null,
      category:   classification.category,
      priority:   classification.priority,
      department: classification.department,
      summary:    classification.summary,
      routedTo:   classification.routedTo,
      companyId:  companyId ?? null,
    },
  })

  return { log, classification }
}
