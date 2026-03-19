"use server"

import { cookies } from "next/headers"

export async function switchCompanyAction(companyId: string): Promise<void> {
  const jar = await cookies()
  jar.set("nmi_company", companyId, {
    httpOnly: false,   // readable by client for UI state
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * 7,
    path:     "/",
  })
}
