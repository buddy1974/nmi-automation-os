import { cookies }    from "next/headers"
import { prisma }     from "@/lib/db"
import { getSession } from "@/lib/auth"
import { resolveCompany, directFilter } from "@/lib/companyFilter"
import EvalForm       from "./EvalForm"

export const dynamic = "force-dynamic"

export default async function EvaluatePage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  const cid     = session ? resolveCompany(session, jar.get("nmi_company")?.value) : undefined

  const workers = await prisma.worker.findMany({
    where:   directFilter(cid),
    select:  { id: true, name: true, department: true, role: true },
    orderBy: { name: "asc" },
  })

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", margin: 0 }}>HR Evaluation Engine</h1>
        <p style={{ color: "#6b7280", marginTop: 6, fontSize: 14 }}>
          Score employees across Scrum values, task performance, and behavioral metrics. AI generates a summary and recommendation.
        </p>
      </div>

      <EvalForm workers={workers} />
    </div>
  )
}
