import { NextResponse }  from "next/server"
import { requireAuth }   from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import Anthropic         from "@anthropic-ai/sdk"

export const runtime = "nodejs"

type WriteField =
  | "performance_evaluation"
  | "manuscript_review"
  | "order_description"
  | "hr_alert"
  | "author_letter"
  | "school_outreach"
  | "general"

const FIELD_CONTEXT: Record<WriteField, string> = {
  performance_evaluation: "Write a professional performance evaluation paragraph for an HR record at NMI Education. Use precise, objective language. Cover the employee's contributions, strengths, and areas for improvement.",
  manuscript_review:      "Write a professional editorial review of a manuscript for NMI Education, a Cameroonian educational publisher. Use publishing industry terminology. Comment on educational value, writing quality, and suitability for the target level.",
  order_description:      "Write a professional order description for a delivery note or invoice at NMI Education. Be concise, accurate, and factual. Include relevant product and quantity details.",
  hr_alert:               "Write a formal HR alert, warning notice, or disciplinary memo for NMI Education. Use formal, professional language appropriate for official HR documentation. Be clear about the issue and the expected resolution.",
  author_letter:          "Write a professional letter from NMI Education to an author regarding their manuscript. Be respectful and encouraging while clearly communicating the manuscript's status, any required revisions, or next steps.",
  school_outreach:        "Write a professional sales outreach letter from NMI Education to a school principal or director in Cameroon. Present NMI's educational materials persuasively and respectfully. Reference Cameroonian curriculum if relevant.",
  general:                "Write professional business text for NMI Education, a Cameroonian publishing and printing company based in Yaoundé and Douala.",
}

const VALID_FIELDS = [
  "performance_evaluation", "manuscript_review", "order_description",
  "hr_alert", "author_letter", "school_outreach", "general",
] as const

function detectLanguage(text: string): "fr" | "en" {
  const frPattern = /\b(le|la|les|du|de|des|un|une|et|est|sont|je|vous|nous|il|elle|pour|avec|dans|sur|par|que|qui|ou|mais|donc|bonjour|merci|s'il|avoir|être|faire)\b/i
  return frPattern.test(text) ? "fr" : "en"
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { input, field = "general", language = "auto" } = await req.json() as {
      input?:    string
      field?:    string
      language?: string
    }

    if (!input?.trim()) {
      return NextResponse.json({ error: "input is required" }, { status: 400 })
    }

    const f: WriteField = (VALID_FIELDS as readonly string[]).includes(field)
      ? (field as WriteField) : "general"

    const lang      = language === "fr" || language === "en" ? language : detectLanguage(input)
    const langLabel = lang === "fr" ? "French" : "English"

    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-6",
      max_tokens: 600,
      system: `You are a professional writing assistant for NMI Education, a Cameroonian publishing and printing company. ${FIELD_CONTEXT[f]} The user types keywords or rough notes in ${langLabel}. Expand them into a complete, polished, professional paragraph in ${langLabel}. Respond ONLY with the finished text — no explanations, no preamble, no alternatives.`,
      messages: [
        { role: "user", content: input.trim() },
      ],
    })

    const text = response.content[0].type === "text" ? response.content[0].text.trim() : ""

    return NextResponse.json({ text, language_detected: lang })
  } catch (err) {
    console.error("[POST /api/ai/write]", err)
    return NextResponse.json({ error: "AI write failed" }, { status: 500 })
  }
}
