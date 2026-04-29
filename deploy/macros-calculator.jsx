// ─── Macros Calculator (IIFYM, multi-step quiz funnel) ──────────────────────
// Standalone admin tool. Calculates BMR / TDEE / macros and can push
// the result into a client's nutrition_plans row.
//
// Math:
//   BMR — Mifflin-St Jeor by default; Katch-McArdle if body fat % entered
//   TDEE = BMR × activity multiplier
//   Goal adjustment % applied to TDEE
//   Macros — protein-first; fat % of cals; carbs fill the rest
//   Fiber = 14g per 1000 kcal
//   Safety floor — 1500 kcal men / 1200 kcal women

const MC_ACTIVITY = [
  { id: 'sedentary', label: 'Sedentary', sub: 'Desk job, little movement', mult: 1.2 },
  { id: 'light',     label: 'Light',     sub: 'Light exercise 1–3 days/wk', mult: 1.375 },
  { id: 'moderate',  label: 'Moderate',  sub: 'Moderate exercise 3–5 days/wk', mult: 1.55 },
  { id: 'heavy',     label: 'Heavy',     sub: 'Hard training 6–7 days/wk', mult: 1.725 },
  { id: 'athlete',   label: 'Athlete',   sub: 'Twice daily, physical job', mult: 1.9 },
];

const MC_GOALS = [
  { id: 'lose',        label: 'Lose Fat',     sub: 'Cut calories, preserve muscle' },
  { id: 'gain',        label: 'Gain Muscle',  sub: 'Lean surplus for growth' },
  { id: 'maintain',    label: 'Maintain',     sub: 'Hold current composition' },
  { id: 'performance', label: 'Performance',  sub: 'Fuel training, recover hard' },
];

const MC_PACE_LOSE = [
  { id: 'steady',     label: 'Steady',     sub: '~0.5 lb/wk',  pct: -0.15 },
  { id: 'moderate',   label: 'Moderate',   sub: '~1 lb/wk',    pct: -0.20 },
  { id: 'aggressive', label: 'Aggressive', sub: '~1.5 lb/wk',  pct: -0.25 },
];
const MC_PACE_GAIN = [
  { id: 'lean',       label: 'Lean',       sub: '~0.25 lb/wk', pct: 0.05 },
  { id: 'standard',   label: 'Standard',   sub: '~0.5 lb/wk',  pct: 0.10 },
  { id: 'aggressive', label: 'Aggressive', sub: '~0.75 lb/wk', pct: 0.15 },
];

// Macro splits (protein g/lb of bodyweight, fat % of calories)
const MC_MACROS = {
  lose:        { proteinPerLb: 1.00, fatPct: 0.25 },
  gain:        { proteinPerLb: 0.85, fatPct: 0.25 },
  maintain:    { proteinPerLb: 0.80, fatPct: 0.30 },
  performance: { proteinPerLb: 0.80, fatPct: 0.22 },
};

const KG_PER_LB = 0.453592;
const CM_PER_IN = 2.54;

// ─── Reusable bits ──────────────────────────────────────────────────────────
const McProgressBar = ({ value }) => (
  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
    <div style={{ width: `${value*100}%`, height: '100%', background: 'linear-gradient(90deg,#0066cc,#2997ff)',
      borderRadius: 999, transition: 'width 0.35s cubic-bezier(.2,.8,.2,1)' }} />
  </div>
);

const McCard = ({ selected, onClick, children, padding = '22px 24px' }) => (
  <button onClick={onClick} type="button"
    style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: selected ? 'rgba(41,151,255,0.10)' : 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${selected ? '#2997ff' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14, padding, color: '#f5f5f7', fontFamily: 'inherit',
      transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
    {children}
  </button>
);

const McStepShell = ({ title, sub, children }) => (
  <div style={{ animation: 'fadeIn 0.25s ease' }}>
    <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 8 }}>{title}</h2>
    {sub && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 28, lineHeight: 1.5 }}>{sub}</p>}
    {!sub && <div style={{ marginBottom: 28 }} />}
    {children}
  </div>
);

