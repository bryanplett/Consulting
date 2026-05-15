-- ─────────────────────────────────────────────────────────────────────────────
-- PeakForm Bio — Inventory mutation RPC functions
-- Run this in Supabase SQL editor (or psql) once.
--
-- Why this exists:
--   The `inventory` table's RLS policy ("inventory admin all") restricts both
--   read and write to the single admin email. That was fine when only Admin.html
--   touched stock — but now the client portal needs to decrement on order
--   placement, and clients are NOT the admin email.
--
-- Rather than relax the RLS policy (which would let any authenticated client
-- arbitrarily set stock values), we expose two narrow SECURITY DEFINER
-- functions. They bypass RLS, but ONLY perform the well-defined mutations:
--
--   apply_order_to_inventory(order_id)    — decrement stock for an order
--   revert_order_from_inventory(order_id) — restock for a cancelled order
--
-- Both are idempotent via the `orders.inventory_applied` flag and both
-- check that the caller actually owns the order (or is admin).
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
  SELECT id,
         COALESCE(product, item)        AS product_label,
         COALESCE(quantity, qty, 1)::int AS quantity,
         inventory_applied,
         client_id
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

  v_product_name := regexp_replace(v_order.product_label, '\s+—\s+\$[0-9,.]+\s*$', '');
  v_qty := COALESCE(v_order.quantity, 1);

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
  SELECT id,
         COALESCE(product, item)        AS product_label,
         COALESCE(quantity, qty, 1)::int AS quantity,
         inventory_applied,
         client_id
    INTO v_order
    FROM orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'order not found');
  END IF;

  -- Restock is admin-only. Clients can't unilaterally roll back inventory.
  IF COALESCE(auth.email(), '') <> 'bryanplett@gmail.com' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF NOT v_order.inventory_applied THEN
    RETURN jsonb_build_object('ok', true, 'notApplied', true);
  END IF;

  v_product_name := regexp_replace(v_order.product_label, '\s+—\s+\$[0-9,.]+\s*$', '');
  v_qty := COALESCE(v_order.quantity, 1);

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

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE. Verify with:
--   SELECT proname, prosecdef FROM pg_proc
--    WHERE proname IN ('apply_order_to_inventory', 'revert_order_from_inventory');
--   -- Both should show prosecdef = true.
-- ─────────────────────────────────────────────────────────────────────────────
