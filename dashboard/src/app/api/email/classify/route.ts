import { NextResponse }   from "next/server"
import { requireAuth }    from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { classifyEmail }  from "@/lib/emailClassifier"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const data = await req.json()

    if (!data.from || !data.subject) {
      return NextResponse.json({ error: "from and subject are required", code: "VALIDATION" }, { status: 400 })
    }

    const result = await classifyEmail({
      from:      String(data.from),
      subject:   String(data.subject),
      body:      data.body ? String(data.body) : undefined,
      companyId: auth.companyId ?? undefined,
    })

    return NextResponse.json(result, { status: 201 })

  } catch (err) {
    console.error("[POST /api/email/classify]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
