"use server"

import { prisma }        from "@/lib/db"
import { checkPassword, createToken } from "@/lib/auth"
import { cookies }       from "next/headers"
import { redirect }      from "next/navigation"

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {

  const email    = (formData.get("email")    as string)?.trim().toLowerCase()
  const password = (formData.get("password") as string) ?? ""

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user || !user.active) {
    return { error: "Invalid credentials." }
  }

  const valid = await checkPassword(password, user.password)
  if (!valid) {
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

  redirect("/dashboard")
}
