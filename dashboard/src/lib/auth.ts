import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

// ── Password ──────────────────────────────────────────────────────────────────

export async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10)
}

export async function checkPassword(pw: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pw, hash)
}

// ── JWT ───────────────────────────────────────────────────────────────────────

export interface SessionPayload extends JWTPayload {
  id:    string
  email: string
  name:  string
  role:  string
}

export async function createToken(payload: Omit<SessionPayload, keyof JWTPayload>): Promise<string> {
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as SessionPayload
  } catch {
    return null
  }
}

// ── Session helper (for server components + actions) ──────────────────────────

export async function getSession(token?: string): Promise<SessionPayload | null> {
  if (!token) return null
  return verifyToken(token)
}
