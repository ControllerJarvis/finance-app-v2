/*
# Finance By Usman Afzal - Initial Database Schema

## Overview
Creates the complete database schema for the personal finance management app.
This is a single-tenant app with no authentication - all data is shared/public.

## New Tables

### settings
- key (text, primary key) - setting name (e.g. 'currency')
- value (text) - setting value (e.g. 'Rs.')
- updated_at (timestamp) - last update time

### accounts
- id (uuid, primary key) - unique account ID
- name (text) - account name (e.g. "Bank Alfalah")
- balance (numeric) - current balance, defaults to 0
- is_preloaded (boolean) - whether it's a pre-loaded account
- sort_order (int) - display order
- created_at (timestamp) - creation time

### income_logs
- id (uuid, primary key) - unique income log ID
- account_id (uuid, FK to accounts) - which account received the income
- amount (numeric) - income amount
- date (date) - date of income
- comment (text) - purpose/comment
- created_at (timestamp) - creation time

### expense_logs
- id (uuid, primary key) - unique expense log ID
- account_id (uuid, FK to accounts) - source account
- amount (numeric) - expense amount
- date (date) - date of expense
- subcategory (text) - subcategory (Bills, Transportation, Food, etc.)
- main_category (text) - main budget category (Family, Emergency/Savings, Self-Usage, Charity, Worryless Spendings)
- comment (text) - description/comment
- created_at (timestamp) - creation time

### transfers
- id (uuid, primary key) - unique transfer ID
- from_account_id (uuid, FK to accounts) - source account
- to_account_id (uuid, FK to accounts) - destination account
- amount (numeric) - transfer amount
- date (date) - date of transfer
- comment (text) - purpose/comment
- created_at (timestamp) - creation time

## Security
- RLS enabled on all tables
- Policies allow anon + authenticated full CRUD (single-tenant, no auth)
- USING (true) is acceptable because all data is intentionally shared

## Triggers
- After INSERT on income_logs: add amount to account balance
- After DELETE on income_logs: subtract amount from account balance
- After INSERT on expense_logs: subtract amount from account balance
- After DELETE on expense_logs: add amount back to account balance
- After INSERT on transfers: move amount from source to destination
- After DELETE on transfers: reverse the transfer

## Pre-loaded Data
1. Default currency: "Rs." (PKR)
2. Six pre-loaded bank accounts with Rs. 0 balance:
   Bank Alfalah, Easypaisa, JazzCash, Mashreq Islamic, SadaPay, Company Bank (Meezan Bank)
*/

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  balance numeric(15,2) NOT NULL DEFAULT 0,
  is_preloaded boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Income logs table
