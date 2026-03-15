-- NMI Automation OS — Phase 1 Schema
-- Plain SQL — no ORM

-- ============================================================
-- BRANCHES
-- ============================================================
CREATE TABLE branches (
  id        SERIAL PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  city      VARCHAR(100) NOT NULL,
  region    VARCHAR(100) NOT NULL
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  region       VARCHAR(100) NOT NULL,
  credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status       VARCHAR(20) NOT NULL DEFAULT 'active'
);

-- ============================================================
-- STOCK
-- ============================================================
CREATE TABLE stock (
  id          SERIAL PRIMARY KEY,
  title_code  VARCHAR(50)  NOT NULL,
  branch_id   INTEGER      NOT NULL REFERENCES branches(id),
  qty         INTEGER      NOT NULL DEFAULT 0
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER        NOT NULL REFERENCES customers(id),
  branch_id   INTEGER        NOT NULL REFERENCES branches(id),
  date        DATE           NOT NULL DEFAULT CURRENT_DATE,
  status      VARCHAR(20)    NOT NULL DEFAULT 'pending',
  total       NUMERIC(12, 2) NOT NULL DEFAULT 0
);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id        SERIAL PRIMARY KEY,
  order_id  INTEGER        NOT NULL REFERENCES orders(id),
  amount    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  due_date  DATE           NOT NULL,
  status    VARCHAR(20)    NOT NULL DEFAULT 'unpaid'
);
