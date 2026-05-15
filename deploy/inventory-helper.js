// inventory-helper.js
// Shared inventory mutation helpers used by BOTH ClientPortal.html (decrement
// on order placement) and Admin.html (restock on cancellation).
//
// Load with a regular <script src="inventory-helper.js"></script> AFTER the
// Supabase client has been initialized and assigned to window.supabaseClient.
//
// Exposes on window:
//   canonicalProductName(label)           — strip trailing " — $price"
//   decrementInventoryForOrder(order)     — idempotent via orders.inventory_applied
//   restockInventoryForOrder(order)       — reverses a decrement; clears the flag
//
// Each function returns { ok, error, ... } — never throws. Callers should
// console.warn on failures so a flaky inventory write never blocks checkout
// or status changes.

(function () {
  function canonicalProductName(label) {
    if (!label) return '';
    return String(label).replace(/\s+—\s+\$[\d,.]+\s*$/, '').trim();
  }

  function getSb() {
    // Use whichever client was registered. ClientPortal.html assigns this
    // explicitly; Admin.html uses the same variable name.
    return window.supabaseClient || window.sb || null;
  }

  // ── Decrement stock for an order. Idempotent via inventory_applied flag.
  // Uses the SECURITY DEFINER RPC apply_order_to_inventory because direct
  // writes to `inventory` are blocked by RLS for non-admin users.
  async function decrementInventoryForOrder(order) {
    const sb = getSb();
    if (!sb) return { ok: false, error: 'Supabase client not available' };
    try {
      const { data, error } = await sb.rpc('apply_order_to_inventory', { p_order_id: order.id });
      if (error) return { ok: false, error: error.message };
      // Postgres function returns jsonb { ok, error?, ... }
      if (data && data.ok === false) return { ok: false, error: data.error || 'rpc rejected' };
      return { ok: true, ...(data || {}) };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  }

  // ── Restock: reverse a previous decrement. Admin-only via the RPC.
  async function restockInventoryForOrder(order) {
    const sb = getSb();
    if (!sb) return { ok: false, error: 'Supabase client not available' };
    try {
      const { data, error } = await sb.rpc('revert_order_from_inventory', { p_order_id: order.id });
      if (error) return { ok: false, error: error.message };
      if (data && data.ok === false) return { ok: false, error: data.error || 'rpc rejected' };
      return { ok: true, ...(data || {}) };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  }

  window.canonicalProductName       = canonicalProductName;
  window.decrementInventoryForOrder = decrementInventoryForOrder;
  window.restockInventoryForOrder   = restockInventoryForOrder;
})();