const McNavRow = ({ onBack, onNext, nextLabel = 'Continue', nextDisabled = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, gap: 12 }}>
    {onBack ? (
      <button onClick={onBack} className="btn-ghost" style={{ padding: '10px 20px' }}>← Back</button>
    ) : <span />}
    {onNext && (
      <button onClick={onNext} disabled={nextDisabled}
        className="btn-blue" style={{
          padding: '12px 28px', fontSize: 15,
          opacity: nextDisabled ? 0.4 : 1,
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
        }}>{nextLabel}</button>
    )}
  </div>
);

// ─── Math ───────────────────────────────────────────────────────────────────
const mcCalc = (inputs) => {
  const { sex, age, weightLb, heightIn, bodyFatPct, activityId, goalId, paceId } = inputs;
  const kg = weightLb * KG_PER_LB;
  const cm = heightIn * CM_PER_IN;

  // BMR
  let bmr, formula;
  if (bodyFatPct && bodyFatPct > 0) {
    const lbmKg = kg * (1 - bodyFatPct/100);
    bmr = 370 + 21.6 * lbmKg;
    formula = 'Katch-McArdle';
  } else {
    bmr = sex === 'male'
      ? 10*kg + 6.25*cm - 5*age + 5
      : 10*kg + 6.25*cm - 5*age - 161;
    formula = 'Mifflin-St Jeor';
  }

  const activity = MC_ACTIVITY.find(a => a.id === activityId);
  const tdee = bmr * activity.mult;

  // Goal adjustment
  let adjPct = 0;
  if (goalId === 'lose')  adjPct = MC_PACE_LOSE.find(p => p.id === paceId)?.pct ?? -0.20;
  if (goalId === 'gain')  adjPct = MC_PACE_GAIN.find(p => p.id === paceId)?.pct ?? 0.10;
  let calories = tdee * (1 + adjPct);

  // Safety floor
  const floor = sex === 'male' ? 1500 : 1200;
  let flooredAt = null;
  if (calories < floor) { flooredAt = floor; calories = floor; }

  // Macros
  const split = MC_MACROS[goalId];
  const protein_g = Math.round(weightLb * split.proteinPerLb);
  const fat_kcal  = calories * split.fatPct;
  const fat_g     = Math.round(fat_kcal / 9);
  const protein_kcal = protein_g * 4;
  const carb_kcal = Math.max(0, calories - protein_kcal - fat_kcal);
  const carbs_g   = Math.round(carb_kcal / 4);
  const fiber_g   = Math.round(14 * (calories / 1000));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    formula,
    activityMult: activity.mult,
    activityLabel: activity.label,
    adjPct,
    calories: Math.round(calories),
    flooredAt,
    protein_g, fat_g, carbs_g, fiber_g,
    proteinPerLb: split.proteinPerLb,
    fatPct: split.fatPct,
  };
};

// ─── Donut ──────────────────────────────────────────────────────────────────
const McDonut = ({ p_kcal, c_kcal, f_kcal }) => {
  const total = p_kcal + c_kcal + f_kcal;
  if (total === 0) return null;
  const r = 70, c = 2 * Math.PI * r;
  const pPct = p_kcal / total, cPct = c_kcal / total, fPct = f_kcal / total;
  let offset = 0;
  const seg = (pct, color) => {
    const len = c * pct;
    const el = (
      <circle key={color} r={r} cx="90" cy="90" fill="transparent"
        stroke={color} strokeWidth="22"
        strokeDasharray={`${len} ${c - len}`}
        strokeDashoffset={-offset}
        transform="rotate(-90 90 90)" />
    );
    offset += len;
    return el;
  };
  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle r={r} cx="90" cy="90" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="22" />
      {seg(pPct, '#2997ff')}
      {seg(cPct, '#ff9f0a')}
      {seg(fPct, '#bf5af2')}
    </svg>
  );
};

