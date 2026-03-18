import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"
import { requireAuth }  from "@/lib/api-auth"

// ── GET /api/invoices ─────────────────────────────────────────────────────────

export async function GET() {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const invoices = await prisma.invoice.findMany({
    orderBy: { id: "desc" },
  })

  return NextResponse.json(
    invoices.map(i => ({
      id:        i.id,
      number:    i.number,
      customer:  i.customerName,
      amount:    Number(i.amount),
      paid:      Number(i.paid),
      balance:   Number(i.amount) - Number(i.paid),
      status:    i.status,
      dueDate:   i.dueDate,
      createdAt: i.createdAt,
    }))
  )
}

// ── POST /api/invoices ────────────────────────────────────────────────────────

export async function POST(req: Request) {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin" && auth.role !== "accountant" && auth.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await req.json()

  if (!data.orderId) {
    return NextResponse.json({ error: "orderId is required" }, { status: 400 })
  }
  if (!data.customerName) {
    return NextResponse.json({ error: "customerName is required" }, { status: 400 })
  }
  if (!data.amount || Number(data.amount) <= 0) {
    return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 })
  }

  // Ensure order exists
  const order = await prisma.order.findUnique({ where: { id: Number(data.orderId) } })
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // Ensure order doesn't already have an invoice
  const existing = await prisma.invoice.findUnique({ where: { orderId: Number(data.orderId) } })
  if (existing) {
    return NextResponse.json({ error: "Invoice already exists for this order" }, { status: 409 })
  }

  // Due date: use provided value or default to 30 days from now
  const dueDate = data.dueDate
    ? new Date(data.dueDate)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const invoice = await prisma.invoice.create({
    data: {
      number:       "INV-API-" + Date.now(),
      orderId:      Number(data.orderId),
      customerName: data.customerName,
      amount:       Number(data.amount),
      paid:         0,
      status:       "issued",
      dueDate,
    },
  })

  return NextResponse.json({
    id:       invoice.id,
    number:   invoice.number,
    amount:   Number(invoice.amount),
    status:   invoice.status,
    dueDate:  invoice.dueDate,
  }, { status: 201 })
}
