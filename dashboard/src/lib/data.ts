// NMI Automation OS — Mock Data Layer
// Simulates database using schema.sql structure.
// Replace with real DB queries when Supabase is connected.

// ── BRANCHES ─────────────────────────────────────────────────
export const branches = [
  { id: 1, name: "Yaounde Central", city: "Yaounde",   region: "Center"   },
  { id: 2, name: "Douala North",    city: "Douala",    region: "Littoral" },
  { id: 3, name: "Bafoussam",       city: "Bafoussam", region: "West"     },
];

// ── CUSTOMERS ────────────────────────────────────────────────
export const customers = [
  { id: 1, name: "Lycee de Yaounde",       region: "Center",   credit_limit: 15000, status: "active"   },
  { id: 2, name: "College Saint Paul",     region: "Center",   credit_limit: 10000, status: "active"   },
  { id: 3, name: "Ecole Bilingue Douala",  region: "Littoral", credit_limit: 8000,  status: "active"   },
  { id: 4, name: "Institut Bafoussam",     region: "West",     credit_limit: 12000, status: "active"   },
  { id: 5, name: "CES Ngaoundere",         region: "Adamawa",  credit_limit: 5000,  status: "active"   },
  { id: 6, name: "Lycee de Garoua",        region: "North",    credit_limit: 7500,  status: "inactive" },
];

// ── STOCK ────────────────────────────────────────────────────
// Items with qty < 10 trigger stock alerts (5 items below threshold)
export const stock = [
  { id: 1,  title_code: "MATH-6", branch_id: 1, qty: 50 },
  { id: 2,  title_code: "MATH-6", branch_id: 2, qty: 30 },
  { id: 3,  title_code: "FR-6",   branch_id: 1, qty: 8  }, // alert
  { id: 4,  title_code: "FR-6",   branch_id: 2, qty: 25 },
  { id: 5,  title_code: "ENG-6",  branch_id: 1, qty: 5  }, // alert
  { id: 6,  title_code: "ENG-6",  branch_id: 3, qty: 40 },
  { id: 7,  title_code: "SCI-7",  branch_id: 1, qty: 15 },
  { id: 8,  title_code: "SCI-7",  branch_id: 2, qty: 3  }, // alert
  { id: 9,  title_code: "HIST-7", branch_id: 1, qty: 20 },
  { id: 10, title_code: "HIST-7", branch_id: 3, qty: 9  }, // alert
  { id: 11, title_code: "GEO-8",  branch_id: 1, qty: 45 },
  { id: 12, title_code: "GEO-8",  branch_id: 2, qty: 6  }, // alert
  { id: 13, title_code: "CHEM-8", branch_id: 1, qty: 18 },
  { id: 14, title_code: "BIO-9",  branch_id: 3, qty: 22 },
  { id: 15, title_code: "PHY-9",  branch_id: 2, qty: 35 },
];

// ── ORDERS ───────────────────────────────────────────────────
// 12 orders dated today (2026-03-15), 3 older completed orders
export const orders = [
  { id: 1,  customer_id: 1, branch_id: 1, date: "2026-03-15", status: "open",      total: 1200 },
  { id: 2,  customer_id: 2, branch_id: 1, date: "2026-03-15", status: "open",      total: 850  },
  { id: 3,  customer_id: 3, branch_id: 2, date: "2026-03-15", status: "open",      total: 2300 },
  { id: 4,  customer_id: 4, branch_id: 3, date: "2026-03-15", status: "open",      total: 1750 },
  { id: 5,  customer_id: 5, branch_id: 1, date: "2026-03-15", status: "open",      total: 600  },
  { id: 6,  customer_id: 1, branch_id: 2, date: "2026-03-15", status: "open",      total: 980  },
  { id: 7,  customer_id: 2, branch_id: 3, date: "2026-03-15", status: "pending",   total: 1100 },
  { id: 8,  customer_id: 3, branch_id: 1, date: "2026-03-15", status: "pending",   total: 450  },
  { id: 9,  customer_id: 4, branch_id: 2, date: "2026-03-15", status: "open",      total: 3200 },
  { id: 10, customer_id: 5, branch_id: 1, date: "2026-03-15", status: "open",      total: 720  },
  { id: 11, customer_id: 6, branch_id: 3, date: "2026-03-15", status: "pending",   total: 1500 },
  { id: 12, customer_id: 1, branch_id: 1, date: "2026-03-15", status: "open",      total: 890  },
  { id: 13, customer_id: 2, branch_id: 2, date: "2026-03-10", status: "completed", total: 1600 },
  { id: 14, customer_id: 3, branch_id: 1, date: "2026-03-08", status: "completed", total: 2100 },
  { id: 15, customer_id: 4, branch_id: 3, date: "2026-03-05", status: "completed", total: 900  },
];

// ── INVOICES ─────────────────────────────────────────────────
// 8 unpaid (receivables overdue), 4 open (not yet due), 3 paid
export const invoices = [
  { id: 1,  order_id: 13, amount: 1600, due_date: "2026-02-28", status: "unpaid" },
  { id: 2,  order_id: 14, amount: 2100, due_date: "2026-02-20", status: "unpaid" },
  { id: 3,  order_id: 15, amount: 900,  due_date: "2026-03-01", status: "unpaid" },
  { id: 4,  order_id: 13, amount: 500,  due_date: "2026-02-15", status: "unpaid" },
  { id: 5,  order_id: 14, amount: 750,  due_date: "2026-03-05", status: "unpaid" },
  { id: 6,  order_id: 15, amount: 300,  due_date: "2026-02-10", status: "unpaid" },
  { id: 7,  order_id: 13, amount: 1200, due_date: "2026-03-10", status: "unpaid" },
  { id: 8,  order_id: 14, amount: 850,  due_date: "2026-03-12", status: "unpaid" },
  { id: 9,  order_id: 1,  amount: 1200, due_date: "2026-04-01", status: "open"   },
  { id: 10, order_id: 2,  amount: 850,  due_date: "2026-04-01", status: "open"   },
  { id: 11, order_id: 3,  amount: 2300, due_date: "2026-04-15", status: "open"   },
  { id: 12, order_id: 4,  amount: 1750, due_date: "2026-04-15", status: "open"   },
  { id: 13, order_id: 5,  amount: 600,  due_date: "2026-03-01", status: "paid"   },
  { id: 14, order_id: 6,  amount: 980,  due_date: "2026-03-05", status: "paid"   },
  { id: 15, order_id: 7,  amount: 1100, due_date: "2026-03-10", status: "paid"   },
];
