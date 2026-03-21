"use client"

import Link        from "next/link"
import { usePathname } from "next/navigation"
import styles      from "./Sidebar.module.css"

const NAV_SECTIONS = [
  {
    label: "MAIN",
    items: [
      { label: "Office",    href: "/office"    },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Work OS",   href: "/work"      },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      { label: "Orders",       href: "/orders"       },
      { label: "Sales",        href: "/sales"        },
      { label: "Customers",    href: "/customers"    },
      { label: "Invoices",     href: "/invoices"     },
      { label: "Stock",        href: "/stock"        },
      { label: "Distributors", href: "/distributors" },
      { label: "Finance",      href: "/finance"      },
      { label: "Accounting",   href: "/accounting"   },
      { label: "Royalties",    href: "/royalties"    },
    ],
  },
  {
    label: "PUBLISHING",
    items: [
      { label: "Catalogue",  href: "/catalogue"  },
      { label: "Editorial",  href: "/editorial"  },
      { label: "Manuscripts",href: "/manuscripts" },
      { label: "Authors",    href: "/authors"    },
      { label: "Printing",   href: "/printing"   },
    ],
  },
  {
    label: "HR",
    items: [
      { label: "HR",          href: "/hr"              },
      { label: "Evaluate",    href: "/hr/evaluate"     },
      { label: "Evaluations", href: "/hr/evaluations"  },
      { label: "Compensation",href: "/hr/compensation" },
    ],
  },
  {
    label: "INTELLIGENCE",
    items: [
      { label: "Agents",    href: "/agents"        },
      { label: "Briefing",  href: "/briefing"      },
      { label: "Knowledge", href: "/knowledge"     },
      { label: "Ask KB",    href: "/knowledge/ask" },
      { label: "AI",        href: "/ai"            },
    ],
  },
  {
    label: "AUTOMATION",
    items: [
      { label: "Automation", href: "/n8n"       },
      { label: "Email",      href: "/email"      },
      { label: "WhatsApp",   href: "/whatsapp"   },
    ],
  },
  {
    label: "ADMIN",
    items: [
      { label: "Setup",         href: "/admin/setup"   },
      { label: "Import",        href: "/import"        },
      { label: "System",        href: "/system"        },
      { label: "Notifications", href: "/notifications" },
      { label: "Owner",         href: "/owner"         },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className={styles.sidebar}>

      <div className={styles.brand}>
        <img src="/logo-nmi.png" alt="NMI logo" />
        <span className={styles.brandTitle}>NMI Automation OS</span>
      </div>

      <nav className={styles.nav}>
        {NAV_SECTIONS.map(section => (
          <div key={section.label} className={styles.section}>
            <div className={styles.sectionLabel}>{section.label}</div>
            <ul className={styles.sectionList}>
              {section.items.map(({ label, href }) => {
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
        ))}
      </nav>

    </div>
  )
}
