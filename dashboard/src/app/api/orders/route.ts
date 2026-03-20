import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"
import { requireAuth }  from "@/lib/api-auth"
import { checkRateLimit } from "@/lib/rateLimit"
import { auditLog }     from "@/lib/audit"
import { validateRequired, validatePositiveNumber, sanitizeString } from "@/lib/validate"

function getIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
}

// ── GET /api/orders ───────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const orders = await prisma.order.findMany({
      include: { customer: true, items: true },
      orderBy: { id: "desc" },
    })

    return NextResponse.json(
      orders.map(o => ({
        id:       o.id,
        number:   o.number,
        customer: o.customer?.name ?? o.customerName,
        date:     o.date,
        total:    Number(o.total),
        status:   o.status,
        items: o.items.map(i => ({
          productCode: i.productCode,
          title:       i.title,
          qty:         i.qty,
          price:       Number(i.price),
          lineTotal:   Number(i.lineTotal),
        })),
      }))
    )
  } catch (err) {
    console.error("[GET /api/orders]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}

// ── POST /api/orders ──────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const ip = getIp(req)
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded", code: "RATE_LIMIT" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (auth.role !== "admin" && auth.role !== "manager") {
      return NextResponse.json({ error: "Forbidden", code: "FORBIDDEN" }, { status: 403 })
    }

    const data = await req.json()

    // Validate
    const customerErr = validateRequired(data.customerName, "customerName")
    if (customerErr) return NextResponse.json({ error: customerErr, code: "VALIDATION" }, { status: 400 })

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ error: "items array is required and must not be empty", code: "VALIDATION" }, { status: 400 })
    }

    for (const item of data.items) {
      const qtyErr   = validatePositiveNumber(item.qty,   "item.qty")
      const priceErr = validatePositiveNumber(item.price, "item.price")
      if (qtyErr)   return NextResponse.json({ error: qtyErr,   code: "VALIDATION" }, { status: 400 })
      if (priceErr) return NextResponse.json({ error: priceErr, code: "VALIDATION" }, { status: 400 })
    }

    if (data.companyId !== undefined && typeof data.companyId !== "string") {
      return NextResponse.json({ error: "companyId must be a string", code: "VALIDATION" }, { status: 400 })
    }

    const number = "API-" + Date.now()
    const total  = data.items.reduce(
      (sum: number, i: { qty: number; price: number }) => sum + i.qty * i.price, 0
    )

    const order = await prisma.order.create({
      data: {
        number,
        customerName: sanitizeString(data.customerName),
        total,
        status:    "pending",
        companyId: data.companyId ?? null,
        items: {
          create: data.items.map((i: { productCode: string; title: string; qty: number; price: number }) => ({
            productCode: sanitizeString(i.productCode),
            title:       sanitizeString(i.title),
            qty:         Number(i.qty),
            price:       Number(i.price),
            lineTotal:   Number(i.qty) * Number(i.price),
          })),
        },
      },
      include: { items: true },
    })

    await auditLog({
      userId:   String(auth.id),
      action:   "ORDER_CREATE",
      entity:   "order",
      entityId: String(order.id),
      details:  `Order ${order.number} — ${sanitizeString(data.customerName)}`,
      ip,
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

  } catch (err) {
    console.error("[POST /api/orders]", err)
    return NextResponse.json({ error: "Internal server error", code: "SERVER_ERROR" }, { status: 500 })
  }
}
