import styles from "./page.module.css";
import { orders, customers, branches } from "@/lib/data";

export default function SalesPage() {
  const enriched = orders.map((order) => ({
    ...order,
    customer: customers.find((c) => c.id === order.customer_id)?.name ?? "Unknown",
    branch:   branches.find((b) => b.id === order.branch_id)?.name   ?? "Unknown",
  }));

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
            {enriched.map((order) => (
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
