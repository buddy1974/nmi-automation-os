// logo render fix
import Image from "next/image";

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
        <Image
          src="/logo.png"
          alt="logo"
          width={140}
          height={140}
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
