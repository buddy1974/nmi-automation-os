import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const orders = await prisma.order.findMany({
    include: { customer: true, items: true },
    orderBy: { id: "desc" },
  })

  return NextResponse.json(
    orders.map(o => ({
      id: o.id,
      number: o.number,
      customer: o.customer?.name ?? o.customerName,
      date: o.date,
      total: Number(o.total),
      status: o.status,
      items: o.items.map(i => ({
        productCode: i.productCode,
        title: i.title,
        qty: i.qty,
        price: Number(i.price),
        lineTotal: Number(i.lineTotal),
      })),
    }))
  )
}
