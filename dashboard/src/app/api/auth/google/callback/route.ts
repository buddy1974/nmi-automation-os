import { NextRequest, NextResponse } from "next/server"
import { exchangeCode, saveTokens }  from "@/lib/google"
import { requireAuth }               from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { searchParams } = req.nextUrl
  const code  = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(new URL("/office?error=google_denied", req.url))
  }

  try {
    const tokens = await exchangeCode(code)
    await saveTokens(auth.id, tokens)
    return NextResponse.redirect(new URL("/office?connected=1", req.url))
  } catch (err) {
    console.error("Google callback error:", err)
    return NextResponse.redirect(new URL("/office?error=token_exchange", req.url))
  }
}
