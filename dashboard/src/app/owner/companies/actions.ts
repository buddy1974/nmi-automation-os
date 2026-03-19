"use server"

import { prisma }         from "@/lib/db"
import { revalidatePath } from "next/cache"

// ── Create company ─────────────────────────────────────────────────────────────

export async function createCompany(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const name = (formData.get("name") as string)?.trim()
  const city = (formData.get("city") as string)?.trim() ?? ""

  if (!name) return { error: "Company name is required." }

  const exists = await prisma.company.findFirst({ where: { name } })
  if (exists) return { error: `Company "${name}" already exists.` }

  await prisma.company.create({ data: { name, city } })
  revalidatePath("/owner/companies")
  return { success: true }
}

// ── Toggle active ──────────────────────────────────────────────────────────────

export async function toggleCompany(id: string): Promise<void> {
  const company = await prisma.company.findUnique({ where: { id } })
  if (!company) return
  await prisma.company.update({ where: { id }, data: { active: !company.active } })
  revalidatePath("/owner/companies")
}
