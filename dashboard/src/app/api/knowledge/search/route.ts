import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"

export const runtime = "nodejs"

// ── POST /api/knowledge/search ────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { query } = await req.json()
    if (!query?.trim()) {
      return NextResponse.json({ error: "query is required", code: "VALIDATION" }, { status: 400 })
    }

    const docs = await searchKnowledge(query, auth.companyId ?? undefined)
    return NextResponse.json(docs)

  } catch (err) {
    console.error("[POST /api/knowledge/search]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}

// ── Shared search helper (also used by /ask) ──────────────────────────────────

export async function searchKnowledge(query: string, companyId?: string) {
  const term = query.toLowerCase()

  const where: Record<string, unknown> = { active: true }
  if (companyId) where.companyId = companyId

  const docs = await prisma.knowledgeDoc.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  // Score each doc by keyword relevance
  const scored = docs
    .map(doc => {
      const titleHits   = (doc.title.toLowerCase().match(new RegExp(term, "g")) ?? []).length * 3
      const contentHits = (doc.content.toLowerCase().match(new RegExp(term, "g")) ?? []).length
      const tagHits     = (doc.tags?.toLowerCase().match(new RegExp(term, "g")) ?? []).length * 2
      return { doc, score: titleHits + contentHits + tagHits }
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(r => r.doc)

  return scored
}
