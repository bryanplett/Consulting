// OnboardingQuiz — first-time client intake. Renders full-screen instead of the
// portal until clients.onboarded_at is set. Saves directly to the clients row.

const { useState, useMemo } = React;

// ---------- step definitions ----------
const STEPS = [
  { id: 'welcome',     title: 'Welcome' },
  { id: 'basics',      title: 'About you' },
  { id: 'body',        title: 'Body stats' },
  { id: 'goals',       title: 'Your goal' },
  { id: 'training',    title: 'Training' },
  { id: 'nutrition',   title: 'Nutrition' },
  { id: 'health',      title: 'Health & safety' },
  { id: 'review',      title: 'Review' },
];

// ---------- shared input atoms ----------
const Label = ({ children }) => (
  <label style={{
    display: 'block', fontSize: 13, fontWeight: 500,
    color: 'rgba(255,255,255,0.7)', marginBottom: 8, letterSpacing: '-0.1px',
  }}>{children}</label>
);

const TextField = ({ value, onChange, placeholder, type = 'text', suffix }) => (
  <div style={{ position: 'relative' }}>
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="field-input"
      style={{
        width: '100%', boxSizing: 'border-box',
        background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: suffix ? '12px 56px 12px 14px' : '12px 14px',
        color: '#f5f5f7', fontSize: 15, outline: 'none',
        transition: 'border-color 0.15s',
      }}
    />
    {suffix && (
      <span style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 13, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none',
      }}>{suffix}</span>
    )}
  </div>
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value ?? ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      width: '100%', boxSizing: 'border-box', resize: 'vertical',
      background: '#0e0e10', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '12px 14px', color: '#f5f5f7',
      fontSize: 15, outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
    }}
  />
);

