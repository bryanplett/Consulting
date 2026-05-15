-- ─────────────────────────────────────────────────────────────────────────────
-- PeakForm Bio — Inventory mutation RPC functions
-- Run this in Supabase SQL editor (or psql) once.
--
-- Updated 2026-05-15: the orders table in this project uses ONLY (product,
-- quantity) columns, not the legacy (item, qty). The earlier draft of this
-- migration referenced `item` via COALESCE, which threw "column item does
-- not exist" at runtime and silently aborted inventory updates.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION apply_order_to_inventory(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order        RECORD;
  v_product_name text;
  v_qty          int;
BEGIN
  SELECT id, product, quantity, inventory_applied, client_id
    INTO v_order
    FROM orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order not found');
  END IF;

  -- Ownership check: only the order's client (or admin) can apply.
  IF auth.uid() IS DISTINCT FROM v_order.client_id
     AND COALESCE(auth.email(), '') <> 'bryanplett@gmail.com' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF v_order.inventory_applied THEN
    RETURN jsonb_build_object('ok', true, 'alreadyApplied', true);
  END IF;

  v_product_name := regexp_replace(v_order.product, '\s+—\s+\$[0-9,.]+\s*$', '');
  v_qty := COALESCE(v_order.quantity, 1)::int;

  INSERT INTO inventory (product_name, stock, updated_at)
    VALUES (v_product_name, -v_qty, now())
  ON CONFLICT (product_name) DO UPDATE
    SET stock      = inventory.stock - v_qty,
        updated_at = now();

  UPDATE orders SET inventory_applied = true WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'product_name', v_product_name,
    'qty', v_qty
  );
END;
$$;

GRANT EXECUTE ON FUNCTION apply_order_to_inventory(uuid) TO authenticated;


CREATE OR REPLACE FUNCTION revert_order_from_inventory(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order        RECORD;
  v_product_name text;
  v_qty          int;
BEGIN
  SELECT id, product, quantity, inventory_applied, client_id
    INTO v_order
    FROM orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order not found');
  END IF;

  -- Restock is admin-only.
  IF COALESCE(auth.email(), '') <> 'bryanplett@gmail.com' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF NOT v_order.inventory_applied THEN
    RETURN jsonb_build_object('ok', true, 'notApplied', true);
  END IF;

  v_product_name := regexp_replace(v_order.product, '\s+—\s+\$[0-9,.]+\s*$', '');
  v_qty := COALESCE(v_order.quantity, 1)::int;

  UPDATE inventory
     SET stock = stock + v_qty, updated_at = now()
   WHERE product_name = v_product_name;

  UPDATE orders SET inventory_applied = false WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'ok', true,
    'product_name', v_product_name,
    'qty', v_qty
  );
END;
$$;

GRANT EXECUTE ON FUNCTION revert_order_from_inventory(uuid) TO authenticated;
