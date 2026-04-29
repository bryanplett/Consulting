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
      pricelist: data.pricelist || 'standard',
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

        <Field label="Pricelist" span={3}>
          <Sel value={data.pricelist || 'standard'}
            onChange={v => setField('pricelist', v)}
            options={(window.getPricelistOptions ? window.getPricelistOptions() : [
              { value: 'standard',  label: 'Standard'  },
              { value: 'wholesale', label: 'Wholesale' },
            ])} />
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6, lineHeight: 1.5 }}>
            Determines which prices this client sees in their order form. Defaults to Standard for new clients.
          </p>
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

      <LoginAccessPanel sb={sb} client={data} />
    </div>
  );
}

// ─── Login & Access ──────────────────────────────────────────────────────
// Two ways to help a client who can't log in:
//   1. Send them a password-reset email (safe, standard).
//   2. Set a new password directly via an Edge Function that holds the
//      service-role key (advanced — requires the function to be deployed).
function LoginAccessPanel({ sb, client }) {
  const [busy, setBusy] = React.useState(false);
  const [msg,  setMsg]  = React.useState(null);  // { kind, text }
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [newPw, setNewPw] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  if (!client?.email) return null;

  const portalUrl = window.location.origin
    + window.location.pathname.replace(/Admin\.html$/, 'ClientPortal.html');

  const sendReset = async () => {
    setBusy(true); setMsg(null);
    const { error } = await sb.auth.resetPasswordForEmail(client.email, {
      redirectTo: portalUrl,
    });
    setBusy(false);
    if (error) setMsg({ kind: 'err', text: 'Could not send reset email: ' + error.message });
    else       setMsg({ kind: 'ok',  text: `Password-reset email sent to ${client.email}.` });
  };

  const sendMagicLink = async () => {
    setBusy(true); setMsg(null);
    const { error } = await sb.auth.signInWithOtp({
      email: client.email,
      options: { shouldCreateUser: false, emailRedirectTo: portalUrl },
    });
    setBusy(false);
    if (error) setMsg({ kind: 'err', text: 'Could not send magic link: ' + error.message });
    else       setMsg({ kind: 'ok',  text: `One-time sign-in email sent to ${client.email}.` });
  };

  const setPasswordDirect = async () => {
    if (!newPw || newPw.length < 8) {
      setMsg({ kind: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (!window.SUPABASE_FN_URL) {
      setMsg({ kind: 'err', text: 'Edge Function URL not configured. See deployment notes in profile-editor.jsx.' });
      return;
    }
    setBusy(true); setMsg(null);

    // Call the admin-set-password Edge Function. The function holds the
    // service-role key; the browser only sends the user's anon access token
    // for auth, plus the target email + new password.
    const { data: { session } } = await sb.auth.getSession();
    if (!session) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Not signed in. Refresh and try again.' });
      return;
    }

    try {
      const res = await fetch(window.SUPABASE_FN_URL + '/admin-set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + session.access_token,
        },
        body: JSON.stringify({ email: client.email, password: newPw }),
      });
      const body = await res.json().catch(() => ({}));
      setBusy(false);
      if (!res.ok) {
        setMsg({ kind: 'err', text: body.error || `Failed (HTTP ${res.status}).` });
        return;
      }
      setMsg({
        kind: 'ok',
        text: `Password updated for ${client.email}.`,
        creds: { email: client.email, password: newPw, portalUrl },
      });
      setNewPw('');
    } catch (err) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Network error: ' + (err.message || 'unknown') });
    }
  };

  const copy = async (text, key) => {
    try { await navigator.clipboard.writeText(text); }
    catch { window.prompt('Copy this:', text); return; }
    setCopied(key);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      marginTop: 28, paddingTop: 20,
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Login &amp; Access</h4>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14, lineHeight: 1.55 }}>
        Help this client sign in. For security reasons we can't show you their existing password — choose one of the actions below.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <button type="button" className="btn-blue" disabled={busy} onClick={sendReset}>
          Send password-reset email
        </button>
        <button type="button" className="btn-ghost" disabled={busy} onClick={sendMagicLink}>
          Send one-time sign-in link
        </button>
        <button type="button" className="btn-ghost" onClick={() => { setShowAdvanced(s => !s); setMsg(null); }}>
          {showAdvanced ? 'Hide advanced' : 'Set password directly (advanced)'}
        </button>
      </div>

      {showAdvanced && (
        <div style={{
          background: 'rgba(255,159,10,0.06)',
          border: '1px solid rgba(255,159,10,0.25)',
          borderRadius: 8, padding: 14, marginBottom: 12,
        }}>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, marginBottom: 10 }}>
            <strong style={{ color: '#ff9f0a' }}>Heads up:</strong> this immediately overwrites the client's password.
            Tell them the new password yourself (text/email). Requires the <code>admin-set-password</code> Edge Function to be deployed.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="New password (≥ 8 chars)"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              style={{
                flex: '1 1 240px', minWidth: 200,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6, padding: '8px 10px',
                color: '#f5f5f7', fontSize: 13, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button type="button" className="btn-blue" disabled={busy} onClick={setPasswordDirect}>
              {busy ? 'Setting…' : 'Set password now'}
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.55,
          background: msg.kind === 'ok' ? 'rgba(52,199,89,0.10)' : 'rgba(255,69,58,0.10)',
          border:     msg.kind === 'ok' ? '1px solid rgba(52,199,89,0.30)' : '1px solid rgba(255,69,58,0.30)',
          color:      msg.kind === 'ok' ? '#34c759' : '#ff453a',
        }}>
          <div>{msg.text}</div>
          {msg.creds && (
            <div style={{
              marginTop: 10, padding: 10, borderRadius: 6,
              background: 'rgba(0,0,0,0.3)', color: '#f5f5f7',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 12, lineHeight: 1.7,
            }}>
              <div>Email: {msg.creds.email}</div>
              <div>Password: {msg.creds.password}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)' }}>Portal: {msg.creds.portalUrl}</div>
              <button type="button"
                onClick={() => copy(
                  `Welcome to PeakForm Bio. Sign in here:\n${msg.creds.portalUrl}\n\nEmail: ${msg.creds.email}\nPassword: ${msg.creds.password}\n\nUse the "Use email & password" option on the sign-in screen.`,
                  'welcome'
                )}
                style={{
                  marginTop: 8, width: '100%',
                  background: 'rgba(0,102,204,0.25)',
                  border: '1px solid rgba(0,102,204,0.45)',
                  borderRadius: 4, color: '#fff', fontSize: 11,
                  padding: '4px 10px', cursor: 'pointer',
                }}>
                {copied === 'welcome' ? '✓ Copied welcome message' : 'Copy welcome message'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

window.ProfileEditor = ProfileEditor;
