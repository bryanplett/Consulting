// InventoryManager — admin UI to track stock counts per product.
//
// Inventory rows live in the `inventory` table keyed by `product_name`:
//   { product_name: 'Retatrutide — 10mg', stock: 12, updated_at: ... }
//
// Stock auto-decrements when an order's status is set to "completed" (handled
// in Admin.html's setOrderStatus / via the shared decrementInventoryForOrder
// helper). The admin can also adjust stock manually here at any time:
//   - Restock: add N units to the current stock
//   - Set:     overwrite stock to an exact number
//
// The product master list comes from pricelists.js (window.PRICELISTS). Every
// product in either pricelist gets a row in this UI even before it has any
// stock recorded — the row is created lazily when you first save a count.

const { useState: useInvState, useEffect: useInvEffect, useMemo: useInvMemo } = React;

// Build the canonical product list once: every product from every pricelist,
// deduped by name, grouped by category, in pricelist order.
function buildProductMaster() {
  const seen = new Set();
  const out = [];
  const lists = window.PRICELISTS || {};
  for (const key of Object.keys(lists)) {
    for (const p of lists[key].products || []) {
      if (seen.has(p.name)) continue;
      seen.add(p.name);
      out.push({ name: p.name, category: p.category || 'Other' });
    }
  }
  return out;
}

