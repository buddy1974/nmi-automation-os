import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"
import { requireAuth }  from "@/lib/api-auth"

// ── GET /api/products ─────────────────────────────────────────────────────────

export async function GET() {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const products = await prisma.product.findMany({
    orderBy: { id: "desc" },
  })

  return NextResponse.json(
    products.map(p => ({
      id:           p.id,
      code:         p.code,
      title:        p.title,
      level:        p.level,
      class:        p.class,
      subject:      p.subject,
      author:       p.author,
      price:        Number(p.price),
      stock:        p.stock,
      royaltyType:  p.royaltyType,
      royaltyValue: Number(p.royaltyValue),
    }))
  )
}

// ── POST /api/products ────────────────────────────────────────────────────────

export async function POST(req: Request) {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin" && auth.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const data = await req.json()

  if (!data.code || !data.title) {
    return NextResponse.json({ error: "code and title are required" }, { status: 400 })
  }

  const exists = await prisma.product.findUnique({ where: { code: data.code } })
  if (exists) {
    return NextResponse.json({ error: "Product code already in use" }, { status: 409 })
  }

  const product = await prisma.product.create({
    data: {
      code:    data.code,
      title:   data.title,
      level:   data.level   ?? "Primary",
      class:   data.class   ?? "",
      subject: data.subject ?? "",
      author:  data.author  ?? "Unknown",
      price:   data.price   ?? 0,
      stock:   data.stock   ?? 0,
    },
  })

  return NextResponse.json({
    id:    product.id,
    code:  product.code,
    title: product.title,
    price: Number(product.price),
    stock: product.stock,
  }, { status: 201 })
}
