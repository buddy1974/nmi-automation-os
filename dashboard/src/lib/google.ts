import { prisma } from "@/lib/db"

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID     ?? ""
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? ""
const REDIRECT_URI  = process.env.GOOGLE_REDIRECT_URI  ?? ""

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ")

// ── Auth URL ──────────────────────────────────────────────────────────────────

export function getAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: "code",
    scope:         SCOPES,
    access_type:   "offline",
    prompt:        "consent",
    ...(state ? { state } : {}),
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// ── Token exchange ────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token:  string
  refresh_token?: string
  expires_in:    number
  scope:         string
  token_type:    string
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }
  return res.json() as Promise<TokenResponse>
}

// ── Refresh ───────────────────────────────────────────────────────────────────

export async function refreshAccessToken(userId: string): Promise<string> {
  const stored = await prisma.googleToken.findUnique({ where: { userId } })
  if (!stored?.refreshToken) throw new Error("No refresh token stored")

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    new URLSearchParams({
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: stored.refreshToken,
      grant_type:    "refresh_token",
    }),
  })
  if (!res.ok) throw new Error("Token refresh failed")

  const data = await res.json() as { access_token: string; expires_in: number }
  const expiresAt = new Date(Date.now() + data.expires_in * 1000)

  await prisma.googleToken.update({
    where: { userId },
    data:  { accessToken: data.access_token, expiresAt },
  })

  return data.access_token
}

// ── Get valid token ───────────────────────────────────────────────────────────

export async function getValidToken(userId: string): Promise<string | null> {
  const stored = await prisma.googleToken.findUnique({ where: { userId } })
  if (!stored) return null

  // If token expires in less than 2 minutes, refresh
  const needsRefresh = stored.expiresAt.getTime() - Date.now() < 120_000
  if (needsRefresh && stored.refreshToken) {
    try {
      return await refreshAccessToken(userId)
    } catch {
      return null
    }
  }

  return stored.accessToken
}

// ── Save tokens ───────────────────────────────────────────────────────────────

export async function saveTokens(userId: string, tokens: TokenResponse): Promise<void> {
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)
  await prisma.googleToken.upsert({
    where:  { userId },
    update: {
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token ?? undefined,
      expiresAt,
      scope:        tokens.scope,
    },
    create: {
      userId,
      accessToken:  tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
      scope:        tokens.scope,
    },
  })
}

// ── Check connected ───────────────────────────────────────────────────────────

export async function isGoogleConnected(userId: string): Promise<boolean> {
  const stored = await prisma.googleToken.findUnique({ where: { userId } })
  return !!stored
}
