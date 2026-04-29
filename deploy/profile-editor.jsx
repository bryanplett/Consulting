// ProfileEditor — admin-side view & edit of a client's profile.
// Mirrors the OnboardingQuiz fields but in a flat form layout.
// Shows whether the client has completed onboarding, last update time,
// and lets the coach correct or fill in any field.

const { useState, useEffect } = React;

function ProfileEditor({ sb, client, onSaved }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { setData(client); }, [client?.id]);

  if (!data) return null;

  const setField = (k, v) => setData(d => ({ ...d, [k]: v }));

  const save = async () => {
    setSaving(true); setMsg('');
    const payload = {
      sex: data.sex || null,
      date_of_birth: data.date_of_birth || null,
      height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
      weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null,
      body_fat_pct: data.body_fat_pct ? parseFloat(data.body_fat_pct) : null,
      units: data.units || 'imperial',
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
      notes: data.notes || null,
      profile_updated_at: new Date().toISOString(),
    };
    const { data: updated, error } = await sb.from('clients')
      .update(payload).eq('id', client.id).select().single();
    setSaving(false);
    if (error) { setMsg('Error: ' + error.message); return; }
    setMsg('Saved.');
    setTimeout(() => setMsg(''), 2000);
    onSaved && onSaved(updated);
  };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 12px',
    color: '#f5f5f7', fontSize: 14, outline: 'none', fontFamily: 'inherit',
  };
  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 500,
    color: 'rgba(255,255,255,0.55)', marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  };

  const Field = ({ label, children, span = 1 }) => (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );

  const Sel = ({ value, onChange, options }) => (
    <select className="field-input" style={inputStyle}
      value={value || ''} onChange={e => onChange(e.target.value)}>
      <option value="">— not set —</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  const onboarded = !!data.onboarded_at;

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Client Profile</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {onboarded
              ? `Client completed onboarding on ${new Date(data.onboarded_at).toLocaleDateString()}.`
              : 'Client has not completed the onboarding quiz yet.'}
            {data.profile_updated_at && (
              <span> Last updated {new Date(data.profile_updated_at).toLocaleDateString()}.</span>
            )}
          </p>
        </div>
        <span className="tag" style={{
          background: onboarded ? 'rgba(52,199,89,0.14)' : 'rgba(255,159,10,0.14)',
          color: onboarded ? '#34c759' : '#ff9f0a',
        }}>
          {onboarded ? 'Onboarded' : 'Pending intake'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <Field label="Sex">
          <Sel value={data.sex} onChange={v => setField('sex', v)}
            options={[{value:'male',label:'Male'},{value:'female',label:'Female'}]} />
        </Field>
        <Field label="Date of birth">
          <input style={inputStyle} type="date"
            value={data.date_of_birth || ''}
            onChange={e => setField('date_of_birth', e.target.value)} />
        </Field>
        <Field label="Units">
          <Sel value={data.units} onChange={v => setField('units', v)}
            options={[{value:'imperial',label:'Imperial'},{value:'metric',label:'Metric'}]} />
        </Field>

        <Field label="Height (cm)">
          <input style={inputStyle} type="number" step="0.1"
            value={data.height_cm ?? ''}
            onChange={e => setField('height_cm', e.target.value)} />
        </Field>
        <Field label="Weight (kg)">
          <input style={inputStyle} type="number" step="0.1"
            value={data.weight_kg ?? ''}
            onChange={e => setField('weight_kg', e.target.value)} />
        </Field>
        <Field label="Body fat %">
          <input style={inputStyle} type="number" step="0.1"
            value={data.body_fat_pct ?? ''}
            onChange={e => setField('body_fat_pct', e.target.value)} />
        </Field>

        <Field label="Goal">
          <Sel value={data.goal} onChange={v => setField('goal', v)} options={[
            {value:'lose',label:'Lose fat'},
            {value:'gain',label:'Build muscle'},
            {value:'maintain',label:'Maintain & recomp'},
            {value:'performance',label:'Performance'},
          ]} />
        </Field>
        <Field label="Activity level">
          <Sel value={data.activity_level} onChange={v => setField('activity_level', v)} options={[
            {value:'sedentary',label:'Sedentary'},
            {value:'light',label:'Light'},
            {value:'moderate',label:'Moderate'},
            {value:'heavy',label:'Heavy'},
            {value:'athlete',label:'Athlete'},
          ]} />
        </Field>
        <Field label="Experience">
          <Sel value={data.experience} onChange={v => setField('experience', v)} options={[
            {value:'beginner',label:'Beginner'},
            {value:'intermediate',label:'Intermediate'},
            {value:'advanced',label:'Advanced'},
          ]} />
        </Field>

        <Field label="Days / week">
          <Sel value={String(data.days_per_week || '')}
            onChange={v => setField('days_per_week', v)} options={[
            {value:'3',label:'3 days'},{value:'4',label:'4 days'},
            {value:'5',label:'5 days'},{value:'6',label:'6 days'},
          ]} />
        </Field>
        <Field label="Equipment">
          <Sel value={data.equipment} onChange={v => setField('equipment', v)} options={[
            {value:'full_gym',label:'Full gym'},
            {value:'home_db',label:'Home dumbbells'},
            {value:'minimal',label:'Minimal'},
          ]} />
        </Field>
        <Field label="Dietary preference">
          <Sel value={data.dietary_pref} onChange={v => setField('dietary_pref', v)} options={[
            {value:'omnivore',label:'Omnivore'},
            {value:'vegetarian',label:'Vegetarian'},
            {value:'vegan',label:'Vegan'},
            {value:'pescatarian',label:'Pescatarian'},
            {value:'keto',label:'Keto / low-carb'},
            {value:'other',label:'Other'},
          ]} />
        </Field>

        <Field label="Allergies / dietary restrictions" span={3}>
          <textarea style={{...inputStyle, minHeight: 60, resize: 'vertical'}}
            value={data.allergies || ''}
            onChange={e => setField('allergies', e.target.value)} />
        </Field>
        <Field label="Injuries / limitations" span={3}>
          <textarea style={{...inputStyle, minHeight: 60, resize: 'vertical'}}
            value={data.limitations || ''}
            onChange={e => setField('limitations', e.target.value)} />
        </Field>

        <Field label="Emergency contact name" span={2}>
          <input style={inputStyle}
            value={data.emergency_contact_name || ''}
            onChange={e => setField('emergency_contact_name', e.target.value)} />
        </Field>
        <Field label="Emergency contact phone">
          <input style={inputStyle} type="tel"
            value={data.emergency_contact_phone || ''}
            onChange={e => setField('emergency_contact_phone', e.target.value)} />
        </Field>

        <Field label="Coach notes (private)" span={3}>
          <textarea style={{...inputStyle, minHeight: 80, resize: 'vertical'}}
            placeholder="Private notes only the coach sees…"
            value={data.notes || ''}
            onChange={e => setField('notes', e.target.value)} />
        </Field>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn-blue" onClick={save} disabled={saving}
          style={{ opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
        {msg && (
          <span style={{ fontSize: 13, color: msg.startsWith('Error') ? '#ff453a' : '#34c759' }}>
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}

window.ProfileEditor = ProfileEditor;
