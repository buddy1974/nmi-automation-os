-- NMI Automation OS — Full Schema
-- Phase 12 — Database Foundation
-- Plain SQL — no ORM — Postgres / Supabase compatible

-- ============================================================
-- BRANCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
  id      SERIAL PRIMARY KEY,
  name    VARCHAR(100) NOT NULL,
  city    VARCHAR(100) NOT NULL,
  region  VARCHAR(100) NOT NULL
);

-- ============================================================
-- PRODUCTS (books)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id             SERIAL PRIMARY KEY,
  code           VARCHAR(50)    NOT NULL UNIQUE,
  title          VARCHAR(200)   NOT NULL,
  level          VARCHAR(50)    NOT NULL DEFAULT 'Primary',
  class          VARCHAR(50)    NOT NULL DEFAULT '',
  subject        VARCHAR(100)   NOT NULL DEFAULT '',
  author         VARCHAR(150)   NOT NULL DEFAULT 'Unknown',
  royalty_type   VARCHAR(10)    NOT NULL DEFAULT 'percent' CHECK (royalty_type IN ('percent','fixed')),
  royalty_value  NUMERIC(10,2)  NOT NULL DEFAULT 10,
  price          NUMERIC(12,2)  NOT NULL DEFAULT 0,
  stock          INTEGER        NOT NULL DEFAULT 0
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150)   NOT NULL,
  phone        VARCHAR(30)    NOT NULL DEFAULT '',
  address      TEXT           NOT NULL DEFAULT '',
  type         VARCHAR(50)    NOT NULL DEFAULT 'individual',
  region       VARCHAR(100)   NOT NULL DEFAULT '',
  credit_limit NUMERIC(12,2)  NOT NULL DEFAULT 0,
  status       VARCHAR(20)    NOT NULL DEFAULT 'active'
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL PRIMARY KEY,
  number        VARCHAR(50)    NOT NULL UNIQUE,
  customer_id   INTEGER        REFERENCES customers(id),
  customer_name VARCHAR(150)   NOT NULL DEFAULT '',
  branch_id     INTEGER        REFERENCES branches(id),
  date          DATE           NOT NULL DEFAULT CURRENT_DATE,
  total         NUMERIC(12,2)  NOT NULL DEFAULT 0,
  status        VARCHAR(20)    NOT NULL DEFAULT 'pending'
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_code  VARCHAR(50)    NOT NULL,
  title         VARCHAR(200)   NOT NULL DEFAULT '',
  qty           INTEGER        NOT NULL DEFAULT 1,
  price         NUMERIC(12,2)  NOT NULL DEFAULT 0,
  line_total    NUMERIC(12,2)  GENERATED ALWAYS AS (qty * price) STORED
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER        NOT NULL REFERENCES orders(id),
  amount     NUMERIC(12,2)  NOT NULL DEFAULT 0,
  due_date   DATE           NOT NULL,
  status     VARCHAR(20)    NOT NULL DEFAULT 'unpaid'
);

-- ============================================================
-- AUTHORS
-- ============================================================
CREATE TABLE IF NOT EXISTS authors (
  id     SERIAL PRIMARY KEY,
  name   VARCHAR(150)  NOT NULL,
  phone  VARCHAR(30)   NOT NULL DEFAULT '',
  email  VARCHAR(150)  NOT NULL DEFAULT ''
);

-- ============================================================
-- ROYALTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS royalties (
  id        SERIAL PRIMARY KEY,
  author    VARCHAR(150)   NOT NULL,
  book      VARCHAR(200)   NOT NULL DEFAULT '',
  amount    NUMERIC(12,2)  NOT NULL DEFAULT 0,
  date      DATE           NOT NULL DEFAULT CURRENT_DATE,
  status    VARCHAR(20)    NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid'))
);

