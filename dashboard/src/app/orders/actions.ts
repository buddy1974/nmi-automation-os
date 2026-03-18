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

  await prisma.$transaction(async (tx) => {
    // Check stock for every item before doing anything
    for (const item of data.items) {
      const product = await tx.product.findUnique({
        where: { code: item.productCode },
      })
      if (!product) throw new Error(`Product not found: ${item.productCode}`)
      if (product.stock < item.qty) {
        throw new Error(`Not enough stock for ${product.title} (available: ${product.stock})`)
      }
    }

    // Create the order with its items
    await tx.order.create({
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

    // Decrement stock for each item
    for (const item of data.items) {
      await tx.product.update({
        where: { code: item.productCode },
        data: { stock: { decrement: item.qty } },
      })
    }
  })

  revalidatePath("/orders")
}
