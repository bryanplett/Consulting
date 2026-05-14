-- ─────────────────────────────────────────────────────────────────────────────
-- PeakForm Bio — Coupons + Inventory migration
-- Run this in Supabase SQL editor (or psql) once.
--
-- Adds:
--   1. `coupons` table   — admin-managed discount codes
--   2. `inventory` table — per-product stock counts
--   3. `orders.inventory_applied` column — guards against double-decrement
--      when an order's status is bounced in and out of "completed".
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Coupons -----------------------------------------------------------------
-- `kind`  : 'percent' (amount = 0–100, % off) | 'fixed' (amount = dollars off)
-- `scope` : 'all' (entire cart) | 'retatrutide' (only Retatrutide line items)
-- `code`  : stored lowercased; client portal lower-cases input before lookup.

CREATE TABLE IF NOT EXISTS coupons (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text        NOT NULL UNIQUE,
  kind        text        NOT NULL CHECK (kind  IN ('percent', 'fixed')),
  amount      numeric     NOT NULL CHECK (amount > 0),
  scope       text        NOT NULL CHECK (scope IN ('all', 'retatrutide')),
  active      boolean     NOT NULL DEFAULT true,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION coupons_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_coupons_touch ON coupons;
CREATE TRIGGER trg_coupons_touch
  BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION coupons_touch_updated_at();

-- RLS: anyone can READ active coupons (so the client portal can validate);
-- only the admin email can write.
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupons read active" ON coupons;
CREATE POLICY "coupons read active" ON coupons
  FOR SELECT USING (active = true OR auth.email() = 'bryanplett@gmail.com');

DROP POLICY IF EXISTS "coupons admin write" ON coupons;
CREATE POLICY "coupons admin write" ON coupons
  FOR ALL USING (auth.email() = 'bryanplett@gmail.com')
            WITH CHECK (auth.email() = 'bryanplett@gmail.com');

-- Seed the legacy "christi" code as a starting point. Admin can edit/delete.
-- Original behavior gave non-uniform discounts on Retatrutide 10/20/30;
-- closest single-rule equivalent is ~45% off Retatrutide products.
INSERT INTO coupons (code, kind, amount, scope, active, notes)
VALUES ('christi', 'percent', 45, 'retatrutide', true,
        'Migrated from hardcoded Retatrutide 10/20/30 special pricing.')
ON CONFLICT (code) DO NOTHING;


-- 2. Inventory ---------------------------------------------------------------
-- product_name is the canonical product name from pricelists.js (no price suffix).
-- Example keys: 'Retatrutide — 10mg', 'Tirzepatide — 20mg', 'Accessory Pack — 01'.

CREATE TABLE IF NOT EXISTS inventory (
  product_name text        PRIMARY KEY,
  stock        integer     NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION inventory_touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inventory_touch ON inventory;
CREATE TRIGGER trg_inventory_touch
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION inventory_touch_updated_at();

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Only admin can read/write inventory.
DROP POLICY IF EXISTS "inventory admin all" ON inventory;
CREATE POLICY "inventory admin all" ON inventory
  FOR ALL USING (auth.email() = 'bryanplett@gmail.com')
            WITH CHECK (auth.email() = 'bryanplett@gmail.com');


-- 3. Orders: track whether an order has already decremented inventory --------
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS inventory_applied boolean NOT NULL DEFAULT false;


-- ─────────────────────────────────────────────────────────────────────────────
-- DONE. Verify with:
--   SELECT * FROM coupons;
--   SELECT * FROM inventory;
--   SELECT column_name FROM information_schema.columns WHERE table_name='orders';
-- ─────────────────────────────────────────────────────────────────────────────