// Tile-style radio: large tappable cards. Used for 2-6 options.
const Tiles = ({ value, onChange, options, columns = 2 }) => (
  <div style={{
    display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10,
  }}>
    {options.map(opt => {
      const selected = value === opt.value;
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            background: selected ? 'rgba(0,102,204,0.15)' : '#0e0e10',
            border: `1px solid ${selected ? '#0066cc' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12, padding: '14px 16px', textAlign: 'left',
            color: '#f5f5f7', fontSize: 15, cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
        >
          <div style={{ fontWeight: 500 }}>{opt.label}</div>
          {opt.hint && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
              {opt.hint}
            </div>
          )}
        </button>
      );
    })}
  </div>
);

// ---------- main component ----------
function OnboardingQuiz({ clientId, clientName, onComplete, onSignOut }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  // If the placeholder name is just the email, treat it as empty so we ask for a real name.
  const placeholderName = (clientName && !clientName.includes('@')) ? clientName : '';

  const [data, setData] = useState({
    full_name: placeholderName,
    units: 'imperial',
    sex: '',
    date_of_birth: '',
    // imperial inputs (we'll convert on submit)
    height_ft: '', height_in: '', weight_lb: '',
    // metric inputs
    height_cm: '', weight_kg: '',
    body_fat_pct: '',
    goal: '',
    activity_level: '',
    experience: '',
    days_per_week: '',
    equipment: '',
    dietary_pref: 'omnivore',
    allergies: '',
    limitations: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const setField = (k, v) => setData(d => ({ ...d, [k]: v }));

  const step = STEPS[stepIdx];

  // Validation per step. Returns null = valid, string = error msg.
  const stepError = useMemo(() => {
    if (step.id === 'basics') {
      if (!data.full_name || data.full_name.trim().length < 2) return 'Please enter your full name.';
      if (!data.sex) return 'Please select an option.';
      if (!data.date_of_birth) return 'Please enter your date of birth.';
    }
    if (step.id === 'body') {
      if (data.units === 'imperial') {
        if (!data.height_ft || !data.weight_lb) return 'Height and weight are required.';
      } else {
        if (!data.height_cm || !data.weight_kg) return 'Height and weight are required.';
      }
    }
    if (step.id === 'goals') {
      if (!data.goal) return 'Please pick a goal.';
      if (!data.activity_level) return 'Please pick your activity level.';
    }
    if (step.id === 'training') {
      if (!data.experience) return 'Please pick your experience level.';
      if (!data.days_per_week) return 'How many days per week can you train?';
      if (!data.equipment) return 'Please pick your equipment access.';
    }
    return null;
  }, [step.id, data]);

  const next = () => {
    if (stepError) { setError(stepError); return; }
    setError(null);
    setStepIdx(i => Math.min(i + 1, STEPS.length - 1));
  };
  const back = () => { setError(null); setStepIdx(i => Math.max(i - 1, 0)); };

  // Convert imperial -> metric for storage
  const buildPayload = () => {
    let height_cm, weight_kg;
    if (data.units === 'imperial') {
      const ft = parseFloat(data.height_ft) || 0;
      const inch = parseFloat(data.height_in) || 0;
      height_cm = +((ft * 12 + inch) * 2.54).toFixed(1);
      weight_kg = +((parseFloat(data.weight_lb) || 0) * 0.4535924).toFixed(2);
    } else {
      height_cm = parseFloat(data.height_cm) || null;
      weight_kg = parseFloat(data.weight_kg) || null;
    }
    return {
      name: data.full_name.trim(),
      sex: data.sex || null,
      date_of_birth: data.date_of_birth || null,
      height_cm, weight_kg,
      body_fat_pct: data.body_fat_pct ? parseFloat(data.body_fat_pct) : null,
      units: data.units,
      goal: data.goal || null,
      activity_level: data.activity_level || null,
      experience: data.experience || null,
      days_per_week: data.days_per_week ? parseInt(data.days_per_week, 10) : null,
      equipment: data.equipment || null,
      dietary_pref: data.dietary_pref || null,
      allergies: data.allergies || null,
      limitations: data.limitations || null,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      onboarded_at: new Date().toISOString(),
      profile_updated_at: new Date().toISOString(),
    };
  };

  const submit = async () => {
    setSaving(true); setError(null);
    try {
      const payload = buildPayload();
      // Also seed a starter weigh-in row so the chart isn't empty on day 1.
      const sb = window.supabaseClient;
      const { data: updated, error: upErr } = await sb.from('clients')
        .update(payload).eq('id', clientId).select().single();
      if (upErr) throw upErr;

      if (payload.weight_kg) {
        await sb.from('weighins').insert({
          client_id: clientId,
          weight_kg: payload.weight_kg,
          measured_at: new Date().toISOString().slice(0, 10),
          note: 'Initial weight from onboarding',
        }).then(() => {}, () => {}); // best-effort, don't block on this
      }

      onComplete(updated);
    } catch (e) {
      console.error('Onboarding save failed:', e);
      setError(e.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0a', color: '#f5f5f7',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* top bar */}
      <div style={{
        padding: '20px 28px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.2px' }}>Welcome to your portal</div>
        <button onClick={onSignOut} style={{
          background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
          fontSize: 13, cursor: 'pointer',
        }}>Sign out</button>
      </div>

      {/* progress */}
      <div style={{ padding: '20px 28px 0' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 8,
        }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            Step {stepIdx + 1} of {STEPS.length}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {step.title}
          </div>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <div style={{
            height: '100%', width: `${((stepIdx + 1) / STEPS.length) * 100}%`,
            background: '#0066cc', borderRadius: 2, transition: 'width 0.25s',
          }} />
        </div>
      </div>

      {/* body */}
      <div style={{
        flex: 1, padding: '40px 28px', display: 'flex', justifyContent: 'center',
        alignItems: 'flex-start',
      }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          {step.id === 'welcome' && (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20, margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #0066cc, #2997ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32,
              }}>👋</div>
              <h1 style={{
                fontSize: 32, fontWeight: 600, letterSpacing: '-0.03em',
                marginBottom: 12,
              }}>Hey {placeholderName ? placeholderName.split(' ')[0] : 'there'} — let's get you set up.</h1>
              <p style={{
                fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
                maxWidth: 440, margin: '0 auto',
              }}>
                A few questions so your specialist can build a plan that actually fits.
                Takes about 3 minutes. Everything stays private.
              </p>
            </div>
          )}

          {step.id === 'basics' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 24 }}>
                The basics
              </h2>
              <div style={{ marginBottom: 20 }}>
                <Label>Your full name</Label>
                <TextField value={data.full_name}
                  onChange={v => setField('full_name', v)} placeholder="Jane Doe" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <Label>Sex assigned at birth</Label>
                <Tiles value={data.sex} onChange={v => setField('sex', v)} options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                ]} />
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
                  Used for accurate metabolic calculations.
                </div>
              </div>
              <div>
                <Label>Date of birth</Label>
                <TextField type="date" value={data.date_of_birth}
                  onChange={v => setField('date_of_birth', v)} />
              </div>
            </div>
          )}

          {step.id === 'body' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Body stats
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
                We'll re-measure weekly. This is just your starting point.
              </p>

              <div style={{ marginBottom: 20 }}>
                <Label>Units</Label>
                <Tiles value={data.units} onChange={v => setField('units', v)} options={[
                  { value: 'imperial', label: 'Imperial', hint: 'lb / ft / in' },
                  { value: 'metric',   label: 'Metric',   hint: 'kg / cm' },
                ]} />
              </div>

              {data.units === 'imperial' ? (
                <React.Fragment>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <Label>Height — feet</Label>
                      <TextField type="number" value={data.height_ft}
                        onChange={v => setField('height_ft', v)} placeholder="5" suffix="ft" />
                    </div>
                    <div>
                      <Label>Height — inches</Label>
                      <TextField type="number" value={data.height_in}
                        onChange={v => setField('height_in', v)} placeholder="10" suffix="in" />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <Label>Weight</Label>
                    <TextField type="number" value={data.weight_lb}
                      onChange={v => setField('weight_lb', v)} placeholder="180" suffix="lb" />
                  </div>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div>
                      <Label>Height</Label>
                      <TextField type="number" value={data.height_cm}
                        onChange={v => setField('height_cm', v)} placeholder="178" suffix="cm" />
                    </div>
                    <div>
                      <Label>Weight</Label>
                      <TextField type="number" value={data.weight_kg}
                        onChange={v => setField('weight_kg', v)} placeholder="82" suffix="kg" />
                    </div>
                  </div>
                </React.Fragment>
              )}

              <div>
                <Label>Body fat % <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>— optional</span></Label>
                <TextField type="number" value={data.body_fat_pct}
                  onChange={v => setField('body_fat_pct', v)} placeholder="18" suffix="%" />
              </div>
            </div>
          )}

          {step.id === 'goals' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 24 }}>
                What are you here to do?
              </h2>
              <div style={{ marginBottom: 24 }}>
                <Label>Primary goal</Label>
                <Tiles value={data.goal} onChange={v => setField('goal', v)} options={[
                  { value: 'lose',        label: 'Lose fat',           hint: 'Cut while keeping muscle' },
                  { value: 'gain',        label: 'Build muscle',       hint: 'Gain size and strength' },
                  { value: 'maintain',    label: 'Maintain & recomp',  hint: 'Hold weight, improve shape' },
                  { value: 'performance', label: 'Performance',        hint: 'Get faster / stronger' },
                ]} columns={2} />
              </div>
              <div>
                <Label>Day-to-day activity level</Label>
                <Tiles value={data.activity_level} onChange={v => setField('activity_level', v)} options={[
                  { value: 'sedentary', label: 'Sedentary', hint: 'Desk job, little walking' },
                  { value: 'light',     label: 'Light',     hint: 'On feet some of the day' },
                  { value: 'moderate',  label: 'Moderate',  hint: 'Active job or 10k+ steps' },
                  { value: 'heavy',     label: 'Heavy',     hint: 'Manual labor, very active' },
                  { value: 'athlete',   label: 'Athlete',   hint: '2x/day training' },
                ]} columns={2} />
              </div>
            </div>
          )}

          {step.id === 'training' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 24 }}>
                Training
              </h2>
              <div style={{ marginBottom: 24 }}>
                <Label>Experience level</Label>
                <Tiles value={data.experience} onChange={v => setField('experience', v)} options={[
                  { value: 'beginner',     label: 'Beginner',     hint: '< 1 year consistent' },
                  { value: 'intermediate', label: 'Intermediate', hint: '1–3 years lifting' },
                  { value: 'advanced',     label: 'Advanced',     hint: '3+ years, know your numbers' },
                ]} columns={3} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <Label>Days per week you can train</Label>
                <Tiles value={String(data.days_per_week)} onChange={v => setField('days_per_week', v)} options={[
                  { value: '3', label: '3 days' },
                  { value: '4', label: '4 days' },
                  { value: '5', label: '5 days' },
                  { value: '6', label: '6 days' },
                ]} columns={4} />
              </div>
              <div>
                <Label>Equipment access</Label>
                <Tiles value={data.equipment} onChange={v => setField('equipment', v)} options={[
                  { value: 'full_gym', label: 'Full gym',         hint: 'Barbells, racks, machines' },
                  { value: 'home_db',  label: 'Home — dumbbells', hint: 'DBs, bench, bands' },
                  { value: 'minimal',  label: 'Minimal',          hint: 'Bodyweight + bands' },
                ]} columns={3} />
              </div>
            </div>
          )}

          {step.id === 'nutrition' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 24 }}>
                Nutrition
              </h2>
              <div style={{ marginBottom: 24 }}>
                <Label>Dietary preference</Label>
                <Tiles value={data.dietary_pref} onChange={v => setField('dietary_pref', v)} options={[
                  { value: 'omnivore',    label: 'Omnivore' },
                  { value: 'vegetarian',  label: 'Vegetarian' },
                  { value: 'vegan',       label: 'Vegan' },
                  { value: 'pescatarian', label: 'Pescatarian' },
                  { value: 'keto',        label: 'Keto / low-carb' },
                  { value: 'other',       label: 'Other' },
                ]} columns={3} />
              </div>
              <div>
                <Label>Allergies or foods you can't eat <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>— optional</span></Label>
                <TextArea value={data.allergies} onChange={v => setField('allergies', v)}
                  placeholder="e.g. shellfish, dairy, gluten…" rows={2} />
              </div>
            </div>
          )}

          {step.id === 'health' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Health & safety
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
                Anything we should know to keep training safe.
              </p>
              <div style={{ marginBottom: 20 }}>
                <Label>Injuries, conditions, or limitations <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>— optional</span></Label>
                <TextArea value={data.limitations} onChange={v => setField('limitations', v)}
                  placeholder="e.g. left shoulder impingement, lower back pain on heavy deadlifts…" rows={3} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <Label>Emergency contact — name <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>— optional</span></Label>
                <TextField value={data.emergency_contact_name}
                  onChange={v => setField('emergency_contact_name', v)} placeholder="Full name" />
              </div>
              <div>
                <Label>Emergency contact — phone</Label>
                <TextField type="tel" value={data.emergency_contact_phone}
                  onChange={v => setField('emergency_contact_phone', v)} placeholder="(555) 123-4567" />
              </div>
            </div>
          )}

          {step.id === 'review' && (
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
                Looks good?
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
                You can change any of this later from your profile.
              </p>
              <ReviewSummary data={data} />
            </div>
          )}
        </div>
      </div>

      {/* footer */}
      <div style={{
        padding: '20px 28px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 12,
      }}>
        <button onClick={back} disabled={stepIdx === 0} style={{
          background: 'transparent', border: 'none',
          color: stepIdx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
          fontSize: 14, cursor: stepIdx === 0 ? 'default' : 'pointer',
          padding: '8px 12px',
        }}>← Back</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {error && (
            <div style={{ fontSize: 13, color: '#ff6b6b' }}>{error}</div>
          )}
          {stepIdx < STEPS.length - 1 ? (
            <button className="btn-blue" onClick={next}
              style={{ padding: '11px 28px', fontSize: 15 }}>
              {stepIdx === 0 ? 'Get started' : 'Continue'}
            </button>
          ) : (
            <button className="btn-blue" onClick={submit} disabled={saving}
              style={{ padding: '11px 28px', fontSize: 15, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Finish & enter portal'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- review summary ----------
function ReviewSummary({ data }) {
  const goalLabels = {
    lose: 'Lose fat', gain: 'Build muscle',
    maintain: 'Maintain & recomp', performance: 'Performance',
  };
  const expLabels = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
  const eqLabels  = { full_gym: 'Full gym', home_db: 'Home dumbbells', minimal: 'Minimal' };
  const actLabels = {
    sedentary: 'Sedentary', light: 'Light', moderate: 'Moderate',
    heavy: 'Heavy', athlete: 'Athlete',
  };

  const heightDisplay = data.units === 'imperial'
    ? `${data.height_ft || 0}' ${data.height_in || 0}"`
    : `${data.height_cm} cm`;
  const weightDisplay = data.units === 'imperial'
    ? `${data.weight_lb} lb`
    : `${data.weight_kg} kg`;

  const Row = ({ label, value }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
      gap: 16,
    }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      <div style={{ fontSize: 14, color: '#f5f5f7', textAlign: 'right', maxWidth: '60%' }}>
        {value || <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
      </div>
    </div>
  );

  return (
    <div className="card" style={{ padding: '4px 24px' }}>
      <Row label="Name" value={data.full_name} />
      <Row label="Sex" value={data.sex === 'male' ? 'Male' : data.sex === 'female' ? 'Female' : ''} />
      <Row label="Date of birth" value={data.date_of_birth} />
      <Row label="Height" value={heightDisplay} />
      <Row label="Weight" value={weightDisplay} />
      {data.body_fat_pct && <Row label="Body fat" value={`${data.body_fat_pct}%`} />}
      <Row label="Goal" value={goalLabels[data.goal]} />
      <Row label="Activity level" value={actLabels[data.activity_level]} />
      <Row label="Experience" value={expLabels[data.experience]} />
      <Row label="Days/week" value={data.days_per_week ? `${data.days_per_week} days` : ''} />
      <Row label="Equipment" value={eqLabels[data.equipment]} />
      <Row label="Diet" value={data.dietary_pref} />
      {data.allergies && <Row label="Allergies" value={data.allergies} />}
      {data.limitations && <Row label="Limitations" value={data.limitations} />}
      {data.emergency_contact_name && (
        <Row label="Emergency" value={`${data.emergency_contact_name} · ${data.emergency_contact_phone || ''}`} />
      )}
    </div>
  );
}

window.OnboardingQuiz = OnboardingQuiz;
