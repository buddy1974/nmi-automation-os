# NMI Automation OS — Database

## Engine

Postgres (via Supabase)

## Files

| File | Purpose |
|---|---|
| `schema.sql` | Full table definitions — run once to create DB |
| `seed.sql` | Sample data for development — run after schema |

## Tables

| Table | Purpose |
|---|---|
| `products` | Books catalogue — code, title, subject, class, author, royalty, price, stock |
| `customers` | Schools, bookshops, individuals |
| `orders` | Sales orders with customer link |
| `order_items` | Line items per order (product × qty × price) |
| `invoices` | Invoice per order |
| `authors` | Author registry |
| `royalties` | Royalty records per author per book |
| `manuscripts` | Full publishing workflow — submitted → ready_for_print |
| `manuscript_history` | Version log per manuscript |
| `workers` | HR registry — Cameroon Labour Code compliant |
| `printing_jobs` | Print runs — planned → in_stock |
| `stock` | Stock per branch |
| `cost_records` | Accounting cost entries per book |
| `payments` | HR payroll records |
| `branches` | Company locations |

## Status

- [x] Schema designed
- [x] Seed data prepared
- [x] DB client placeholder created (`dashboard/src/lib/db.ts`)
- [ ] Supabase project created
- [ ] Environment variables set
- [ ] Pages migrated to DB

## Next Step — Phase 12.2b

1. Create Supabase project at https://supabase.com
2. Run `schema.sql` in Supabase SQL editor
3. Run `seed.sql` in Supabase SQL editor
4. Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`
5. Uncomment Supabase client in `dashboard/src/lib/db.ts`
6. Install: `npm install @supabase/supabase-js`
7. Migrate `products` page first (Phase 12.3)

## Migration Order

```
12.3  products
12.4  customers
12.5  orders + order_items
12.6  manuscripts
12.7  authors
12.8  royalties
12.9  hr / workers
12.10 printing_jobs
```
