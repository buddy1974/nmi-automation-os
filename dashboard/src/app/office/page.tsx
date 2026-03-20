import { cookies }       from "next/headers"
import { redirect }      from "next/navigation"
import { getSession }    from "@/lib/auth"
import { isGoogleConnected } from "@/lib/google"
import OfficeClient      from "./OfficeClient"

const ALLOWED = ["owner", "admin"]

export default async function OfficePage() {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)
  if (!session || !ALLOWED.includes(session.role)) redirect("/dashboard")

  const connected = await isGoogleConnected(session.id)

  return <OfficeClient connected={connected} userName={session.name} />
}
