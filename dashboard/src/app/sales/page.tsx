import styles from "./page.module.css";

interface Order {
  id: number;
  customer: string;
  branch: string;
  date: string;
  status: string;
  total: number;
}

async function getOrders(): Promise<Order[]> {
  const res = await fetch("/api/orders", {
    cache: "no-store",
  });
  return res.json();
}

export default async function SalesPage() {
  const orders = await getOrders();

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Sales</h1>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Branch</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>#{order.id}</td>
                <td>{order.customer}</td>
                <td>{order.branch}</td>
                <td>{order.date}</td>
                <td>
                  <span className={`${styles.badge} ${styles[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td>{order.total.toLocaleString()} XAF</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
