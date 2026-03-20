import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"
import { requireAuth }  from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { auditLog }     from "@/lib/audit"
import { validateRequired, validatePositiveNumber, validateEnum, sanitizeString } from "@/lib/validate"

const VALID_STATUSES = ["issued", "partial", "paid", "overdue", "cancelled"]

function getIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
}

// ── GET /api/invoices ─────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const invoices = await prisma.invoice.findMany({ orderBy: { id: "desc" } })

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
  } catch (err) {
    console.error("[GET /api/invoices]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}

// ── POST /api/invoices ────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (auth.role !== "admin" && auth.role !== "accountant" && auth.role !== "manager") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    const data = await req.json()

    // Validate
    const orderIdErr     = validateRequired(data.orderId, "orderId")
    if (orderIdErr) return NextResponse.json({ error: orderIdErr, code: "VALIDATION" }, { status: 400 })

    const customerErr    = validateRequired(data.customerName, "customerName")
    if (customerErr) return NextResponse.json({ error: customerErr, code: "VALIDATION" }, { status: 400 })

    const amountErr      = validatePositiveNumber(data.amount, "amount")
    if (amountErr) return NextResponse.json({ error: amountErr, code: "VALIDATION" }, { status: 400 })

    if (data.status !== undefined) {
      const statusErr = validateEnum(data.status, VALID_STATUSES, "status")
      if (statusErr) return NextResponse.json({ error: statusErr, code: "VALIDATION" }, { status: 400 })
    }

    // Ensure order exists
    const order = await prisma.order.findUnique({ where: { id: Number(data.orderId) } })
    if (!order) {
      return NextResponse.json({ error: "Order not found", code: "NOT_FOUND" }, { status: 404 })
    }

    // Ensure no duplicate invoice
    const existing = await prisma.invoice.findUnique({ where: { orderId: Number(data.orderId) } })
    if (existing) {
      return NextResponse.json({ error: "Invoice already exists for this order", code: "CONFLICT" }, { status: 409 })
    }

    const dueDate = data.dueDate
      ? new Date(data.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const invoice = await prisma.invoice.create({
      data: {
        number:       "INV-API-" + Date.now(),
        orderId:      Number(data.orderId),
        customerName: sanitizeString(data.customerName),
        amount:       Number(data.amount),
        paid:         0,
        status:       "issued",
        dueDate,
      },
    })

    await auditLog({
      userId:   String(auth.id),
      action:   "INVOICE_CREATE",
      entity:   "invoice",
      entityId: String(invoice.id),
      details:  `Invoice ${invoice.number} — amount ${Number(data.amount)} XAF`,
      ip,
    })

    return NextResponse.json({
      id:      invoice.id,
      number:  invoice.number,
      amount:  Number(invoice.amount),
      status:  invoice.status,
      dueDate: invoice.dueDate,
    }, { status: 201 })

  } catch (err) {
    console.error("[POST /api/invoices]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
