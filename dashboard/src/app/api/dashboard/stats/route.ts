import { NextResponse }                      from "next/server"
import { prisma }                            from "@/lib/db"
import { requireAuth }                       from "@/lib/api-auth"
import { checkRateLimit }                    from "@/lib/rateLimit"
import { resolveCompany, directFilter }      from "@/lib/companyFilter"

export const runtime = "nodejs"

// ── GET /api/dashboard/stats ──────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || "unknown"
    if (!checkRateLimit(ip, "default")) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const url = new URL(req.url)
    const companyCookie = url.searchParams.get("company") ?? undefined
    const cid  = resolveCompany(auth, companyCookie)
    const cw   = directFilter(cid)

    const [
      orderCount, revenueAgg, activeWorkers, pendingInvoices,
      lowStockCount, printReadyCount, unpaidRoyaltyCount, unreadNotifs,
    ] = await Promise.all([
      prisma.order.count({ where: cw }),
      prisma.order.aggregate({ _sum: { total: true }, where: cw }),
      prisma.worker.count({ where: { ...cw, status: "active" } }),
      prisma.invoice.count({ where: { ...cw, status: { not: "paid" } } }),
      prisma.product.count({ where: { stock: { lt: 10 } } }),
      prisma.manuscript.count({ where: { readyForPrint: true } }),
      prisma.royalty.count({ where: { status: "unpaid" } }),
      prisma.notification.count({ where: { read: false } }),
    ])

    return NextResponse.json({
      orderCount,
      totalRevenue:      Number(revenueAgg._sum.total ?? 0),
      activeWorkers,
      pendingInvoices,
      lowStockCount,
      printReadyCount,
      unpaidRoyaltyCount,
      unreadNotifs,
      updatedAt:         new Date().toISOString(),
    })

  } catch (err) {
    console.error("[GET /api/dashboard/stats]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
