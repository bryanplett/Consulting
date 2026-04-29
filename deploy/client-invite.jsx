// ClientInvite — coach-side helper to onboard a new client.
//
// Two modes:
//   1. "Email invite" — sends a magic-link sign-in email via Supabase OTP.
//      Client clicks link → portal → onboarding quiz.
//   2. "Manual signup" — coach enters email + password, we create the auth
//      user immediately, and tell the coach the credentials to share. No
//      email is sent.
//
// In both modes we also upsert a placeholder row into `clients` so the
// invitee shows up in the admin list with name/phone pre-filled.
//
// Required Supabase config:
//   - Auth → URL Configuration → Site URL = ClientPortal.html (for magic link).
//   - Auth → Providers → Email → "Confirm email" should be OFF if you want
//     manual-signup users to be able to log in without clicking a confirm
//     link in their inbox. Otherwise the manual flow still creates the user
//     but they'll need to confirm via email before logging in.

const { useState } = React;

function ClientInvite({ sb, onInvited, onCancel }) {
  const [mode, setMode]   = useState('email');         // 'email' | 'manual'
  const [form, setForm]   = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy]   = useState(false);
  const [msg,  setMsg]    = useState(null);            // { kind: 'ok'|'err', text, creds? }
  const [copied, setCopied] = useState(false);

  const portalUrl = window.location.origin
    + window.location.pathname.replace(/Admin\.html$/, 'ClientPortal.html');

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const upsertClientRow = async (email, name, phone, status) => {
    return sb.from('clients').upsert(
      { name, email, phone: phone || null, status },
      { onConflict: 'email' }
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);

    const email = form.email.trim().toLowerCase();
    const name  = form.name.trim();
    const phone = form.phone.trim();
    if (!email || !name) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Name and email are required.' });
      return;
    }

    if (mode === 'email') {
      // ─── Magic-link invite ────────────────────────────────────────────
      const { error: insertErr } = await upsertClientRow(email, name, phone, 'invited');
      if (insertErr) {
        setBusy(false);
        setMsg({ kind: 'err', text: 'Could not save client record: ' + insertErr.message });
        return;
      }

      const { error: otpErr } = await sb.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: portalUrl },
      });
      if (otpErr) {
        setBusy(false);
        setMsg({ kind: 'err', text: 'Email failed to send: ' + otpErr.message });
        return;
      }

      setBusy(false);
      setMsg({ kind: 'ok', text: `Sign-in email sent to ${email}. They'll get a clickable link plus a 6-digit code.` });
      setForm({ name: '', email: '', phone: '', password: '' });
      onInvited && onInvited();
      return;
    }

    // ─── Manual signup ──────────────────────────────────────────────────
    const password = form.password;
    if (!password || password.length < 8) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Password must be at least 8 characters.' });
      return;
    }

    // 1. Create the auth user with the supplied password.
    //    If "Confirm email" is OFF in Supabase, this user can sign in
    //    immediately. If it's ON, they'll receive a confirmation email
    //    first — but the password will still work after they confirm.
    const { error: signUpErr } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone: phone || null },
        emailRedirectTo: portalUrl,
      },
    });
    if (signUpErr) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Could not create account: ' + signUpErr.message });
      return;
    }

    // 2. Upsert/refresh the placeholder clients row.
    //    (The handle_new_user trigger may have already done this; upsert
    //    just makes sure name + phone are in place either way.)
    await upsertClientRow(email, name, phone, 'invited');

    // 3. signUp() unfortunately leaves the *current browser* signed in as
    //    the new user. Sign back out so the coach stays as admin.
    try { await sb.auth.signOut(); } catch (_) {}

    setBusy(false);
    setMsg({
      kind: 'ok',
      text: `Account created for ${email}.`,
      creds: { email, password, portalUrl },
    });
    setForm({ name: '', email: '', phone: '', password: '' });
    onInvited && onInvited();
  };

  const copyText = async (text, label = 'value') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(label); setTimeout(() => setCopied(false), 2000); }
      catch { window.prompt('Copy this:', text); }
      document.body.removeChild(ta);
    }
  };

  const tabBtn = (id, label) => (
    <button type="button" onClick={() => { setMode(id); setMsg(null); }}
      style={{
        background: mode === id ? 'rgba(0,102,204,0.18)' : 'transparent',
        color: mode === id ? '#fff' : 'rgba(255,255,255,0.55)',
        border: '1px solid ' + (mode === id ? 'rgba(0,102,204,0.55)' : 'rgba(255,255,255,0.10)'),
        padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>{label}</button>
  );

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Onboard a new client</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
          {mode === 'email'
            ? "Send them a sign-in email with a magic link + 6-digit code."
            : "Create their account directly with a password you set, then share the credentials with them."}
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {tabBtn('email',  'Email invite')}
        {tabBtn('manual', 'Manual signup')}
      </div>

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <input className="field-input" placeholder="Full name" required
          value={form.name} onChange={e => setField('name', e.target.value)} />
        <input className="field-input" placeholder="email@example.com" type="email" required
          value={form.email} onChange={e => setField('email', e.target.value)} />
        <input className="field-input" placeholder="Phone (optional)"
          value={form.phone} onChange={e => setField('phone', e.target.value)} />
        {mode === 'manual' && (
          <input className="field-input" placeholder="Password (≥ 8 chars)" type="text" required
            value={form.password} onChange={e => setField('password', e.target.value)}
            style={{ gridColumn: '1 / -1' }} />
        )}
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: msg ? 14 : 0, flexWrap: 'wrap' }}>
        <button type="button" className="btn-blue" disabled={busy} onClick={submit}
          style={{ opacity: busy ? 0.6 : 1 }}>
          {busy
            ? (mode === 'email' ? 'Sending…' : 'Creating…')
            : (mode === 'email' ? 'Create & send sign-in email' : 'Create account')}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => copyText(portalUrl, 'portal')} className="btn-ghost"
          style={{ fontSize: 12 }} title={portalUrl}>
          {copied === 'portal' ? '✓ Copied portal link' : 'Copy portal link'}
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '12px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.55,
          background: msg.kind === 'ok' ? 'rgba(52,199,89,0.10)' : 'rgba(255,69,58,0.10)',
          border:     msg.kind === 'ok' ? '1px solid rgba(52,199,89,0.30)' : '1px solid rgba(255,69,58,0.30)',
          color:      msg.kind === 'ok' ? '#34c759' : '#ff453a',
        }}>
          <div>{msg.text}</div>

          {msg.creds && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 6,
              background: 'rgba(0,0,0,0.3)', color: '#f5f5f7',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
              fontSize: 12, lineHeight: 1.7,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span><span style={{ color: 'rgba(255,255,255,0.45)' }}>Portal:</span> {msg.creds.portalUrl}</span>
                <button type="button" onClick={() => copyText(msg.creds.portalUrl, 'creds-url')}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#f5f5f7', fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                  {copied === 'creds-url' ? '✓' : 'Copy'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span><span style={{ color: 'rgba(255,255,255,0.45)' }}>Email:</span> {msg.creds.email}</span>
                <button type="button" onClick={() => copyText(msg.creds.email, 'creds-email')}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#f5f5f7', fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                  {copied === 'creds-email' ? '✓' : 'Copy'}
                </button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span><span style={{ color: 'rgba(255,255,255,0.45)' }}>Password:</span> {msg.creds.password}</span>
                <button type="button" onClick={() => copyText(msg.creds.password, 'creds-pw')}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, color: '#f5f5f7', fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}>
                  {copied === 'creds-pw' ? '✓' : 'Copy'}
                </button>
              </div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button type="button" onClick={() => copyText(
                  `Welcome to PeakForm Bio. Sign in here:\n${msg.creds.portalUrl}\n\nEmail: ${msg.creds.email}\nPassword: ${msg.creds.password}\n\nUse the "Use email & password" option on the sign-in screen.`,
                  'creds-all'
                )}
                  style={{ background: 'rgba(0,102,204,0.25)', border: '1px solid rgba(0,102,204,0.45)', borderRadius: 4, color: '#fff', fontSize: 11, padding: '4px 10px', cursor: 'pointer', width: '100%' }}>
                  {copied === 'creds-all' ? '✓ Copied welcome message' : 'Copy welcome message (paste in text/email)'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'manual' && (
        <div style={{
          marginTop: 18, paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Heads up:</strong>{' '}
          if Supabase has "Confirm email" turned ON, the new user will need to
          click a confirmation link before they can sign in. Turn it OFF in
          Auth → Providers → Email if you want them to log in immediately
          with the password you set.
        </div>
      )}

      {mode === 'email' && (
        <div style={{
          marginTop: 18, paddingTop: 14,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6,
        }}>
          <strong style={{ color: 'rgba(255,255,255,0.65)' }}>Heads up:</strong>{' '}
          the link in the email lands at your <strong>Site URL</strong> in
          Supabase Auth → URL Configuration. Set that to{' '}
          <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4 }}>
            {portalUrl}
          </code>{' '}
          if you haven't already.
        </div>
      )}
    </div>
  );
}

window.ClientInvite = ClientInvite;
