// static logo fix
import Link from "next/link"

export default function Sidebar() {
  return (
    <div
      style={{
        width: 220,
        background: "#111",
        color: "#fff",
        padding: 20,
        minHeight: "100vh"
      }}
    >
      <div style={{
        padding: "10px",
        textAlign: "center"
      }}>
        <img
          src="/logo-nmi.png"
          alt="logo"
          style={{
            width: 90,
            height: "auto",
            objectFit: "contain",
            display: "block",
            margin: "0 auto"
          }}
        />
      </div>

      <hr />

      <div>Dashboard</div>
      <div>Sales</div>
      <div>Stock</div>
      <div>Finance</div>
      <div>HR</div>
      <div>Editorial</div>
      <div>System</div>
      <div><Link href="/catalogue" style={{ color: "#fff" }}>Catalogue</Link></div>
    </div>
  );
}
