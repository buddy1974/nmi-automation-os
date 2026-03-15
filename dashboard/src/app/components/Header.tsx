// rebuild ui
export default function Header() {
  return (
    <div
      style={{
        height: 60,
        borderBottom: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 700 }}>
        NMI Automation OS
      </div>

      <div>
        admin | logout
      </div>
    </div>
  );
}
