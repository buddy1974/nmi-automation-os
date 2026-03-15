"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const links = [
  { href: "/exec",      label: "Exec" },
  { href: "/sales",     label: "Sales" },
  { href: "/stock",     label: "Stock" },
  { href: "/finance",   label: "Finance" },
  { href: "/editorial", label: "Editorial" },
  { href: "/hr",        label: "HR" },
  { href: "/system",    label: "System" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>NMI OS</div>
      <nav>
        <ul className={styles.nav}>
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.link} ${pathname === href ? styles.active : ""}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
