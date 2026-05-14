// CouponsManager — admin UI to create / edit / delete discount codes.
//
// Coupon shape (matches the `coupons` Supabase table):
//   { id, code, kind: 'percent'|'fixed', amount: number,
//     scope: 'all'|'retatrutide', active: bool, notes: string }
//
// Two discount kinds:
//   percent → amount is 0–100, applied as a % off the matching subtotal.
//   fixed   → amount is dollars off the matching subtotal (clamped at subtotal).
//
// Two scopes:
//   all          → discount applies to the whole cart subtotal.
//   retatrutide  → discount applies only to Retatrutide line items.

const { useState: useCouponState, useEffect: useCouponEffect } = React;

function CouponsManager({ sb, onBack }) {
  const [coupons, setCoupons] = useCouponState(null); // null = loading
  const [editing, setEditing] = useCouponState(null); // null | {} (new) | {id,...}
  const [msg, setMsg] = useCouponState(null);

  const load = async () => {
    setCoupons(null);
    const { data, error } = await sb.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load coupons:', error);
      setCoupons([]);
      return;
    }
    setCoupons(data || []);
  };

  useCouponEffect(() => { load(); }, []);

  const startNew = () => setEditing({
    code: '', kind: 'percent', amount: 10, scope: 'all', active: true, notes: '',
  });

  const startEdit = (c) => setEditing({ ...c });

  const cancelEdit = () => setEditing(null);

  const saveCoupon = async () => {
    const code = (editing.code || '').trim().toLowerCase();
    const amount = parseFloat(editing.amount);
    if (!code) return setMsg({ kind: 'err', text: 'Code is required.' });
    if (!/^[a-z0-9_-]+$/i.test(code)) return setMsg({ kind: 'err', text: 'Code can only contain letters, numbers, dashes, and underscores.' });
    if (!isFinite(amount) || amount <= 0) return setMsg({ kind: 'err', text: 'Amount must be a positive number.' });
    if (editing.kind === 'percent' && amount > 100) return setMsg({ kind: 'err', text: 'Percent cannot exceed 100.' });

    const payload = {
      code,
      kind: editing.kind,
      amount,
      scope: editing.scope,
      active: !!editing.active,
      notes: editing.notes?.trim() || null,
    };

    let res;
    if (editing.id) {
      res = await sb.from('coupons').update(payload).eq('id', editing.id).select().single();
    } else {
      res = await sb.from('coupons').insert(payload).select().single();
    }
    if (res.error) {
      if (/duplicate|unique/i.test(res.error.message)) {
        return setMsg({ kind: 'err', text: `Code "${code}" already exists.` });
      }
      return setMsg({ kind: 'err', text: res.error.message });
    }
    setMsg({ kind: 'ok', text: editing.id ? 'Coupon updated.' : 'Coupon created.' });
    setEditing(null);
    load();
  };

  const deleteCoupon = async (c) => {
    if (!window.confirm(`Delete coupon "${c.code}"? Clients using this code will no longer get the discount.`)) return;
    const { error } = await sb.from('coupons').delete().eq('id', c.id);
    if (error) return setMsg({ kind: 'err', text: error.message });
    setMsg({ kind: 'ok', text: 'Coupon deleted.' });
    load();
  };

  const toggleActive = async (c) => {
    const { error } = await sb.from('coupons').update({ active: !c.active }).eq('id', c.id);
    if (error) return setMsg({ kind: 'err', text: error.message });
    load();
  };

  if (coupons === null) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>Loading coupons…</div>;
  }

  return (
    <div className="fade-in">
      <button onClick={onBack} className="btn-ghost" style={{ marginBottom: 16, fontSize: 13 }}>← Back</button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 6 }}>Coupon Codes</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
            Discount codes clients can enter at checkout. Codes are case-insensitive.
          </p>
        </div>
        <button className="btn-blue" onClick={startNew} style={{ padding: '10px 18px', fontSize: 14 }}>
          + New coupon
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13,
          background: msg.kind === 'ok' ? 'rgba(52,199,89,0.10)' : 'rgba(255,69,58,0.10)',
          border: `1px solid ${msg.kind === 'ok' ? 'rgba(52,199,89,0.30)' : 'rgba(255,69,58,0.30)'}`,
          color: msg.kind === 'ok' ? '#7be39a' : '#ff8a8a',
        }}>{msg.text}</div>
      )}

      {editing && <CouponForm editing={editing} setEditing={setEditing} onSave={saveCoupon} onCancel={cancelEdit} />}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {coupons.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
            No coupons yet. Tap “New coupon” to create one.
          </div>
        ) : (
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Code', 'Discount', 'Applies to', 'Status', 'Notes', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 18px', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 18px', fontFamily: 'ui-monospace, SF Mono, monospace', fontSize: 14, fontWeight: 600, color: '#f5f5f7' }}>
                      {c.code.toUpperCase()}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 14 }}>
                      {c.kind === 'percent' ? `${c.amount}% off` : `$${c.amount} off`}
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      {c.scope === 'retatrutide' ? 'Retatrutide only' : 'Entire order'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <button onClick={() => toggleActive(c)} className="tag" style={{
                        background: c.active ? 'rgba(52,199,89,0.14)' : 'rgba(255,255,255,0.08)',
                        color: c.active ? '#34c759' : 'rgba(255,255,255,0.5)',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      }}>{c.active ? 'active' : 'disabled'}</button>
                    </td>
                    <td style={{ padding: '14px 18px', fontSize: 13, color: 'rgba(255,255,255,0.55)', maxWidth: 220 }}>{c.notes || '—'}</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => startEdit(c)} className="btn-ghost" style={{ fontSize: 13, marginRight: 4 }}>Edit</button>
                      <button onClick={() => deleteCoupon(c)} className="btn-ghost" style={{ fontSize: 13, color: '#ff8a8a' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function CouponForm({ editing, setEditing, onSave, onCancel }) {
  const set = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));
  return (
    <div className="card" style={{ marginBottom: 20, padding: 22 }}>
      <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>
        {editing.id ? `Edit “${editing.code.toUpperCase()}”` : 'New coupon'}
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div>
          <label style={labelStyle}>Code</label>
          <input className="field-input" type="text" value={editing.code}
            onChange={e => set('code', e.target.value.toLowerCase().replace(/\s+/g, ''))}
            placeholder="e.g. christi" autoCapitalize="off" autoComplete="off"
            style={{ fontFamily: 'ui-monospace, SF Mono, monospace', textTransform: 'lowercase' }} />
          <p style={hintStyle}>Letters, numbers, dashes only. Stored lowercase.</p>
        </div>
        <div>
          <label style={labelStyle}>Discount Type</label>
          <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
            {[
              { val: 'percent', label: '% off' },
              { val: 'fixed',   label: '$ off' },
            ].map(opt => (
              <button key={opt.val} type="button" onClick={() => set('kind', opt.val)} style={{
                flex: 1, padding: '10px 12px', fontSize: 14, border: 'none', cursor: 'pointer',
                background: editing.kind === opt.val ? '#2997ff' : 'transparent',
                color: editing.kind === opt.val ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: editing.kind === opt.val ? 600 : 400, fontFamily: 'inherit',
              }}>{opt.label}</button>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Amount</label>
          <div style={{ position: 'relative' }}>
            {editing.kind === 'fixed' && (
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 14, pointerEvents: 'none' }}>$</span>
            )}
            <input className="field-input" type="number" min="0" max={editing.kind === 'percent' ? 100 : undefined}
              step={editing.kind === 'percent' ? 1 : 1}
              value={editing.amount}
              onChange={e => set('amount', e.target.value)}
              style={{ paddingLeft: editing.kind === 'fixed' ? 24 : undefined }} />
            {editing.kind === 'percent' && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 14, pointerEvents: 'none' }}>%</span>
            )}
          </div>
        </div>
        <div>
          <label style={labelStyle}>Applies to</label>
          <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.10)' }}>
            {[
              { val: 'all',         label: 'Entire order' },
              { val: 'retatrutide', label: 'Retatrutide only' },
            ].map(opt => (
              <button key={opt.val} type="button" onClick={() => set('scope', opt.val)} style={{
                flex: 1, padding: '10px 12px', fontSize: 13, border: 'none', cursor: 'pointer',
                background: editing.scope === opt.val ? '#2997ff' : 'transparent',
                color: editing.scope === opt.val ? '#fff' : 'rgba(255,255,255,0.7)',
                fontWeight: editing.scope === opt.val ? 600 : 400, fontFamily: 'inherit',
              }}>{opt.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Notes (optional)</label>
        <input className="field-input" type="text" value={editing.notes || ''}
          onChange={e => set('notes', e.target.value)}
          placeholder="e.g. VIP referral; expires April; etc." />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!editing.active} onChange={e => set('active', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#2997ff' }} />
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>Active</span>
        </label>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          (uncheck to disable without deleting)
        </span>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-blue" onClick={onSave} style={{ padding: '10px 22px', fontSize: 14 }}>
          {editing.id ? 'Save changes' : 'Create coupon'}
        </button>
        <button className="btn-ghost" onClick={onCancel} style={{ fontSize: 14 }}>Cancel</button>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 };
const hintStyle  = { fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 6 };

window.CouponsManager = CouponsManager;
