"use server"

import { prisma }     from "@/lib/db"
import { cookies }    from "next/headers"
import { getSession } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function markAsRead(id: string) {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session) return

  await prisma.notification.update({
    where: { id },
    data:  { read: true },
  })

  revalidatePath("/notifications")
}

export async function markAllAsRead(companyId?: string) {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session) return

  await prisma.notification.updateMany({
    where: {
      read:      false,
      companyId: companyId ?? null,
    },
    data: { read: true },
  })

  revalidatePath("/notifications")
}
