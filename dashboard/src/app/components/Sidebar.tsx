// static logo fix
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
      <div
        style={{
          background: "#fff",
          padding: 6,
          marginBottom: 10
        }}
      >
        <img
          src="/logo-nmi.png"
          alt="logo"
          style={{
            width: 140,
            height: "auto",
            display: "block"
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
    </div>
  );
}
