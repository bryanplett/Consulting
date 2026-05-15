-- ─────────────────────────────────────────────────────────────────────────────
-- PeakForm Bio — Order Details migration
-- Run this in Supabase SQL editor (or psql) once, BEFORE deploying the matching
-- ClientPortal.html / Admin.html changes.
--
-- The checkout form was collecting payment method, shipping method, shipping
-- address, phone, and coupon code, but `orders.insert()` was only saving
-- (product, quantity, notes, status, client_id). Everything else was being
-- thrown away. This migration adds the missing columns; the code update
-- starts populating them.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method    text,
  ADD COLUMN IF NOT EXISTS shipping_method   text,
  ADD COLUMN IF NOT EXISTS shipping_address  text,
  ADD COLUMN IF NOT EXISTS shipping_cost     numeric(10,2),
  ADD COLUMN IF NOT EXISTS phone_at_order    text,
  ADD COLUMN IF NOT EXISTS coupon_code       text;

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE. Verify with:
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_name = 'orders'
--   ORDER BY ordinal_position;
-- ─────────────────────────────────────────────────────────────────────────────
