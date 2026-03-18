import { NextResponse } from "next/server"
import { prisma }       from "@/lib/db"
import { requireAuth }  from "@/lib/api-auth"

// ── GET /api/finance ──────────────────────────────────────────────────────────

export async function GET() {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin" && auth.role !== "manager" && auth.role !== "accountant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const invoices = await prisma.invoice.findMany()

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0)
  const totalPaid    = invoices.reduce((s, i) => s + Number(i.paid),   0)
  const totalUnpaid  = totalRevenue - totalPaid

  const countAll     = invoices.length
  const countPaid    = invoices.filter(i => i.status === "paid").length
  const countPartial = invoices.filter(i => i.status === "partial").length
  const countUnpaid  = invoices.filter(i => i.status === "issued" || i.status === "draft").length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const countOverdue = invoices.filter(
    i => i.status !== "paid" && i.status !== "cancelled" && new Date(i.dueDate) < today
  ).length

  const collectionRate = totalRevenue > 0
    ? Math.round((totalPaid / totalRevenue) * 100)
    : 0

  return NextResponse.json({
    totalRevenue,
    totalPaid,
    totalUnpaid,
    collectionRate,
    countAll,
    countPaid,
    countPartial,
    countUnpaid,
    countOverdue,
  })
}
