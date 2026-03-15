import styles from "./page.module.css";

interface ExecData {
  ordersToday: number;
  openInvoices: number;
  stockAlerts: number;
  receivables: number;
  printJobs: number;
  branchStatus: string;
}

async function getExecData(): Promise<ExecData> {
  const res = await fetch("http://localhost:3000/api/exec", {
    cache: "no-store",
  });
  return res.json();
}

export default async function ExecPage() {
  const data = await getExecData();

  const cards = [
    {
      title: "Orders Today",
      value: data.ordersToday,
      description: "New orders received today",
    },
    {
      title: "Open Invoices",
      value: data.openInvoices,
      description: "Invoices pending payment",
    },
    {
      title: "Stock Alerts",
      value: data.stockAlerts,
      description: "Items below minimum threshold",
    },
    {
      title: "Receivables Overdue",
      value: data.receivables,
      description: "Payments past due date",
    },
    {
      title: "Print Jobs",
      value: data.printJobs,
      description: "Jobs queued for printing",
    },
    {
      title: "Branch Status",
      value: data.branchStatus,
      description: "All branches operational",
    },
  ];

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
