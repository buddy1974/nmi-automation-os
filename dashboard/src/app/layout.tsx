import "./globals.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <div style={{ display: "flex", height: "100vh" }}>

          <Sidebar />

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

            <Header />

            <main style={{ flex: 1, padding: 20 }}>
              {children}
            </main>

          </div>

        </div>
      </body>
    </html>
  );
}
