import "./globals.css";
import { cookies }    from "next/headers"
import { getSession } from "@/lib/auth"
import Sidebar     from "./components/Sidebar";
import Header      from "./components/Header";
import ChatWidget      from "./components/ChatWidget";
import LayoutShell     from "./components/LayoutShell";
import OnboardingTour  from "./components/OnboardingTour";
import CommandPalette  from "./components/CommandPalette";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar     = await cookies()
  const session = await getSession(jar.get("nmi_session")?.value)

  if (!session) {
    return (
      <html>
        <body style={{ margin: 0 }}>
          {children}
        </body>
      </html>
    )
  }

  return (
    <html>
      <body style={{ margin: 0 }}>
        <LayoutShell sidebar={<Sidebar />} header={<Header />}>
          {children}
        </LayoutShell>
        <ChatWidget />
        <OnboardingTour />
        <CommandPalette />
      </body>
    </html>
  )
}
