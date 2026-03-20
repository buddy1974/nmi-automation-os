import { NextResponse }   from "next/server"
import { prisma }         from "@/lib/db"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { sanitizeString } from "@/lib/validate"

export const runtime = "nodejs"

// ── GET /api/knowledge ────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const url      = new URL(req.url)
    const category = url.searchParams.get("category")
    const isPriv   = auth.role === "admin" || auth.role === "owner"

    const where: Record<string, unknown> = { active: true }
    if (!isPriv && auth.companyId) where.companyId = auth.companyId
    if (category && category !== "all")  where.category = category

    const docs = await prisma.knowledgeDoc.findMany({
      where,
      select: { id: true, title: true, category: true, tags: true, source: true, createdAt: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(docs)
  } catch (err) {
    console.error("[GET /api/knowledge]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}

// ── POST /api/knowledge ───────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (!["admin", "owner", "manager"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    const data = await req.json()

    if (!data.title?.trim())   return NextResponse.json({ error: "title is required",    code: "VALIDATION" }, { status: 400 })
    if (!data.category?.trim()) return NextResponse.json({ error: "category is required", code: "VALIDATION" }, { status: 400 })
    if (!data.content?.trim()) return NextResponse.json({ error: "content is required",  code: "VALIDATION" }, { status: 400 })

    const doc = await prisma.knowledgeDoc.create({
      data: {
        title:     sanitizeString(data.title),
        category:  sanitizeString(data.category),
        content:   data.content,
        source:    data.source    ? sanitizeString(data.source)    : null,
        tags:      data.tags      ? sanitizeString(data.tags)      : null,
        createdBy: auth.name,
        companyId: auth.companyId ?? null,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    console.error("[POST /api/knowledge]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
