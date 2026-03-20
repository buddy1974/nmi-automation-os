"use client"

import Link        from "next/link"
import { usePathname } from "next/navigation"
import styles      from "./Sidebar.module.css"

const NAV = [
  { label: "Dashboard",    href: "/dashboard"    },
  { label: "Briefing",     href: "/briefing"     },
  { label: "Work OS",      href: "/work"         },
  { label: "Orders",       href: "/orders"       },
  { label: "Sales",      href: "/sales"      },
  { label: "Customers",  href: "/customers"  },
  { label: "Invoices",   href: "/invoices"   },
  { label: "Stock",      href: "/stock"      },
  { label: "Catalogue",    href: "/catalogue"    },
  { label: "Distributors",href: "/distributors" },
  { label: "Finance",      href: "/finance"      },
  { label: "Accounting", href: "/accounting" },
  { label: "Royalties",  href: "/royalties"  },
  { label: "HR",           href: "/hr"              },
  { label: "Evaluate",      href: "/hr/evaluate"      },
  { label: "Evaluations",   href: "/hr/evaluations"   },
  { label: "Compensation",  href: "/hr/compensation"  },
  { label: "Editorial",  href: "/editorial"  },
  { label: "Manuscripts",href: "/manuscripts"},
  { label: "Authors",    href: "/authors"    },
  { label: "Printing",   href: "/printing"   },
  { label: "System",        href: "/system"        },
  { label: "Notifications", href: "/notifications" },
  { label: "Email",         href: "/email"         },
  { label: "Automation",    href: "/n8n"           },
  { label: "WhatsApp",      href: "/whatsapp"      },
  { label: "Knowledge",     href: "/knowledge"     },
  { label: "Ask KB",        href: "/knowledge/ask" },
  { label: "Owner",         href: "/owner"         },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className={styles.sidebar}>

      <div className={styles.brand}>
        <img src="/logo-nmi.png" alt="NMI logo" />
        <span className={styles.brandTitle}>NMI Automation OS</span>
      </div>

      <ul className={styles.nav}>
        {NAV.map(({ label, href }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href)

          return (
            <li key={href}>
              <Link
                href={href}
                className={`${styles.link}${isActive ? ` ${styles.active}` : ""}`}
              >
                {label}
              </Link>
            </li>
          )
        })}
      </ul>

    </div>
  )
}