// ─── Steps ──────────────────────────────────────────────────────────────────
const McStepGoal = ({ value, onChange }) => (
  <McStepShell title="What's your goal?" sub="We'll calibrate everything from here.">
    <div style={{ display: 'grid', gap: 10 }}>
      {MC_GOALS.map(g => (
        <McCard key={g.id} selected={value === g.id} onClick={() => onChange(g.id)}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{g.label}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{g.sub}</div>
          </div>
          <McChevron selected={value === g.id} />
        </McCard>
      ))}
    </div>
  </McStepShell>
);

const McStepSex = ({ value, onChange }) => (
  <McStepShell title="Biological sex" sub="Used for BMR formula and the safety calorie floor.">
    <div style={{ display: 'grid', gap: 10 }}>
      {[
        { id: 'male', label: 'Male' },
        { id: 'female', label: 'Female' },
      ].map(s => (
        <McCard key={s.id} selected={value === s.id} onClick={() => onChange(s.id)}>
          <div style={{ fontSize: 17, fontWeight: 600 }}>{s.label}</div>
          <McChevron selected={value === s.id} />
        </McCard>
      ))}
    </div>
  </McStepShell>
);

const McStepStats = ({ stats, units, onUnits, onChange }) => {
  const isImperial = units === 'imperial';
  return (
    <McStepShell title="Your stats" sub="Age, height, and bodyweight.">
      {/* Unit toggle */}
      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: 999, padding: 4, marginBottom: 24 }}>
        {[
          { id: 'imperial', label: 'lb / ft·in' },
          { id: 'metric',   label: 'kg / cm' },
        ].map(u => (
          <button key={u.id} onClick={() => onUnits(u.id)} type="button"
            style={{
              padding: '8px 18px', fontSize: 13, fontFamily: 'inherit',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              background: units === u.id ? '#0066cc' : 'transparent',
              color: units === u.id ? '#fff' : 'rgba(255,255,255,0.65)',
              fontWeight: units === u.id ? 600 : 400,
            }}>{u.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Age</label>
          <input className="field-input" type="number" inputMode="numeric" placeholder="e.g. 32"
            value={stats.age} onChange={e => onChange({ ...stats, age: e.target.value })} />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
            Weight ({isImperial ? 'lb' : 'kg'})
          </label>
          <input className="field-input" type="number" inputMode="decimal"
            placeholder={isImperial ? 'e.g. 175' : 'e.g. 80'}
            value={stats.weight} onChange={e => onChange({ ...stats, weight: e.target.value })} />
        </div>

        {isImperial ? (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Height</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input className="field-input" type="number" inputMode="numeric" placeholder="ft"
                value={stats.heightFt} onChange={e => onChange({ ...stats, heightFt: e.target.value })} />
              <input className="field-input" type="number" inputMode="numeric" placeholder="in"
                value={stats.heightIn} onChange={e => onChange({ ...stats, heightIn: e.target.value })} />
            </div>
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Height (cm)</label>
            <input className="field-input" type="number" inputMode="numeric" placeholder="e.g. 178"
              value={stats.heightCm} onChange={e => onChange({ ...stats, heightCm: e.target.value })} />
          </div>
        )}
      </div>
    </McStepShell>
  );
};

const McStepBodyFat = ({ value, onChange }) => (
  <McStepShell title="Body fat % (optional)"
    sub="If you know it, we'll switch to the more accurate Katch-McArdle formula. Otherwise skip — we'll use Mifflin-St Jeor.">
    <input className="field-input" type="number" inputMode="decimal" placeholder="e.g. 18"
      value={value} onChange={e => onChange(e.target.value)} />
    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
      DEXA, bod pod, or calipers ideal. Visual estimates okay but less precise.
    </p>
  </McStepShell>
);

const McStepActivity = ({ value, onChange }) => (
  <McStepShell title="Activity level" sub="Outside of intentional training too — your average week.">
    <div style={{ display: 'grid', gap: 10 }}>
      {MC_ACTIVITY.map(a => (
        <McCard key={a.id} selected={value === a.id} onClick={() => onChange(a.id)}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{a.label} <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>×{a.mult}</span></div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{a.sub}</div>
          </div>
          <McChevron selected={value === a.id} />
        </McCard>
      ))}
    </div>
  </McStepShell>
);

const McStepPace = ({ goalId, value, onChange }) => {
  const opts = goalId === 'lose' ? MC_PACE_LOSE : MC_PACE_GAIN;
  const verb = goalId === 'lose' ? 'fat loss' : 'muscle gain';
  return (
    <McStepShell title={`How aggressive on ${verb}?`} sub="Faster isn't always better — sustainability beats speed.">
      <div style={{ display: 'grid', gap: 10 }}>
        {opts.map(p => (
          <McCard key={p.id} selected={value === p.id} onClick={() => onChange(p.id)}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>
                {p.label} <span style={{ fontSize: 13, fontWeight: 400, color: '#2997ff', marginLeft: 6 }}>
                  {p.pct >= 0 ? '+' : ''}{Math.round(p.pct*100)}%
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{p.sub}</div>
            </div>
            <McChevron selected={value === p.id} />
          </McCard>
        ))}
      </div>
    </McStepShell>
  );
};

const McChevron = ({ selected }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    {selected ? (
      <>
        <circle cx="10" cy="10" r="9" fill="#2997ff" />
        <path d="M6 10l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ) : (
      <path d="M7 5l5 5-5 5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

// ─── Results ────────────────────────────────────────────────────────────────
const McResults = ({ result, inputs, clients, sb, onRestart }) => {
  const [selectedClientId, setSelectedClientId] = React.useState('');
  const [importMsg, setImportMsg] = React.useState('');
  const [importing, setImporting] = React.useState(false);

  const p_kcal = result.protein_g * 4;
  const c_kcal = result.carbs_g * 4;
  const f_kcal = result.fat_g * 9;

  const importToClient = async () => {
    if (!selectedClientId) return;
    setImporting(true); setImportMsg('');
    const client = clients.find(c => c.id === selectedClientId);
    try {
      // Find latest active plan, or insert a new one
      const { data: existing } = await sb.from('nutrition_plans')
        .select('*').eq('client_id', selectedClientId).eq('active', true)
        .order('created_at', { ascending: false }).limit(1);

      const goalLabel = inputs.goalId === 'lose' ? 'Cut'
        : inputs.goalId === 'gain' ? 'Lean Bulk'
        : inputs.goalId === 'performance' ? 'Performance' : 'Maintenance';

      const payload = {
        daily_calories: result.calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fats_g: result.fat_g,
        goal: goalLabel,
        updated_at: new Date().toISOString(),
      };

      let res;
      if (existing && existing.length) {
        res = await sb.from('nutrition_plans').update(payload).eq('id', existing[0].id).select().single();
      } else {
        res = await sb.from('nutrition_plans').insert({
          client_id: selectedClientId,
          title: 'Macro Targets',
          active: true,
          ...payload,
        }).select().single();
      }
      if (res.error) throw res.error;
      setImportMsg(`✓ Imported to ${client.name}'s nutrition profile.`);
    } catch (err) {
      setImportMsg('Error: ' + (err.message || err));
    } finally { setImporting(false); }
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#2997ff',
          letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 12 }}>Your Daily Target</p>
        <div style={{ fontSize: 84, fontWeight: 700, color: '#fff',
          letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>
          {result.calories.toLocaleString()}
        </div>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)' }}>
          calories per day{result.flooredAt && <span style={{ color: '#ff9f0a' }}> · safety floor applied</span>}
        </p>
      </div>

      {/* Donut + macro cards */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ position: 'relative' }}>
            <McDonut p_kcal={p_kcal} c_kcal={c_kcal} f_kcal={f_kcal} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
                {result.calories}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
                letterSpacing: '0.08em', fontWeight: 600 }}>kcal</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10, minWidth: 240, flex: 1 }}>
            {[
              { label: 'Protein', g: result.protein_g, kcal: p_kcal, color: '#2997ff' },
              { label: 'Carbs',   g: result.carbs_g,   kcal: c_kcal, color: '#ff9f0a' },
              { label: 'Fat',     g: result.fat_g,     kcal: f_kcal, color: '#bf5af2' },
            ].map(m => (
              <div key={m.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 999, background: m.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{m.label}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
                    {m.g}<span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginLeft: 2 }}>g</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{Math.round(m.kcal)} kcal · {Math.round(m.kcal/result.calories*100)}%</div>
                </div>
              </div>
            ))}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', background: 'rgba(52,199,89,0.06)',
              border: '1px solid rgba(52,199,89,0.18)', borderRadius: 12,
            }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Fiber target</span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#34c759' }}>{result.fiber_g}g</span>
            </div>
          </div>
        </div>
      </div>

      {/* How we got here */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>How we got here</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          <McRow label={`BMR (${result.formula})`} value={`${result.bmr} kcal`} />
          <McRow label={`Activity multiplier (${result.activityLabel})`} value={`× ${result.activityMult}`} />
          <McRow label="TDEE (maintenance)" value={`${result.tdee} kcal`} highlight />
          <McRow label="Goal adjustment"
            value={result.adjPct === 0 ? 'none' : `${result.adjPct > 0 ? '+' : ''}${Math.round(result.adjPct * 100)}%`} />
          {result.flooredAt && (
            <McRow label="Safety floor applied" value={`${result.flooredAt} kcal min`} warn />
          )}
          <McRow label="Protein rule" value={`${result.proteinPerLb} g/lb bodyweight`} />
          <McRow label="Fat rule" value={`${Math.round(result.fatPct * 100)}% of calories`} />
          <McRow label="Carbs rule" value="fill remaining calories" />
        </div>
      </div>

      {/* Import to client */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Import to client profile</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.55 }}>
          Push these numbers straight into the daily target on a client's nutrition plan. Existing meal data is preserved — only target macros are updated.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="field-input" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
            style={{ flex: '1 1 240px', minWidth: 240 }}>
            <option value="">Select a client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-blue" disabled={!selectedClientId || importing} onClick={importToClient}
            style={{ opacity: !selectedClientId || importing ? 0.5 : 1, cursor: !selectedClientId || importing ? 'not-allowed' : 'pointer' }}>
            {importing ? 'Importing…' : 'Import →'}
          </button>
        </div>
        {importMsg && (
          <p style={{ marginTop: 12, fontSize: 13,
            color: importMsg.startsWith('Error') ? '#ff453a' : '#34c759' }}>{importMsg}</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
        <button className="btn-ghost" onClick={onRestart}>↻ Recalculate</button>
        <button className="btn-ghost" onClick={() => window.print()}>Print results</button>
      </div>
    </div>
  );
};