-- ============================================================
-- MANUSCRIPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS manuscripts (
  id               SERIAL PRIMARY KEY,
  title            VARCHAR(200)  NOT NULL,
  author           VARCHAR(150)  NOT NULL DEFAULT '',
  subject          VARCHAR(100)  NOT NULL DEFAULT '',
  level            VARCHAR(50)   NOT NULL DEFAULT 'Primary',
  class            VARCHAR(50)   NOT NULL DEFAULT '',
  status           VARCHAR(30)   NOT NULL DEFAULT 'submitted'
                     CHECK (status IN ('submitted','reviewing','editing','approved','rejected','ready_for_print','printing')),
  notes            TEXT          NOT NULL DEFAULT '',
  date             DATE          NOT NULL DEFAULT CURRENT_DATE,
  version          INTEGER       NOT NULL DEFAULT 1,
  editor           VARCHAR(150)  NOT NULL DEFAULT '',
  editor_notes     TEXT          NOT NULL DEFAULT '',
  approved         BOOLEAN       NOT NULL DEFAULT FALSE,
  ready_for_print  BOOLEAN       NOT NULL DEFAULT FALSE,
  suggested_code   VARCHAR(50)   NOT NULL DEFAULT '',
  ai_report        TEXT          NOT NULL DEFAULT '',
  ai_edit_report   TEXT          NOT NULL DEFAULT ''
);

-- ============================================================
-- MANUSCRIPT HISTORY (version log)
-- ============================================================
CREATE TABLE IF NOT EXISTS manuscript_history (
  id              SERIAL PRIMARY KEY,
  manuscript_id   INTEGER       NOT NULL REFERENCES manuscripts(id) ON DELETE CASCADE,
  version         INTEGER       NOT NULL,
  date            DATE          NOT NULL DEFAULT CURRENT_DATE,
  editor          VARCHAR(150)  NOT NULL DEFAULT '',
  notes           TEXT          NOT NULL DEFAULT ''
);

-- ============================================================
-- WORKERS (HR)
-- ============================================================
CREATE TABLE IF NOT EXISTS workers (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(150)   NOT NULL,
  national_id    VARCHAR(50)    NOT NULL DEFAULT '',
  cnps_number    VARCHAR(50)    NOT NULL DEFAULT '',
  phone          VARCHAR(30)    NOT NULL DEFAULT '',
  email          VARCHAR(150)   NOT NULL DEFAULT '',
  role           VARCHAR(100)   NOT NULL DEFAULT '',
  department     VARCHAR(100)   NOT NULL DEFAULT '',
  contract_type  VARCHAR(30)    NOT NULL DEFAULT 'CDI'
                   CHECK (contract_type IN ('CDI','CDD','Stage','Freelance','Consultant','Author','Printer','Temporary')),
  start_date     DATE,
  end_date       DATE,
  salary_base    NUMERIC(12,2)  NOT NULL DEFAULT 0,
  status         VARCHAR(20)    NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','inactive','suspended'))
);

-- ============================================================
-- PRINTING JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS printing_jobs (
  id        SERIAL PRIMARY KEY,
  book      VARCHAR(200)   NOT NULL,
  quantity  INTEGER        NOT NULL DEFAULT 0,
  cost      NUMERIC(12,2)  NOT NULL DEFAULT 0,
  printer   VARCHAR(150)   NOT NULL DEFAULT '',
  date      DATE           NOT NULL DEFAULT CURRENT_DATE,
  status    VARCHAR(20)    NOT NULL DEFAULT 'planned'
              CHECK (status IN ('planned','printing','printed','received','in_stock'))
);

-- ============================================================
-- STOCK (per branch)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock (
  id          SERIAL PRIMARY KEY,
  title_code  VARCHAR(50)  NOT NULL,
  branch_id   INTEGER      NOT NULL REFERENCES branches(id),
  qty         INTEGER      NOT NULL DEFAULT 0,
  UNIQUE (title_code, branch_id)
);

-- ============================================================
-- COST RECORDS (accounting)
-- ============================================================
CREATE TABLE IF NOT EXISTS cost_records (
  id      SERIAL PRIMARY KEY,
  book    VARCHAR(200)  NOT NULL DEFAULT '',
  type    VARCHAR(30)   NOT NULL DEFAULT 'other'
            CHECK (type IN ('printing','editing','cover','layout','transport','other')),
  amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  date    DATE          NOT NULL DEFAULT CURRENT_DATE,
  notes   TEXT          NOT NULL DEFAULT ''
);

-- ============================================================
-- PAYMENTS (HR payroll)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id      SERIAL PRIMARY KEY,
  worker  VARCHAR(150)  NOT NULL,
  type    VARCHAR(20)   NOT NULL DEFAULT 'salary'
            CHECK (type IN ('salary','bonus','royalty','freelance','allowance','deduction')),
  amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  date    DATE          NOT NULL DEFAULT CURRENT_DATE,
  notes   TEXT          NOT NULL DEFAULT ''
);
