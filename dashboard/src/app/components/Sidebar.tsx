export default function Sidebar() {
  return (
    <div
      style={{
        width: 220,
        background: "#111",
        color: "#fff",
        padding: 20,
      }}
    >
      <img src="/logo.png" width="140" />

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
