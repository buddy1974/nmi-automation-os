import { NextResponse }      from "next/server"
import { requireAuth }        from "@/lib/api-auth"
import { checkRateLimit }     from "@/lib/rateLimit"
import { auditLog }           from "@/lib/audit"
import { scanDocument, type DocumentType, type MediaType } from "@/lib/ocr"

export const runtime = "nodejs"

const VALID_MEDIA = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const
const VALID_TYPES = ["school_order", "author_submission", "delivery_note", "invoice", "general"] as const

export async function POST(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json() as { imageBase64?: string; mediaType?: string; documentType?: string }

    if (!body.imageBase64) {
      return NextResponse.json({ error: "imageBase64 is required" }, { status: 400 })
    }

    const mt: MediaType    = (VALID_MEDIA as readonly string[]).includes(body.mediaType ?? "")
      ? (body.mediaType as MediaType) : "image/jpeg"
    const dt: DocumentType = (VALID_TYPES as readonly string[]).includes(body.documentType ?? "")
      ? (body.documentType as DocumentType) : "general"

    const data = await scanDocument(body.imageBase64, mt, dt)

    await auditLog({ userId: auth.id, action: "OCR_SCAN", entity: "document", details: `type=${dt}`, ip })

    return NextResponse.json({ data, documentType: dt })
  } catch (err) {
    console.error("[POST /api/ocr]", err)
    return NextResponse.json({ error: "OCR scan failed" }, { status: 500 })
  }
}
