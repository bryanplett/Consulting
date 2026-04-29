// ClientInvite — coach-side helper to onboard a new client.
//
// What this does:
//   1. Coach types name + email (+ optional phone)
//   2. We insert a placeholder row into `clients` (so they appear in the
//      list with name/phone pre-filled — onboarding quiz fills the rest)
//   3. We trigger a Supabase magic-link / OTP email to that address using
//      signInWithOtp({ email, shouldCreateUser: true }). The client gets
//      a real email from Supabase with a clickable sign-in link AND a
//      6-digit code. No manual link-sharing required.
//   4. As a fallback the coach can still copy the portal URL.
//
// Required Supabase config:
//   - Auth → URL Configuration → Site URL = the URL where ClientPortal.html
//     is hosted (so the magic link in the email lands there).
//   - Email templates can be customized under Auth → Email Templates.

const { useState } = React;

function ClientInvite({ sb, onInvited, onCancel }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);     // { kind: 'ok'|'err', text }
  const [copied, setCopied] = useState(false);

  const portalUrl = window.location.origin
    + window.location.pathname.replace(/Admin\.html$/, 'ClientPortal.html');

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const sendInvite = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);

    const email = form.email.trim().toLowerCase();
    const name  = form.name.trim();
    if (!email || !name) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Name and email are required.' });
      return;
    }

    // 1. Upsert a placeholder clients row keyed by email. We can't yet know
    //    their auth.uid() — the portal will re-key it to auth.uid() on first
    //    sign-in (cascade migration handles related rows).
    const { error: insertErr } = await sb.from('clients').upsert(
      {
        name, email,
        phone:  form.phone.trim() || null,
        status: 'invited',
      },
      { onConflict: 'email' }
    );
    if (insertErr) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Could not save client record: ' + insertErr.message });
      return;
    }

    // 2. Trigger Supabase to send the sign-in email.
    const { error: otpErr } = await sb.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: portalUrl,
      },
    });
    if (otpErr) {
      setBusy(false);
      setMsg({ kind: 'err', text: 'Email failed to send: ' + otpErr.message });
      return;
    }

    setBusy(false);
    setMsg({
      kind: 'ok',
      text: `Sign-in email sent to ${email}. They'll get a clickable link plus a 6-digit code.`,
    });
    setForm({ name: '', email: '', phone: '' });
    onInvited && onInvited();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts (no clipboard API).
      const ta = document.createElement('textarea');
      ta.value = portalUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); }
      catch { window.prompt('Copy this URL:', portalUrl); }
      document.body.removeChild(ta);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Invite a new client</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
          Enter their info — we'll create their account, send a sign-in email
          with a clickable link, and run them through the onboarding quiz on
          first login.
        </p>
      </div>

      <form onSubmit={sendInvite} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <input className="field-input" placeholder="Full name" required
          value={form.name} onChange={e => setField('name', e.target.value)} />
        <input className="field-input" placeholder="email@example.com" type="email" required
          value={form.email} onChange={e => setField('email', e.target.value)} />
        <input className="field-input" placeholder="Phone (optional)"
          value={form.phone} onChange={e => setField('phone', e.target.value)} />
      </form>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: msg ? 14 : 0, flexWrap: 'wrap' }}>
        <button type="button" className="btn-blue" disabled={busy} onClick={sendInvite}
          style={{ opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Sending…' : 'Create & send sign-in email'}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        )}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={copy} className="btn-ghost"
          style={{ fontSize: 12 }} title={portalUrl}>
          {copied ? '✓ Copied portal link' : 'Copy portal link'}
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, fontSize: 13, lineHeight: 1.5,
          background: msg.kind === 'ok' ? 'rgba(52,199,89,0.10)' : 'rgba(255,69,58,0.10)',
          border: msg.kind === 'ok' ? '1px solid rgba(52,199,89,0.30)' : '1px solid rgba(255,69,58,0.30)',
          color: msg.kind === 'ok' ? '#34c759' : '#ff453a',
        }}>
          {msg.text}
        </div>
      )}

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
    </div>
  );
}

window.ClientInvite = ClientInvite;
