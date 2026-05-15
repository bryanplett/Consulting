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
  async function decrementInventoryForOrder(order) {
    const sb = getSb();
    if (!sb) return { ok: false, error: 'Supabase client not available' };
    try {
      const { data: fresh, error: fetchErr } = await sb.from('orders')
        .select('id, product, item, quantity, qty, inventory_applied')
        .eq('id', order.id).single();
      if (fetchErr) return { ok: false, error: fetchErr.message };
      if (fresh.inventory_applied) return { ok: true, alreadyApplied: true };

      const productLabel = fresh.product || fresh.item || order.product || order.item || '';
      const qty = parseInt(fresh.quantity ?? fresh.qty ?? order.quantity ?? order.qty ?? 1, 10) || 1;
      const name = canonicalProductName(productLabel);
      if (!name) return { ok: false, error: 'No product name on order.' };

      const { data: inv } = await sb.from('inventory')
        .select('stock').eq('product_name', name).maybeSingle();
      const current = inv?.stock ?? 0;
      const next = current - qty;

      const { error: upErr } = await sb.from('inventory').upsert(
        { product_name: name, stock: next, updated_at: new Date().toISOString() },
        { onConflict: 'product_name' }
      );
      if (upErr) return { ok: false, error: upErr.message };

      const { error: flagErr } = await sb.from('orders')
        .update({ inventory_applied: true }).eq('id', order.id);
      if (flagErr && !/column .* does not exist/i.test(flagErr.message)) {
        return { ok: false, error: flagErr.message };
      }
      return { ok: true, name, qty, newStock: next };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  }

  // ── Restock: reverse a previous decrement. Used when an order is cancelled.
  // Only runs if inventory_applied=true; otherwise no-op (already-pending order
  // never decremented the count, nothing to put back).
  async function restockInventoryForOrder(order) {
    const sb = getSb();
    if (!sb) return { ok: false, error: 'Supabase client not available' };
    try {
      const { data: fresh, error: fetchErr } = await sb.from('orders')
        .select('id, product, item, quantity, qty, inventory_applied')
        .eq('id', order.id).single();
      if (fetchErr) return { ok: false, error: fetchErr.message };
      if (!fresh.inventory_applied) return { ok: true, notApplied: true };

      const productLabel = fresh.product || fresh.item || order.product || order.item || '';
      const qty = parseInt(fresh.quantity ?? fresh.qty ?? order.quantity ?? order.qty ?? 1, 10) || 1;
      const name = canonicalProductName(productLabel);
      if (!name) return { ok: false, error: 'No product name on order.' };

      const { data: inv } = await sb.from('inventory')
        .select('stock').eq('product_name', name).maybeSingle();
      const current = inv?.stock ?? 0;
      const next = current + qty;

      const { error: upErr } = await sb.from('inventory').upsert(
        { product_name: name, stock: next, updated_at: new Date().toISOString() },
        { onConflict: 'product_name' }
      );
      if (upErr) return { ok: false, error: upErr.message };

      const { error: flagErr } = await sb.from('orders')
        .update({ inventory_applied: false }).eq('id', order.id);
      if (flagErr && !/column .* does not exist/i.test(flagErr.message)) {
        return { ok: false, error: flagErr.message };
      }
      return { ok: true, name, qty, newStock: next };
    } catch (err) {
      return { ok: false, error: err.message || String(err) };
    }
  }

  window.canonicalProductName       = canonicalProductName;
  window.decrementInventoryForOrder = decrementInventoryForOrder;
  window.restockInventoryForOrder   = restockInventoryForOrder;
})();