function InventoryManager({ sb, onBack }) {
  const [inventory, setInventory] = useInvState(null);   // null = loading; otherwise Map<name, stock>
  const [editing, setEditing] = useInvState(null);       // { name, mode: 'add'|'set', value: '' }
  const [filter, setFilter] = useInvState('all');
  const [query, setQuery] = useInvState('');
  const [msg, setMsg] = useInvState(null);

  const master = useInvMemo(buildProductMaster, []);
  const categories = useInvMemo(() => {
    const cats = new Set(master.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [master]);

  const load = async () => {
    setInventory(null);
    const { data, error } = await sb.from('inventory').select('*');
    if (error) {
      console.error('Failed to load inventory:', error);
      setInventory(new Map());
      return;
    }
    const m = new Map();
    for (const r of data || []) m.set(r.product_name, r.stock);
    setInventory(m);
  };

  useInvEffect(() => { load(); }, []);

  const filtered = useInvMemo(() => {
    const q = query.trim().toLowerCase();
    return master.filter(p => {
      if (filter !== 'all' && p.category !== filter) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [master, filter, query]);

  const grouped = useInvMemo(() => {
    const g = {};
    for (const p of filtered) {
      (g[p.category] ||= []).push(p);
    }
    return g;
  }, [filtered]);

  const startEdit = (name, mode) => {
    setEditing({ name, mode, value: mode === 'set' ? String(inventory.get(name) ?? 0) : '' });
    setMsg(null);
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    const raw = parseInt(editing.value, 10);
    if (!isFinite(raw)) return setMsg({ kind: 'err', text: 'Enter a whole number.' });
    if (editing.mode === 'add' && raw <= 0) return setMsg({ kind: 'err', text: 'Restock amount must be positive.' });
    if (editing.mode === 'set' && raw < 0) return setMsg({ kind: 'err', text: 'Stock cannot be negative when set manually.' });

    const current = inventory.get(editing.name);
    const newStock = editing.mode === 'add' ? (current ?? 0) + raw : raw;

    const { error } = await sb.from('inventory').upsert(
      { product_name: editing.name, stock: newStock, updated_at: new Date().toISOString() },
      { onConflict: 'product_name' }
    );
    if (error) return setMsg({ kind: 'err', text: error.message });

    // Optimistic local update
    const next = new Map(inventory);
    next.set(editing.name, newStock);
    setInventory(next);
    setEditing(null);
    setMsg({ kind: 'ok', text: editing.mode === 'add'
      ? `Restocked ${editing.name} (+${raw}, now ${newStock}).`
      : `${editing.name} set to ${newStock}.` });
  };

  if (inventory === null) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading inventory…</div>;
  }

  const totalProducts = master.length;
  const tracked = Array.from(inventory.values()).length;
  const outOfStock = master.filter(p => (inventory.get(p.name) ?? 0) <= 0 && inventory.has(p.name)).length;
  const lowStock = master.filter(p => {
    const s = inventory.get(p.name);
    return s !== undefined && s > 0 && s <= 3;
  }).length;

  return (
    <div className="fade-in">
      <button onClick={onBack} className="btn-ghost" style={{ marginBottom: 16, fontSize: 13 }}>← Back</button>

      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 6 }}>Inventory</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
          Stock decrements automatically when an order is marked <strong style={{ color: '#34c759' }}>completed</strong>.
          Tap <strong>Restock</strong> after a fresh shipment arrives, or <strong>Set</strong> to override the count.
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 22 }}>
        <StatCard label="Products" value={totalProducts} />
        <StatCard label="Tracked" value={tracked} sub={`${totalProducts - tracked} untracked`} />
        <StatCard label="Low stock" value={lowStock} tone={lowStock > 0 ? 'warn' : 'ok'} sub="≤ 3 units" />
        <StatCard label="Out of stock" value={outOfStock} tone={outOfStock > 0 ? 'err' : 'ok'} />
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13,
          background: msg.kind === 'ok' ? 'rgba(52,199,89,0.10)' : 'rgba(255,69,58,0.10)',
          border: `1px solid ${msg.kind === 'ok' ? 'rgba(52,199,89,0.30)' : 'rgba(255,69,58,0.30)'}`,
          color: msg.kind === 'ok' ? '#7be39a' : '#ff8a8a',
        }}>{msg.text}</div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="field-input" type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search products…"
          style={{ flex: '1 1 220px', maxWidth: 320 }} />
        <div className="filter-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} style={{
              padding: '6px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              background: filter === c ? '#2997ff' : 'rgba(255,255,255,0.06)',
              color: filter === c ? '#fff' : 'rgba(255,255,255,0.7)',
              border: '1px solid ' + (filter === c ? '#2997ff' : 'rgba(255,255,255,0.10)'),
              fontWeight: filter === c ? 600 : 400, textTransform: 'capitalize',
            }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Edit drawer */}
      {editing && (
        <div className="card" style={{ marginBottom: 16, padding: 18, borderLeft: '3px solid #2997ff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: 1.5, color: '#2997ff', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                {editing.mode === 'add' ? 'Restock' : 'Set stock'}
              </p>
              <h3 style={{ fontSize: 17, fontWeight: 600 }}>{editing.name}</h3>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                Current stock: <strong style={{ color: '#f5f5f7' }}>{inventory.get(editing.name) ?? '—'}</strong>
              </p>
            </div>
            <button onClick={cancelEdit} className="btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 160px' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                {editing.mode === 'add' ? 'Units to add' : 'New total'}
              </label>
              <input className="field-input" type="number" min={editing.mode === 'add' ? 1 : 0}
                step="1" inputMode="numeric"
                value={editing.value}
                onChange={e => setEditing(p => ({ ...p, value: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); }}
                autoFocus />
            </div>
            <button className="btn-blue" onClick={saveEdit} style={{ padding: '10px 22px', fontSize: 14 }}>
              {editing.mode === 'add' ? 'Add stock' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Product list, grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          No products match.
        </div>
      ) : (
        Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} style={{ marginBottom: 22 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
              {cat}
            </h3>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {items.map((p, i) => {
                const stock = inventory.get(p.name);
                const known = stock !== undefined;
                const tone = !known ? 'muted' : stock <= 0 ? 'err' : stock <= 3 ? 'warn' : 'ok';
                return (
                  <div key={p.name} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', gap: 12,
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#f5f5f7' }}>{p.name}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <StockBadge stock={stock} tone={tone} />
                      <button onClick={() => startEdit(p.name, 'add')} className="btn-ghost" style={{ fontSize: 13 }}>
                        + Restock
                      </button>
                      <button onClick={() => startEdit(p.name, 'set')} className="btn-ghost" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                        Set
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function StatCard({ label, value, sub, tone }) {
  const colorMap = { ok: '#f5f5f7', warn: '#ff9f0a', err: '#ff453a' };
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 600, color: colorMap[tone] || '#f5f5f7', letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{sub}</p>}
    </div>
  );
}

function StockBadge({ stock, tone }) {
  const bgMap = {
    muted: 'rgba(255,255,255,0.06)',
    ok:    'rgba(52,199,89,0.14)',
    warn:  'rgba(255,159,10,0.16)',
    err:   'rgba(255,69,58,0.16)',
  };
  const fgMap = {
    muted: 'rgba(255,255,255,0.45)',
    ok:    '#34c759',
    warn:  '#ff9f0a',
    err:   '#ff453a',
  };
  return (
    <span style={{
      minWidth: 60, padding: '6px 12px', borderRadius: 8, textAlign: 'center',
      background: bgMap[tone], color: fgMap[tone], fontSize: 13, fontWeight: 600,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {stock === undefined ? 'not set' : `${stock} in stock`}
    </span>
  );
}

window.InventoryManager = InventoryManager;
