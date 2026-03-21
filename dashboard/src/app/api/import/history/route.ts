import { NextResponse }      from "next/server"
import { requireAuth }        from "@/lib/api-auth"
import { prisma }             from "@/lib/db"

export async function GET() {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const logs = await prisma.importLog.findMany({
    where:   auth.companyId ? { companyId: auth.companyId } : {},
    orderBy: { createdAt: "desc" },
    take:    50,
  })

  return NextResponse.json(logs)
}
