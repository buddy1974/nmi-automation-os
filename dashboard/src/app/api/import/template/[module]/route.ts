import { NextRequest, NextResponse } from "next/server"
import { requireAuth }               from "@/lib/api-auth"
import { buildCSVTemplate, MODULE_FIELDS } from "@/lib/importParser"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ module: string }> },
) {
  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  const { module } = await params

  if (!MODULE_FIELDS[module]) {
    return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 404 })
  }

  const csv = buildCSVTemplate(module)

  return new NextResponse(csv, {
    headers: {
      "Content-Type":        "text/csv",
      "Content-Disposition": `attachment; filename="nmi-${module}-template.csv"`,
    },
  })
}
