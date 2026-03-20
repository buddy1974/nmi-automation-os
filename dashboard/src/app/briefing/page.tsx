import { cookies }    from "next/headers"
import { redirect }   from "next/navigation"
import { getSession } from "@/lib/auth"
import BriefingClient from "./BriefingClient"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "CEO Briefing — NMI Automation OS" }

const ALLOWED = ["owner", "admin"]

export default async function BriefingPage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  return <BriefingClient />
}
