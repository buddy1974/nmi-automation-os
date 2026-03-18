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
    const order = await tx.order.create({
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

    // Create invoice for this order
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 30)

    await tx.invoice.create({
      data: {
        number: "INV-" + Date.now(),
        orderId: order.id,
        customerName: data.customerName,
        amount: total,
        dueDate,
        status: "issued",
      },
    })

    // Decrement stock and log history for each item
    for (const item of data.items) {
      const updated = await tx.product.update({
        where: { code: item.productCode },
        data: { stock: { decrement: item.qty } },
      })
      await tx.stockHistory.create({
        data: {
          productId: updated.id,
          change: -item.qty,
          reason: "order",
          note: `Order deducted ${item.qty} unit(s)`,
        },
      })
    }
  })

  revalidatePath("/orders")
}
