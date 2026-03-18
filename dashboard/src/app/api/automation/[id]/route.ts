import { NextResponse }  from "next/server"
import { prisma }        from "@/lib/db"
import { requireAuth }   from "@/lib/api-auth"
import { runJob }        from "@/lib/automation"

// ── PATCH /api/automation/[id] — execute a job ────────────────────────────────

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {

  const auth = await requireAuth()
  if (auth instanceof NextResponse) return auth

  if (auth.role !== "admin" && auth.role !== "manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id: idStr } = await params
  const id = Number(idStr)
  if (!id) return NextResponse.json({ error: "Invalid job id" }, { status: 400 })

  const job = await prisma.automationJob.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 })

  if (job.status === "running") {
    return NextResponse.json({ error: "Job is already running" }, { status: 409 })
  }

  // Mark as running
  await prisma.automationJob.update({
    where: { id },
    data:  { status: "running" },
  })

  try {
    const result = await runJob(job)

    const updated = await prisma.automationJob.update({
      where: { id },
      data:  { status: "done", result: result as object },
    })

    return NextResponse.json(updated)

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error"

    const updated = await prisma.automationJob.update({
      where: { id },
      data:  { status: "failed", result: { error: message } as object },
    })

    return NextResponse.json(updated, { status: 500 })
  }
}
