import { NextResponse }   from "next/server"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { searchKnowledge } from "../search/route"
import Anthropic           from "@anthropic-ai/sdk"

export const runtime = "nodejs"

const ai = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SYSTEM_PROMPT = `You are the NMI Education internal knowledge assistant. Answer questions based ONLY on the provided company documents. If the answer is not in the documents, say so clearly. Be concise and professional. Format your answer in plain text — no markdown headers, no bullet symbol overuse. Use numbered lists only when listing steps.`

// ── POST /api/knowledge/ask ───────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { question } = await req.json()
    if (!question?.trim()) {
      return NextResponse.json({ error: "question is required", code: "VALIDATION" }, { status: 400 })
    }

    // Step 1 — find relevant docs
    const docs = await searchKnowledge(question, auth.companyId ?? undefined)

    let answer: string
    const sources: { id: string; title: string; category: string }[] = []

    if (docs.length === 0) {
      answer = "I couldn't find any relevant documents in the knowledge base to answer your question. Please ask an administrator to add the relevant policy or guideline."
    } else {
      // Step 2 — build context from matching docs
      const context = docs.map((d, i) =>
        `[Document ${i + 1}: ${d.title} (${d.category})]\n${d.content}`
      ).join("\n\n---\n\n")

      const userPrompt = `Company documents:\n\n${context}\n\n---\n\nQuestion: ${question}`

      const msg = await ai.messages.create({
        model:      "claude-sonnet-4-6",
        max_tokens: 600,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: "user", content: userPrompt }],
      })

      answer  = (msg.content[0] as { type: string; text: string }).text.trim()
      sources.push(...docs.map(d => ({ id: d.id, title: d.title, category: d.category })))
    }

    return NextResponse.json({ answer, sources })

  } catch (err) {
    console.error("[POST /api/knowledge/ask]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
