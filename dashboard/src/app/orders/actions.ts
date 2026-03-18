"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function saveOrder(data: {
  customerId: number | null
  customerName: string
  items: { productCode: string; title: string; qty: number; price: number }[]
}) {
  if (data.items.length === 0) return

  const total = data.items.reduce((sum, i) => sum + i.qty * i.price, 0)

  await prisma.order.create({
    data: {
      number: "ORD-" + Date.now(),
      customerId: data.customerId || null,
      customerName: data.customerName,
      total,
      items: {
        create: data.items.map(i => ({
          productCode: i.productCode,
          title: i.title,
          qty: i.qty,
          price: i.price,
          lineTotal: i.qty * i.price,
        })),
      },
    },
  })

  revalidatePath("/orders")
}
