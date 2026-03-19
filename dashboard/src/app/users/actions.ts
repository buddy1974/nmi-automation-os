"use server"

import { prisma }        from "@/lib/db"
import { hashPassword }  from "@/lib/auth"
import { revalidatePath } from "next/cache"

const ROLES = ["admin", "manager", "accountant", "editor", "printer", "hr", "viewer"]

// ── Create user ───────────────────────────────────────────────────────────────

export async function createUser(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {

  const name      = (formData.get("name")      as string)?.trim()
  const email     = (formData.get("email")     as string)?.trim().toLowerCase()
  const password  = (formData.get("password")  as string) ?? ""
  const role      = (formData.get("role")      as string) ?? "viewer"
  const companyId = (formData.get("companyId") as string) || null

  if (!name || !email || !password) return { error: "All fields are required." }
  if (password.length < 6)          return { error: "Password must be at least 6 characters." }
  if (!ROLES.includes(role))        return { error: "Invalid role." }

  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) return { error: "Email already in use." }

  const hashed = await hashPassword(password)
  await prisma.user.create({ data: { name, email, password: hashed, role, companyId } })

  revalidatePath("/users")
  return { success: true }
}

// ── Update role ───────────────────────────────────────────────────────────────

export async function updateUserRole(userId: string, role: string) {
  if (!ROLES.includes(role)) return
  await prisma.user.update({ where: { id: userId }, data: { role } })
  revalidatePath("/users")
}

// ── Toggle active ─────────────────────────────────────────────────────────────

export async function toggleUserActive(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } })
  revalidatePath("/users")
}

// ── Update company ────────────────────────────────────────────────────────────

export async function updateUserCompany(userId: string, companyId: string) {
  await prisma.user.update({
    where: { id: userId },
    data:  { companyId: companyId === "none" ? null : companyId },
  })
  revalidatePath("/users")
}

// ── Reset password ────────────────────────────────────────────────────────────

export async function resetPassword(
  userId: string,
  newPassword: string,
): Promise<{ error?: string; success?: boolean }> {

  if (!newPassword || newPassword.length < 6) return { error: "Password must be at least 6 characters." }
  const hashed = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })
  revalidatePath("/users")
  return { success: true }
}
