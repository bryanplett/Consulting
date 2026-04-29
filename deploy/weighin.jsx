// ─── Weekly Weigh-In ──────────────────────────────────────────────────────────
// Persists weigh-ins and goal to Supabase. Unit preference stays in localStorage.
//
// Expected Supabase tables:
//   weigh_ins(id uuid pk default gen_random_uuid(),
//             client_id uuid not null,
//             entry_date date not null,
//             weight_lb numeric not null,
//             notes text,
//             created_at timestamptz default now(),
//             unique(client_id, entry_date))
//   weight_goals(client_id uuid pk,
//                weight_lb numeric not null,
//                target_date date not null,
//                updated_at timestamptz default now())

const wiUnitKey = `peakform_weighunit`;
const loadUnit = () => localStorage.getItem(wiUnitKey) || 'lb';
const saveUnit = (u) => localStorage.setItem(wiUnitKey, u);

// Map DB row → in-memory entry shape
const rowToEntry = (r) => ({
  id: r.id,
  date: r.entry_date,
  weightLb: Number(r.weight_lb),
  notes: r.notes || '',
});
const rowToGoal = (r) => r ? ({
  weightLb: Number(r.weight_lb),
  targetDate: r.target_date,
}) : null;

// Storage is canonical in lb. Display converts.
const KG_PER_LB = 0.45359237;
const toDisplay = (lb, unit) => unit === 'kg' ? lb * KG_PER_LB : lb;
const fromInput = (val, unit) => unit === 'kg' ? val / KG_PER_LB : val;
const fmtWeight = (lb, unit, digits = 1) => {
  if (lb == null || isNaN(lb)) return '—';
  return `${toDisplay(lb, unit).toFixed(digits)} ${unit}`;
};
const todayISO = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// ─── Stat Card ────────────────────────────────────────────────────────────────
const WIStat = ({ label, value, sub, accent }) => (
  <div className="card" style={{ padding: 18 }}>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 700, color: accent || '#f5f5f7', letterSpacing: '-0.025em', marginTop: 6, lineHeight: 1.1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{sub}</div>}
  </div>
);

