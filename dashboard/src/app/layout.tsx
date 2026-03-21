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
          <footer style={{
            textAlign:   "center",
            fontSize:    "11px",
            color:       "#94a3b8",
            padding:     "16px",
            borderTop:   "1px solid #e2e8f0",
            marginTop:   "auto",
          }}>
            NMI Automation OS · Developed by{" "}
            <a href="https://maxpromo.digital" target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>maxpromo.digital</a>
          </footer>
        </LayoutShell>
        <ChatWidget />
        <OnboardingTour />
        <CommandPalette />
      </body>
    </html>
  )
}