CREATE TABLE IF NOT EXISTS income_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  amount numeric(15,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Expense logs table
CREATE TABLE IF NOT EXISTS expense_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  amount numeric(15,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  subcategory text NOT NULL,
  main_category text NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Transfers table
CREATE TABLE IF NOT EXISTS transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  to_account_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  amount numeric(15,2) NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Policies for settings (single-tenant, anon + authenticated)
DROP POLICY IF EXISTS "anon_select_settings" ON settings;
CREATE POLICY "anon_select_settings" ON settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_settings" ON settings;
CREATE POLICY "anon_insert_settings" ON settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_settings" ON settings;
CREATE POLICY "anon_update_settings" ON settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_settings" ON settings;
CREATE POLICY "anon_delete_settings" ON settings FOR DELETE TO anon, authenticated USING (true);

-- Policies for accounts
DROP POLICY IF EXISTS "anon_select_accounts" ON accounts;
CREATE POLICY "anon_select_accounts" ON accounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_accounts" ON accounts;
CREATE POLICY "anon_insert_accounts" ON accounts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_accounts" ON accounts;
CREATE POLICY "anon_update_accounts" ON accounts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_accounts" ON accounts;
CREATE POLICY "anon_delete_accounts" ON accounts FOR DELETE TO anon, authenticated USING (true);

-- Policies for income_logs
DROP POLICY IF EXISTS "anon_select_income" ON income_logs;
CREATE POLICY "anon_select_income" ON income_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_income" ON income_logs;
CREATE POLICY "anon_insert_income" ON income_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_income" ON income_logs;
CREATE POLICY "anon_update_income" ON income_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_income" ON income_logs;
CREATE POLICY "anon_delete_income" ON income_logs FOR DELETE TO anon, authenticated USING (true);

-- Policies for expense_logs
DROP POLICY IF EXISTS "anon_select_expense" ON expense_logs;
CREATE POLICY "anon_select_expense" ON expense_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_expense" ON expense_logs;
CREATE POLICY "anon_insert_expense" ON expense_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_expense" ON expense_logs;
CREATE POLICY "anon_update_expense" ON expense_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_expense" ON expense_logs;
CREATE POLICY "anon_delete_expense" ON expense_logs FOR DELETE TO anon, authenticated USING (true);

-- Policies for transfers
DROP POLICY IF EXISTS "anon_select_transfers" ON transfers;
CREATE POLICY "anon_select_transfers" ON transfers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_transfers" ON transfers;
CREATE POLICY "anon_insert_transfers" ON transfers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_transfers" ON transfers;
CREATE POLICY "anon_update_transfers" ON transfers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_transfers" ON transfers;
CREATE POLICY "anon_delete_transfers" ON transfers FOR DELETE TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_income_logs_account_id ON income_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_income_logs_date ON income_logs(date);
CREATE INDEX IF NOT EXISTS idx_expense_logs_account_id ON expense_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_expense_logs_date ON expense_logs(date);
CREATE INDEX IF NOT EXISTS idx_expense_logs_main_category ON expense_logs(main_category);
CREATE INDEX IF NOT EXISTS idx_transfers_from_account_id ON transfers(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to_account_id ON transfers(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date ON transfers(date);

-- Trigger functions for balance management
CREATE OR REPLACE FUNCTION handle_income_insert() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_income_delete() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_expense_insert() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_expense_delete() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_transfer_insert() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.from_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.from_account_id;
  END IF;
  IF NEW.to_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_transfer_delete() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.from_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.from_account_id;
  END IF;
  IF OLD.to_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS after_income_insert ON income_logs;
CREATE TRIGGER after_income_insert AFTER INSERT ON income_logs FOR EACH ROW EXECUTE FUNCTION handle_income_insert();

DROP TRIGGER IF EXISTS after_income_delete ON income_logs;
CREATE TRIGGER after_income_delete AFTER DELETE ON income_logs FOR EACH ROW EXECUTE FUNCTION handle_income_delete();

DROP TRIGGER IF EXISTS after_expense_insert ON expense_logs;
CREATE TRIGGER after_expense_insert AFTER INSERT ON expense_logs FOR EACH ROW EXECUTE FUNCTION handle_expense_insert();

DROP TRIGGER IF EXISTS after_expense_delete ON expense_logs;
CREATE TRIGGER after_expense_delete AFTER DELETE ON expense_logs FOR EACH ROW EXECUTE FUNCTION handle_expense_delete();

DROP TRIGGER IF EXISTS after_transfer_insert ON transfers;
CREATE TRIGGER after_transfer_insert AFTER INSERT ON transfers FOR EACH ROW EXECUTE FUNCTION handle_transfer_insert();

DROP TRIGGER IF EXISTS after_transfer_delete ON transfers;
CREATE TRIGGER after_transfer_delete AFTER DELETE ON transfers FOR EACH ROW EXECUTE FUNCTION handle_transfer_delete();

-- Insert default currency setting
INSERT INTO settings (key, value) VALUES ('currency', 'Rs.')
ON CONFLICT (key) DO NOTHING;

-- Insert 6 pre-loaded bank accounts (only if they don't already exist)
INSERT INTO accounts (name, balance, is_preloaded, sort_order)
SELECT 'Bank Alfalah', 0, true, 1
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'Bank Alfalah');

INSERT INTO accounts (name, balance, is_preloaded, sort_order)
SELECT 'Easypaisa', 0, true, 2
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'Easypaisa');

INSERT INTO accounts (name, balance, is_preloaded, sort_order)
SELECT 'JazzCash', 0, true, 3
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'JazzCash');

INSERT INTO accounts (name, balance, is_preloaded, sort_order)
SELECT 'Mashreq Islamic', 0, true, 4
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'Mashreq Islamic');

INSERT INTO accounts (name, balance, is_preloaded, sort_order)
SELECT 'SadaPay', 0, true, 5
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'SadaPay');

INSERT INTO accounts (name, balance, is_preloaded, sort_order)
SELECT 'Company Bank (Meezan Bank)', 0, true, 6
WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE name = 'Company Bank (Meezan Bank)');