// ─── Goal Modal ───────────────────────────────────────────────────────────────
const GoalModal = ({ open, onClose, goal, onSave, onClear, unit }) => {
  const [weight, setWeight] = React.useState('');
  const [date, setDate] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setWeight(goal ? toDisplay(goal.weightLb, unit).toFixed(1) : '');
      setDate(goal ? goal.targetDate : '');
    }
  }, [open, goal, unit]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0 || !date) return;
    onSave({ weightLb: fromInput(w, unit), targetDate: date });
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} className="card fade-in" style={{ width: '100%', maxWidth: 420 }}>
        <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 4 }}>{goal ? 'Edit goal' : 'Set goal'}</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 22 }}>Track progress toward a target weight by a specific date.</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Goal weight ({unit})</label>
            <input className="field-input" type="number" step="0.1" min="0" placeholder={unit === 'kg' ? '75.0' : '165.0'}
              value={weight} onChange={e => setWeight(e.target.value)} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Target date</label>
            <input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
            <button type="submit" className="btn-blue">Save goal</button>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            {goal && (
              <button type="button" onClick={() => { onClear(); onClose(); }}
                style={{
                  marginLeft: 'auto', background: 'transparent', border: 'none', color: '#ff453a',
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: '10px 12px',
                }}>
                Remove goal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Confirm Overwrite Modal ──────────────────────────────────────────────────
const ConfirmOverwriteModal = ({ open, date, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} className="card fade-in" style={{ width: '100%', maxWidth: 380 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Entry already exists</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 22, lineHeight: 1.5 }}>
          You already logged a weigh-in on <strong style={{ color: '#f5f5f7' }}>{date}</strong>. Overwrite it with the new value?
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onConfirm} className="btn-blue">Overwrite</button>
          <button onClick={onCancel} className="btn-ghost">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Entry Modal ─────────────────────────────────────────────────────────
const EditEntryModal = ({ open, entry, unit, onSave, onClose, onDateConflict }) => {
  const [date, setDate] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (open && entry) {
      setDate(entry.date);
      setWeight(toDisplay(entry.weightLb, unit).toFixed(1));
      setNotes(entry.notes || '');
    }
  }, [open, entry, unit]);

  if (!open || !entry) return null;

  const submit = (e) => {
    e.preventDefault();
    const w = parseFloat(weight);
    if (!w || w <= 0 || !date) return;
    if (date !== entry.date && onDateConflict(date)) return;
    onSave({ ...entry, date, weightLb: fromInput(w, unit), notes: notes.trim() });
    onClose();
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} className="card fade-in" style={{ width: '100%', maxWidth: 420 }}>
        <h3 style={{ fontSize: 19, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 22 }}>Edit weigh-in</h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Date</label>
            <input className="field-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Weight ({unit})</label>
            <input className="field-input" type="number" step="0.1" min="0" value={weight} onChange={e => setWeight(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
              Notes <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>(optional)</span>
            </label>
            <textarea className="field-input" rows="2" value={notes} onChange={e => setNotes(e.target.value)}
              style={{ resize: 'vertical', minHeight: 60 }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="submit" className="btn-blue">Save changes</button>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Line Chart (SVG) ─────────────────────────────────────────────────────────
const WeightChart = ({ entries, unit, goalLb, rangeDays }) => {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(720);
  const h = 260;
  const pad = { l: 44, r: 18, t: 18, b: 32 };

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  // Filter to range
  const now = new Date(todayISO());
  const filtered = rangeDays
    ? entries.filter(e => daysBetween(e.date, todayISO()) <= rangeDays)
    : entries;

  if (filtered.length === 0) {
    return (
      <div ref={ref} className="card" style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>No entries in this range.</p>
      </div>
    );
  }

  const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
  const times = sorted.map(e => new Date(e.date).getTime());
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const tSpan = Math.max(1, maxT - minT);

  const weights = sorted.map(e => toDisplay(e.weightLb, unit));
  let minY = Math.min(...weights);
  let maxY = Math.max(...weights);
  if (goalLb != null) {
    const g = toDisplay(goalLb, unit);
    minY = Math.min(minY, g); maxY = Math.max(maxY, g);
  }
  const yPadV = Math.max(1, (maxY - minY) * 0.15);
  minY -= yPadV; maxY += yPadV;
  if (maxY === minY) { maxY += 1; minY -= 1; }

  const xOf = (t) => pad.l + (sorted.length === 1 ? (w - pad.l - pad.r) / 2 : ((t - minT) / tSpan) * (w - pad.l - pad.r));
  const yOf = (val) => pad.t + (1 - (val - minY) / (maxY - minY)) * (h - pad.t - pad.b);

  const points = sorted.map(e => ({ x: xOf(new Date(e.date).getTime()), y: yOf(toDisplay(e.weightLb, unit)), ...e }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = points.length > 1
    ? `${pathD} L${points[points.length - 1].x.toFixed(1)},${(h - pad.b).toFixed(1)} L${points[0].x.toFixed(1)},${(h - pad.b).toFixed(1)} Z`
    : '';

  // Y ticks
  const yTicks = 4;
  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => minY + ((maxY - minY) * i) / yTicks);

  // X ticks: first, last, midpoint label
  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  const xLabels = sorted.length <= 1
    ? [{ t: minT, label: fmtDate(sorted[0].date) }]
    : [
        { t: minT, label: fmtDate(sorted[0].date) },
        { t: minT + tSpan / 2, label: '' },
        { t: maxT, label: fmtDate(sorted[sorted.length - 1].date) },
      ];

  const goalY = goalLb != null ? yOf(toDisplay(goalLb, unit)) : null;

  return (
    <div ref={ref} className="card" style={{ padding: 20, paddingBottom: 12 }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="wiArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2997ff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#2997ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid */}
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={yOf(v)} y2={yOf(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <text x={pad.l - 8} y={yOf(v) + 4} textAnchor="end" fontSize="11" fill="rgba(255,255,255,0.4)" fontFamily="Inter, sans-serif">
              {v.toFixed(0)}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xLabels.map((xl, i) => xl.label && (
          <text key={i} x={xOf(xl.t)} y={h - pad.b + 18} textAnchor={i === 0 ? 'start' : i === xLabels.length - 1 ? 'end' : 'middle'}
            fontSize="11" fill="rgba(255,255,255,0.45)" fontFamily="Inter, sans-serif">{xl.label}</text>
        ))}

        {/* Goal line */}
        {goalY != null && (
          <g>
            <line x1={pad.l} x2={w - pad.r} y1={goalY} y2={goalY}
              stroke="#34c759" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.85" />
            <text x={w - pad.r} y={goalY - 6} textAnchor="end" fontSize="10" fill="#34c759" fontFamily="Inter, sans-serif" fontWeight="600">
              GOAL {toDisplay(goalLb, unit).toFixed(1)} {unit}
            </text>
          </g>
        )}

        {/* Area */}
        {areaD && <path d={areaD} fill="url(#wiArea)" />}

        {/* Line */}
        <path d={pathD} fill="none" stroke="#2997ff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#0a0a0a" stroke="#2997ff" strokeWidth="2" />
            <title>{`${p.date}: ${toDisplay(p.weightLb, unit).toFixed(1)} ${unit}${p.notes ? ` — ${p.notes}` : ''}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const WeighIn = ({ sb, userId, readOnly = false, clientName = null }) => {
  const [entries, setEntries] = React.useState([]);
  const [goal, setGoal] = React.useState(null);
  const [unit, setUnit] = React.useState(() => loadUnit());
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');

  const [date, setDate] = React.useState(todayISO());
  const [weight, setWeight] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const [pendingOverwrite, setPendingOverwrite] = React.useState(null);
  const [goalOpen, setGoalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [range, setRange] = React.useState('all');

  // Load from Supabase whenever userId changes
  React.useEffect(() => {
    if (!userId || !sb) return;
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    (async () => {
      try {
        const [wiRes, goalRes] = await Promise.all([
          sb.from('weigh_ins').select('*').eq('client_id', userId).order('entry_date', { ascending: true }),
          sb.from('weight_goals').select('*').eq('client_id', userId).maybeSingle(),
        ]);
        if (cancelled) return;
        if (wiRes.error) throw wiRes.error;
        if (goalRes.error && goalRes.error.code !== 'PGRST116') throw goalRes.error;
        setEntries((wiRes.data || []).map(rowToEntry));
        setGoal(rowToGoal(goalRes.data));
      } catch (err) {
        console.error('Weigh-in load failed:', err);
        if (!cancelled) setLoadError(err.message || 'Could not load weigh-ins.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId, sb]);

  React.useEffect(() => { saveUnit(unit); }, [unit]);

  const sortedDesc = React.useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries]
  );
  const sortedAsc = React.useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  // ── DB mutations ──
  const insertEntry = async (entryDate, weightLb, notesStr) => {
    const { data, error } = await sb.from('weigh_ins').insert({
      client_id: userId, entry_date: entryDate, weight_lb: weightLb, notes: notesStr || null,
    }).select().single();
    if (error) throw error;
    return rowToEntry(data);
  };
  const updateEntryDb = async (id, patch) => {
    const dbPatch = {};
    if (patch.date !== undefined) dbPatch.entry_date = patch.date;
    if (patch.weightLb !== undefined) dbPatch.weight_lb = patch.weightLb;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes || null;
    const { data, error } = await sb.from('weigh_ins').update(dbPatch).eq('id', id).select().single();
    if (error) throw error;
    return rowToEntry(data);
  };
  const deleteEntryDb = async (id) => {
    const { error } = await sb.from('weigh_ins').delete().eq('id', id);
    if (error) throw error;
  };
  const upsertGoalDb = async (g) => {
    const { data, error } = await sb.from('weight_goals').upsert({
      client_id: userId, weight_lb: g.weightLb, target_date: g.targetDate, updated_at: new Date().toISOString(),
    }, { onConflict: 'client_id' }).select().single();
    if (error) throw error;
    return rowToGoal(data);
  };
  const deleteGoalDb = async () => {
    const { error } = await sb.from('weight_goals').delete().eq('client_id', userId);
    if (error) throw error;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const w = parseFloat(weight);
    if (!w || w <= 0) { setError('Enter a valid weight.'); return; }
    if (!date) { setError('Pick a date.'); return; }
    const existing = entries.find(en => en.date === date);
    if (existing) {
      setPendingOverwrite({ existingId: existing.id, date, weightLb: fromInput(w, unit), notes: notes.trim() });
      return;
    }
    setBusy(true);
    try {
      const inserted = await insertEntry(date, fromInput(w, unit), notes.trim());
      setEntries(prev => [...prev, inserted]);
      setWeight(''); setNotes('');
    } catch (err) {
      setError(err.message || 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  const confirmOverwrite = async () => {
    setBusy(true);
    try {
      const updated = await updateEntryDb(pendingOverwrite.existingId, {
        weightLb: pendingOverwrite.weightLb,
        notes: pendingOverwrite.notes,
      });
      setEntries(prev => prev.map(en => en.id === updated.id ? updated : en));
      setPendingOverwrite(null);
      setWeight(''); setNotes('');
    } catch (err) {
      setError(err.message || 'Could not overwrite.');
      setPendingOverwrite(null);
    } finally {
      setBusy(false);
    }
  };

  const deleteEntry = async (id) => {
    if (readOnly) return;
    if (!confirm('Delete this weigh-in?')) return;
    try {
      await deleteEntryDb(id);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      alert('Could not delete: ' + (err.message || err));
    }
  };

  const saveEdit = async (updated) => {
    try {
      const saved = await updateEntryDb(updated.id, {
        date: updated.date, weightLb: updated.weightLb, notes: updated.notes,
      });
      setEntries(prev => prev.map(e => e.id === saved.id ? saved : e));
    } catch (err) {
      alert('Could not save: ' + (err.message || err));
    }
  };

  const dateConflictForEdit = (newDate) => {
    return entries.some(e => e.date === newDate && e.id !== editing?.id);
  };

  const handleSaveGoal = async (g) => {
    try {
      const saved = await upsertGoalDb(g);
      setGoal(saved);
    } catch (err) {
      alert('Could not save goal: ' + (err.message || err));
    }
  };
  const handleClearGoal = async () => {
    try {
      await deleteGoalDb();
      setGoal(null);
    } catch (err) {
      alert('Could not remove goal: ' + (err.message || err));
    }
  };

  // ── Stats ──
  const stats = React.useMemo(() => {
    if (entries.length === 0) return null;
    const current = sortedDesc[0];
    const findClosestBefore = (daysAgo) => {
      const cutoff = new Date(current.date);
      cutoff.setDate(cutoff.getDate() - daysAgo);
      const cutoffISO = cutoff.toISOString().split('T')[0];
      // pick most recent entry on or before cutoff
      const candidates = entries.filter(e => e.date <= cutoffISO);
      if (candidates.length === 0) return null;
      return candidates.sort((a, b) => b.date.localeCompare(a.date))[0];
    };
    const weekAgo = findClosestBefore(7);
    const monthAgo = findClosestBefore(30);
    const first = sortedAsc[0];

    // 7-day rolling avg: last 7 days from current entry
    const cutoff7 = new Date(current.date);
    cutoff7.setDate(cutoff7.getDate() - 6);
    const cutoff7ISO = cutoff7.toISOString().split('T')[0];
    const last7 = entries.filter(e => e.date >= cutoff7ISO && e.date <= current.date);
    const rolling = last7.length > 0
      ? last7.reduce((s, e) => s + e.weightLb, 0) / last7.length
      : null;

    return {
      current, weekAgo, monthAgo, first, rolling,
      weekDelta: weekAgo ? current.weightLb - weekAgo.weightLb : null,
      monthDelta: monthAgo ? current.weightLb - monthAgo.weightLb : null,
      totalDelta: first.id !== current.id ? current.weightLb - first.weightLb : null,
    };
  }, [entries, sortedDesc, sortedAsc]);

  // ── Goal progress ──
  const goalProgress = React.useMemo(() => {
    if (!goal || !stats) return null;
    const start = stats.first.weightLb;
    const cur = stats.current.weightLb;
    const target = goal.weightLb;
    const totalDistance = start - target; // positive if losing weight goal
    const traveled = start - cur;
    let pct;
    if (Math.abs(totalDistance) < 0.01) {
      pct = cur === target ? 100 : 0;
    } else {
      pct = (traveled / totalDistance) * 100;
    }
    pct = Math.max(0, Math.min(100, pct));

    // Project completion based on recent trend (last 14 days, or all if fewer)
    let projection = null;
    if (sortedAsc.length >= 2) {
      const recent = sortedAsc.slice(-Math.min(sortedAsc.length, 14));
      const t0 = new Date(recent[0].date).getTime();
      const t1 = new Date(recent[recent.length - 1].date).getTime();
      const dDays = Math.max(1, (t1 - t0) / 86400000);
      const dWeight = recent[recent.length - 1].weightLb - recent[0].weightLb;
      const ratePerDay = dWeight / dDays; // lb/day
      const remaining = target - cur;
      // Projection only makes sense if rate is in the right direction
      if (Math.abs(ratePerDay) > 0.001 && Math.sign(ratePerDay) === Math.sign(remaining)) {
        const daysToGoal = remaining / ratePerDay;
        const projDate = new Date(stats.current.date);
        projDate.setDate(projDate.getDate() + Math.round(daysToGoal));
        projection = projDate;
      }
    }
    return { pct, projection };
  }, [goal, stats, sortedAsc]);

  // Color helpers for delta — green = lower (typical loss goal). We keep neutral when no goal direction, but spec says green/red regardless.
  const deltaColor = (delta) => {
    if (delta == null) return 'rgba(255,255,255,0.4)';
    if (Math.abs(delta) < 0.05) return 'rgba(255,255,255,0.5)';
    return delta < 0 ? '#34c759' : '#ff453a';
  };
  const fmtDelta = (lb, digits = 1) => {
    if (lb == null) return '—';
    const d = toDisplay(lb, unit);
    const sign = d > 0 ? '+' : '';
    return `${sign}${d.toFixed(digits)} ${unit}`;
  };

  const ranges = [
    { id: '4w', label: 'Last 4 weeks', days: 28 },
    { id: '3m', label: 'Last 3 months', days: 92 },
    { id: '1y', label: 'Last year', days: 365 },
    { id: 'all', label: 'All time', days: null },
  ];
  const activeRange = ranges.find(r => r.id === range);

  if (loading) {
    return (
      <div className="fade-in">
        <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 28 }}>
          {readOnly ? `${clientName || 'Client'} — Weekly Weigh-In` : 'Weekly Weigh-In'}
        </h2>
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
          Loading weigh-ins…
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="fade-in">
        <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 28 }}>Weekly Weigh-In</h2>
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: '#ff453a', marginBottom: 6 }}>Could not load weigh-in data.</p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 6 }}>
        {readOnly ? `${clientName || 'Client'} — Weekly Weigh-In` : 'Weekly Weigh-In'}
      </h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
        {readOnly
          ? 'Read-only view of client weigh-in history.'
          : 'Track your weight, watch the trend, and stay accountable.'}
      </p>

      {/* ── Entry form (hidden in read-only) ── */}
      {!readOnly && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Log a weigh-in</h3>
            {/* Unit toggle */}
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.06)', borderRadius: 980, padding: 3 }}>
              {['lb', 'kg'].map(u => (
                <button key={u} type="button" onClick={() => setUnit(u)}
                  style={{
                    border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    padding: '5px 14px', borderRadius: 980, fontSize: 12, fontWeight: 600,
                    background: unit === u ? '#0066cc' : 'transparent',
                    color: unit === u ? '#fff' : 'rgba(255,255,255,0.55)',
                    transition: 'all 0.12s',
                  }}>{u}</button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Date</label>
              <input className="field-input" type="date" value={date} max={todayISO()} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Weight ({unit})</label>
              <input className="field-input" type="number" step="0.1" min="0"
                placeholder={unit === 'kg' ? '75.0' : '165.0'}
                value={weight} onChange={e => setWeight(e.target.value)} inputMode="decimal" />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Notes <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.35)' }}>(optional)</span>
              </label>
              <input className="field-input" type="text" placeholder="e.g. morning, fasted · post-workout"
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            {error && <p style={{ gridColumn: '1 / -1', fontSize: 13, color: '#ff453a' }}>{error}</p>}
            <div style={{ gridColumn: '1 / -1' }}>
              <button type="submit" className="btn-blue" disabled={busy}>{busy ? 'Saving…' : 'Log weigh-in'}</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Empty state ── */}
      {entries.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,102,204,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 17l5-5 4 4 7-8" stroke="#2997ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 8h6v6" stroke="#2997ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p style={{ fontSize: 17, fontWeight: 500, color: '#f5f5f7', marginBottom: 6 }}>
            {readOnly ? 'No weigh-ins logged yet.' : 'No weigh-ins yet.'}
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>
            {readOnly
              ? 'This client hasn\'t logged a weigh-in. Their progress will appear here once they do.'
              : 'Log your first weigh-in above to start tracking. Consistency beats perfection — pick a time of day and check in weekly.'}
          </p>
        </div>
      ) : (
        <>
          {/* ── Stats panel ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Overview</h3>
            {!readOnly && (
              <button onClick={() => setGoalOpen(true)} className="btn-ghost" style={{ padding: '7px 14px', fontSize: 12 }}>
                {goal ? 'Edit goal' : 'Set goal'}
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            <WIStat label="Current" value={fmtWeight(stats.current.weightLb, unit)} sub={stats.current.date} />
            <WIStat label="This week" value={fmtDelta(stats.weekDelta)} accent={deltaColor(stats.weekDelta)} sub="vs. 7 days ago" />
            <WIStat label="This month" value={fmtDelta(stats.monthDelta)} accent={deltaColor(stats.monthDelta)} sub="vs. 30 days ago" />
            <WIStat label="Total" value={fmtDelta(stats.totalDelta)} accent={deltaColor(stats.totalDelta)} sub="since starting" />
            <WIStat label="7-day avg" value={fmtWeight(stats.rolling, unit)} sub="rolling" />
          </div>

          {/* ── Goal progress ── */}
          {goal && goalProgress && (
            <div className="card" style={{ marginBottom: 24, padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>Goal</div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: '#f5f5f7', marginTop: 4 }}>
                    {fmtWeight(goal.weightLb, unit)} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>by {goal.targetDate}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#34c759', letterSpacing: '-0.025em' }}>{goalProgress.pct.toFixed(0)}%</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>of the way there</div>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.06)', height: 8, borderRadius: 980, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{
                  width: `${goalProgress.pct}%`, height: '100%',
                  background: 'linear-gradient(90deg, #2997ff, #34c759)', borderRadius: 980, transition: 'width 0.4s',
                }} />
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {goalProgress.projection
                  ? <>At your current trend, you'll hit your goal around <strong style={{ color: '#f5f5f7' }}>{goalProgress.projection.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>.</>
                  : <>Log a few more weigh-ins to see a projected completion date.</>}
              </div>
            </div>
          )}

          {/* ── Range pills ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Trend</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ranges.map(r => (
                <button key={r.id} onClick={() => setRange(r.id)}
                  style={{
                    borderRadius: 980, padding: '6px 14px', fontSize: 12, cursor: 'pointer', border: 'none',
                    fontFamily: 'inherit', fontWeight: range === r.id ? 600 : 400,
                    background: range === r.id ? '#2997ff' : 'rgba(255,255,255,0.07)',
                    color: range === r.id ? '#fff' : 'rgba(255,255,255,0.7)',
                    transition: 'all 0.12s',
                  }}>{r.label}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <WeightChart entries={entries} unit={unit} goalLb={goal?.weightLb} rangeDays={activeRange.days} />
          </div>

          {/* ── History table ── */}
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>History</h3>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Date', 'Weight', 'Change', 'Notes', readOnly ? '' : ''].map((h, i) => (
                      <th key={i} style={{
                        padding: '13px 20px', textAlign: 'left',
                        fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)',
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedDesc.map((e, i) => {
                    // diff vs previous (chronologically earlier) entry
                    const prev = sortedDesc[i + 1];
                    const delta = prev ? e.weightLb - prev.weightLb : null;
                    return (
                      <tr key={e.id} style={{ borderBottom: i < sortedDesc.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                        <td style={{ padding: '14px 20px', fontSize: 14, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>{e.date}</td>
                        <td style={{ padding: '14px 20px', fontSize: 15, fontWeight: 500, color: '#f5f5f7', whiteSpace: 'nowrap' }}>
                          {fmtWeight(e.weightLb, unit)}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 14, color: deltaColor(delta), fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {fmtDelta(delta)}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 280 }}>
                          {e.notes || <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}
                        </td>
                        <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                          {!readOnly && (
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button onClick={() => setEditing(e)} aria-label="Edit"
                                style={{
                                  border: 'none', background: 'rgba(255,255,255,0.06)', cursor: 'pointer',
                                  width: 30, height: 30, borderRadius: 8, color: 'rgba(255,255,255,0.6)',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                  <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                                </svg>
                              </button>
                              <button onClick={() => deleteEntry(e.id)} aria-label="Delete"
                                style={{
                                  border: 'none', background: 'rgba(255,59,48,0.10)', cursor: 'pointer',
                                  width: 30, height: 30, borderRadius: 8, color: '#ff453a',
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                  <path d="M3 4h10M6.5 4V2.5h3V4M5 4l.5 9h5L11 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <GoalModal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        goal={goal}
        unit={unit}
        onSave={handleSaveGoal}
        onClear={handleClearGoal}
      />
      <ConfirmOverwriteModal
        open={!!pendingOverwrite}
        date={pendingOverwrite?.date}
        onConfirm={confirmOverwrite}
        onCancel={() => setPendingOverwrite(null)}
      />
      <EditEntryModal
        open={!!editing}
        entry={editing}
        unit={unit}
        onSave={saveEdit}
        onClose={() => setEditing(null)}
        onDateConflict={dateConflictForEdit}
      />
    </div>
  );
};

window.WeighIn = WeighIn;
