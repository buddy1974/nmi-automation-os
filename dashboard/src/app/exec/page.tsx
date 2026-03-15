import styles from "./page.module.css";

const cards = [
  {
    title: "Orders Today",
    value: 12,
    description: "New orders received today",
  },
  {
    title: "Open Invoices",
    value: 34,
    description: "Invoices pending payment",
  },
  {
    title: "Stock Alerts",
    value: 5,
    description: "Items below minimum threshold",
  },
  {
    title: "Receivables Overdue",
    value: 8,
    description: "Payments past due date",
  },
  {
    title: "Print Jobs",
    value: 3,
    description: "Jobs queued for printing",
  },
  {
    title: "Branch Status",
    value: "OK",
    description: "All branches operational",
  },
];

export default function ExecPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Exec Dashboard</h1>
      <div className={styles.grid}>
        {cards.map((card) => (
          <div key={card.title} className={styles.card}>
            <span className={styles.title}>{card.title}</span>
            <span className={styles.value}>{card.value}</span>
            <span className={styles.description}>{card.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
