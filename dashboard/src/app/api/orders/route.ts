import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"
import { requireAuth }  from "@/lib/api-auth"

// ── GET /api/orders ───────────────────────────────────────────────────────────

export async function GET() {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const orders = await prisma.order.findMany({
    include: { customer: true, items: true },
    orderBy: { id: "desc" },
  })

  return NextResponse.json(
    orders.map(o => ({
      id:           o.id,
      number:       o.number,
      customer:     o.customer?.name ?? o.customerName,
      date:         o.date,
      total:        Number(o.total),
      status:       o.status,
      items: o.items.map(i => ({
        productCode: i.productCode,
        title:       i.title,
        qty:         i.qty,
        price:       Number(i.price),
        lineTotal:   Number(i.lineTotal),
      })),
    }))
  )
}

// ── POST /api/orders ──────────────────────────────────────────────────────────

export async function POST(req: Request) {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin" && auth.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await req.json()

  if (!data.customerName) {
    return NextResponse.json({ error: "customerName is required" }, { status: 400 })
  }
  if (!Array.isArray(data.items) || data.items.length === 0) {
    return NextResponse.json({ error: "items array is required" }, { status: 400 })
  }

  const number = "API-" + Date.now()

  // Calculate total from items
  const total = data.items.reduce(
    (sum: number, i: { qty: number; price: number }) => sum + i.qty * i.price,
    0
  )

  const order = await prisma.order.create({
    data: {
      number,
      customerName: data.customerName,
      total,
      status: "pending",
      items: {
        create: data.items.map((i: {
          productCode: string
          title:       string
          qty:         number
          price:       number
        }) => ({
          productCode: i.productCode,
          title:       i.title,
          qty:         i.qty,
          price:       i.price,
          lineTotal:   i.qty * i.price,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json({
    id:     order.id,
    number: order.number,
    total:  Number(order.total),
    status: order.status,
    items:  order.items.map(i => ({
      productCode: i.productCode,
      title:       i.title,
      qty:         i.qty,
      price:       Number(i.price),
      lineTotal:   Number(i.lineTotal),
    })),
  }, { status: 201 })
}
