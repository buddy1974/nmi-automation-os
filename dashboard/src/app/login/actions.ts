"use server"

import { prisma }        from "@/lib/db"
import { checkPassword, createToken } from "@/lib/auth"
import { cookies, headers } from "next/headers"
import { redirect }      from "next/navigation"
import { checkRateLimit } from "@/lib/rateLimit"
import { auditLog }      from "@/lib/audit"
import { validateEmail, validatePassword, sanitizeString } from "@/lib/validate"

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {

  // Rate limit by IP
  const hdrs = await headers()
  const ip   = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
  if (!checkRateLimit(ip, "auth")) {
    return { error: "Too many login attempts. Please wait a minute and try again." }
  }

  const rawEmail    = formData.get("email")
  const rawPassword = formData.get("password")

  // Validate
  const emailErr = validateEmail(rawEmail)
  if (emailErr) return { error: emailErr }

  const passwordErr = validatePassword(rawPassword, 6)
  if (passwordErr) return { error: passwordErr }

  const email    = sanitizeString(rawEmail).toLowerCase()
  const password = rawPassword as string

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.active) {
    await auditLog({ action: "LOGIN_FAIL", entity: "user", details: email, ip })
    return { error: "Invalid credentials." }
  }

  const valid = await checkPassword(password, user.password)
  if (!valid) {
    await auditLog({ action: "LOGIN_FAIL", entity: "user", entityId: String(user.id), ip })
    return { error: "Invalid credentials." }
  }

  const token = await createToken({
    id:        user.id,
    email:     user.email,
    name:      user.name,
    role:      user.role,
    companyId: user.companyId ?? undefined,
  })

  const jar = await cookies()
  jar.set("nmi_session", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7, // 7 days
    path:     "/",
  })

  await auditLog({ action: "LOGIN_SUCCESS", entity: "user", entityId: String(user.id), details: user.email, ip })

  redirect("/dashboard")
}