const McRow = ({ label, value, highlight = false, warn = false }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px', background: highlight ? 'rgba(41,151,255,0.08)' : warn ? 'rgba(255,159,10,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${highlight ? 'rgba(41,151,255,0.20)' : warn ? 'rgba(255,159,10,0.20)' : 'rgba(255,255,255,0.05)'}`,
    borderRadius: 10,
  }}>
    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 600, color: highlight ? '#2997ff' : warn ? '#ff9f0a' : '#fff' }}>{value}</span>
  </div>
);

// ─── Main ───────────────────────────────────────────────────────────────────
const MacrosCalculator = ({ sb, clients, onBack }) => {
  const [step, setStep] = React.useState(0);
  const [units, setUnits] = React.useState('imperial');

  const [goalId, setGoalId] = React.useState('');
  const [sex, setSex] = React.useState('');
  const [stats, setStats] = React.useState({ age: '', weight: '', heightFt: '', heightIn: '', heightCm: '' });
  const [bodyFatPct, setBodyFatPct] = React.useState('');
  const [activityId, setActivityId] = React.useState('');
  const [paceId, setPaceId] = React.useState('');

  // Build steps dynamically — pace step skipped for maintain/performance
  const stepIds = React.useMemo(() => {
    const base = ['goal', 'sex', 'stats', 'bodyfat', 'activity'];
    if (goalId === 'lose' || goalId === 'gain') base.push('pace');
    base.push('results');
    return base;
  }, [goalId]);

  const currentId = stepIds[step];
  const totalQuiz = stepIds.length - 1; // exclude results from progress denominator
  const progress = currentId === 'results' ? 1 : step / totalQuiz;

  const next = () => setStep(s => Math.min(s + 1, stepIds.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  // Validation per step
  const canContinue = (() => {
    switch (currentId) {
      case 'goal': return !!goalId;
      case 'sex': return !!sex;
      case 'stats': {
        const age = parseFloat(stats.age), w = parseFloat(stats.weight);
        if (!age || age < 12 || age > 100) return false;
        if (!w || w <= 0) return false;
        if (units === 'imperial') {
          const ft = parseFloat(stats.heightFt), inch = parseFloat(stats.heightIn) || 0;
          if (!ft || ft <= 0) return false;
          return ft*12 + inch > 0;
        }
        return parseFloat(stats.heightCm) > 0;
      }
      case 'bodyfat': return true; // optional
      case 'activity': return !!activityId;
      case 'pace': return !!paceId;
      default: return true;
    }
  })();

  // Compute when on results
  const result = React.useMemo(() => {
    if (currentId !== 'results') return null;
    const weightLb = units === 'imperial'
      ? parseFloat(stats.weight)
      : parseFloat(stats.weight) / KG_PER_LB;
    const heightIn = units === 'imperial'
      ? parseFloat(stats.heightFt) * 12 + (parseFloat(stats.heightIn) || 0)
      : parseFloat(stats.heightCm) / CM_PER_IN;
    const bf = parseFloat(bodyFatPct);
    return mcCalc({
      sex, age: parseFloat(stats.age),
      weightLb, heightIn,
      bodyFatPct: isNaN(bf) ? null : bf,
      activityId, goalId, paceId,
    });
  }, [currentId, units, sex, stats, bodyFatPct, activityId, goalId, paceId]);

  const restart = () => {
    setStep(0); setGoalId(''); setSex('');
    setStats({ age: '', weight: '', heightFt: '', heightIn: '', heightCm: '' });
    setBodyFatPct(''); setActivityId(''); setPaceId('');
  };

  const inputs = { goalId, sex, weightLb: parseFloat(stats.weight) || 0, heightIn: parseFloat(stats.heightFt) || 0 };

  return (
    <div className="fade-in">
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 20 }}>← Back to clients</button>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 6 }}>Macros Calculator · IIFYM</p>
          {currentId !== 'results' && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Step {step + 1} of {totalQuiz}
            </p>
          )}
        </div>

        {/* Progress */}
        {currentId !== 'results' && (
          <div style={{ marginBottom: 36 }}>
            <McProgressBar value={progress} />
          </div>
        )}

        {/* Step body */}
        <div className="card" style={{ padding: '32px 32px' }}>
          {currentId === 'goal'     && <McStepGoal value={goalId} onChange={setGoalId} />}
          {currentId === 'sex'      && <McStepSex value={sex} onChange={setSex} />}
          {currentId === 'stats'    && <McStepStats stats={stats} units={units} onUnits={setUnits} onChange={setStats} />}
          {currentId === 'bodyfat'  && <McStepBodyFat value={bodyFatPct} onChange={setBodyFatPct} />}
          {currentId === 'activity' && <McStepActivity value={activityId} onChange={setActivityId} />}
          {currentId === 'pace'     && <McStepPace goalId={goalId} value={paceId} onChange={setPaceId} />}
          {currentId === 'results'  && result && (
            <McResults result={result} inputs={{ goalId, sex }} clients={clients} sb={sb} onRestart={restart} />
          )}

          {currentId !== 'results' && (
            <McNavRow
              onBack={step > 0 ? back : null}
              onNext={next}
              nextDisabled={!canContinue}
              nextLabel={currentId === 'bodyfat' && !bodyFatPct ? 'Skip' : 'Continue'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

window.MacrosCalculator = MacrosCalculator;
