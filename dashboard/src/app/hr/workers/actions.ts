"use server"

import { prisma }         from "@/lib/db"
import { revalidatePath } from "next/cache"

const CONTRACT_TYPES = ["CDI", "CDD", "Stage", "Freelance", "Consultant", "Author", "Printer", "Temporary"]

// ── Create worker ──────────────────────────────────────────────────────────────

export async function createWorker(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {

  const name         = (formData.get("name")         as string)?.trim()
  const role         = (formData.get("role")         as string)?.trim() ?? ""
  const department   = (formData.get("department")   as string)?.trim() ?? ""
  const contractType = (formData.get("contractType") as string) ?? "CDI"
  const salaryBase   = Number(formData.get("salaryBase")) || 0
  const companyId    = (formData.get("companyId")    as string) || null

  if (!name) return { error: "Worker name is required." }
  if (!CONTRACT_TYPES.includes(contractType)) return { error: "Invalid contract type." }

  await prisma.worker.create({
    data: { name, role, department, contractType, salaryBase, companyId },
  })

  revalidatePath("/hr/workers")
  return { success: true }
}

// ── Update worker company ──────────────────────────────────────────────────────

export async function updateWorkerCompany(workerId: number, companyId: string): Promise<void> {
  await prisma.worker.update({
    where: { id: workerId },
    data:  { companyId: companyId === "none" ? null : companyId },
  })
  revalidatePath("/hr/workers")
}

// ── Toggle worker status ───────────────────────────────────────────────────────

export async function toggleWorkerStatus(workerId: number): Promise<void> {
  const worker = await prisma.worker.findUnique({ where: { id: workerId } })
  if (!worker) return
  await prisma.worker.update({
    where: { id: workerId },
    data:  { status: worker.status === "active" ? "inactive" : "active" },
  })
  revalidatePath("/hr/workers")
}
