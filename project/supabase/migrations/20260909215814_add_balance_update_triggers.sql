/*
# Add UPDATE triggers for balance management

## Overview
The existing triggers only handle INSERT and DELETE on income_logs, expense_logs, and transfers.
This migration adds UPDATE triggers so that when an entry is edited (amount, account, or date changed),
the account balances are correctly adjusted.

## Changes
1. New trigger functions:
   - handle_income_update: reverses old account credit, applies new account credit
   - handle_expense_update: reverses old account debit, applies new account debit
   - handle_transfer_update: reverses old transfer (from/to), applies new transfer (from/to)
2. New triggers:
   - after_income_update, after_expense_update, after_transfer_update
3. All functions use OLD/NEW comparison to handle account or amount changes correctly.

## Security
- No RLS policy changes needed (UPDATE policies already exist on all three tables).
- No new tables or columns.

## Important notes
1. Each UPDATE trigger reverses the OLD row's balance effect first, then applies the NEW row's effect.
2. If the account_id changed, the old account is reversed and the new account is adjusted.
3. If only the amount changed, the same account gets the net difference.
*/

-- Income UPDATE: reverse old, apply new
CREATE OR REPLACE FUNCTION handle_income_update() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
  END IF;
  IF NEW.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Expense UPDATE: reverse old debit, apply new debit
CREATE OR REPLACE FUNCTION handle_expense_update() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
  END IF;
  IF NEW.account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Transfer UPDATE: reverse old transfer, apply new transfer
CREATE OR REPLACE FUNCTION handle_transfer_update() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.from_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + OLD.amount WHERE id = OLD.from_account_id;
  END IF;
  IF OLD.to_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - OLD.amount WHERE id = OLD.to_account_id;
  END IF;
  IF NEW.from_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.from_account_id;
  END IF;
  IF NEW.to_account_id IS NOT NULL THEN
    UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.to_account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS after_income_update ON income_logs;
CREATE TRIGGER after_income_update AFTER UPDATE ON income_logs FOR EACH ROW EXECUTE FUNCTION handle_income_update();

DROP TRIGGER IF EXISTS after_expense_update ON expense_logs;
CREATE TRIGGER after_expense_update AFTER UPDATE ON expense_logs FOR EACH ROW EXECUTE FUNCTION handle_expense_update();

DROP TRIGGER IF EXISTS after_transfer_update ON transfers;
CREATE TRIGGER after_transfer_update AFTER UPDATE ON transfers FOR EACH ROW EXECUTE FUNCTION handle_transfer_update();
