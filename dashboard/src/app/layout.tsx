import "./globals.css";
import { cookies }    from "next/headers"
import { getSession } from "@/lib/auth"
import Sidebar     from "./components/Sidebar";
import Header      from "./components/Header";
import ChatWidget  from "./components/ChatWidget";

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
      <body>
        <div style={{ display: "flex", height: "100vh" }}>

          <Sidebar />

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

            <Header />

            <main style={{ flex: 1, padding: 20, overflowY: "auto" }}>
              {children}
            </main>

          </div>

        </div>

        <ChatWidget />
      </body>
    </html>
  )
}
