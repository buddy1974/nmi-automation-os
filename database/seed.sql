-- NMI Automation OS — Seed Data
-- Phase 12 — Sample rows for development / testing
-- Run AFTER schema.sql

-- ============================================================
-- BRANCHES
-- ============================================================
INSERT INTO branches (name, city, region) VALUES
  ('Head Office', 'Yaoundé', 'Centre'),
  ('Douala Branch', 'Douala', 'Littoral');

-- ============================================================
-- PRODUCTS
-- ============================================================
INSERT INTO products (code, title, level, class, subject, author, royalty_type, royalty_value, price, stock) VALUES
  ('P-ENG-1',  'English, Class 1',       'Primary', 'Primary 1', 'English',     'Unknown', 'percent', 10, 2500, 50),
  ('P-ENG-2',  'English, Class 2',       'Primary', 'Primary 2', 'English',     'Unknown', 'percent', 10, 2500, 40),
  ('P-FR-1',   'French, Class 1',        'Primary', 'Primary 1', 'French',      'Unknown', 'percent', 10, 2500, 30),
  ('P-MATH-1', 'Mathematics, Class 1',   'Primary', 'Primary 1', 'Mathematics', 'Unknown', 'percent', 10, 2500, 20),
  ('P-MATH-2', 'Mathematics, Class 2',   'Primary', 'Primary 2', 'Mathematics', 'Unknown', 'percent', 10, 2500, 0 ),
  ('P-SCI-3',  'Sciences, Class 3',      'Primary', 'Primary 3', 'Sciences and Technology', 'Unknown', 'percent', 10, 2500, 8);

-- ============================================================
-- CUSTOMERS
-- ============================================================
INSERT INTO customers (name, phone, address, type) VALUES
  ('School A', '699000001', 'Yaoundé, Centre', 'school'),
  ('Bookshop B', '699000002', 'Douala, Littoral', 'bookshop'),
  ('Parent C', '699000003', 'Bafoussam, Ouest', 'individual');

-- ============================================================
-- AUTHORS
-- ============================================================
INSERT INTO authors (name, phone, email) VALUES
  ('Author A', '699100001', 'authora@nmi.cm'),
  ('Author B', '699100002', 'authorb@nmi.cm'),
  ('Author C', '699100003', 'authorc@nmi.cm');
