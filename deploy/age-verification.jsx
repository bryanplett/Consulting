// ────────────────────────────────────────────────────────────────────────────
// PeakForm Bio — Age & Research-Use Verification Gateway
//
// Compliance gate for the client portal. Renders a modal scrim over the
// login screen. Persists acceptance to localStorage (30-day TTL) and writes
// an audit record to the `age_attestations` table for compliance logging.
//
// Exposes to window:
//   window.AgeGateway                 — React component
//   window.ageVerification.isVerified()
//   window.ageVerification.clear()    — for testing / re-verification
//
// Load with:  <script type="text/babel" src="age-verification.jsx"></script>
// ────────────────────────────────────────────────────────────────────────────

(function () {
  const STORAGE_KEY = 'pfb_age_verified_v1';
  const TTL_DAYS = 30;

  // ── Local persistence ─────────────────────────────────────────────────────
  const isVerified = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const { ok, ts } = JSON.parse(raw);
      return !!ok && (Date.now() - ts) < TTL_DAYS * 86400000;
    } catch { return false; }
  };
  const markVerified = (record) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ok: true, ts: Date.now(), ...record
    }));
  };
  const clear = () => localStorage.removeItem(STORAGE_KEY);

  // ── Server-side audit log (best-effort; failure does not block entry) ────
  const logAttestation = async (record) => {
    try {
      const sb = window.supabaseClient;
      if (!sb) return;
      await sb.from('age_attestations').insert({
        dob:           record.dob,            // YYYY-MM-DD
        age_at_attest: record.age,
        user_agent:    navigator.userAgent.slice(0, 500),
        attestations:  record.attestations,   // jsonb { age, research, qualified, terms }
      });
    } catch (e) {
      console.warn('[age-verification] audit log failed:', e?.message);
    }
  };

  // ── Date math ─────────────────────────────────────────────────────────────
  const calcAge = (m, d, y) => {
    const mo = +m, da = +d, yr = +y;
    if (!mo || !da || !yr || mo < 1 || mo > 12 || da < 1 || da > 31 || yr < 1900 || yr > new Date().getFullYear()) return null;
    const dob = new Date(yr, mo - 1, da);
    if (dob.getMonth() !== mo - 1 || dob.getDate() !== da) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const md = now.getMonth() - dob.getMonth();
    if (md < 0 || (md === 0 && now.getDate() < dob.getDate())) age--;
    return age;
  };
  const pad = (n) => String(n).padStart(2, '0');
  const isoDob = (m, d, y) => `${y}-${pad(m)}-${pad(d)}`;

  // ── Icons ────────────────────────────────────────────────────────────────
  const Check = () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const Lock = () => (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6.5 9V6.5C6.5 4.567 8.067 3 10 3C11.933 3 13.5 4.567 13.5 6.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  // ── Attestation row ──────────────────────────────────────────────────────
  const Attestation = ({ checked, onToggle, children }) => (
    <label className={`av-att ${checked ? 'checked' : ''}`}>
      <input type="checkbox" checked={checked} onChange={onToggle} />
      <div className="av-att-box"><Check /></div>
      <div className="av-att-text">{children}</div>
    </label>
  );

  // ── Gateway form ─────────────────────────────────────────────────────────
  const Gateway = ({ onAccept, onDecline }) => {
    const [m, setM] = React.useState('');
    const [d, setD] = React.useState('');
    const [y, setY] = React.useState('');
    const [att1, setAtt1] = React.useState(false);
    const [att2, setAtt2] = React.useState(false);
    const [att3, setAtt3] = React.useState(false);
    const [touched, setTouched] = React.useState(false);
    const [submitting, setSubmitting] = React.useState(false);

    const refD = React.useRef(null), refY = React.useRef(null);

    const age = React.useMemo(() => calcAge(m, d, y), [m, d, y]);
    const dobComplete = m.length >= 1 && d.length >= 1 && y.length === 4;
    const ageOk = age !== null && age >= 21;
    const canSubmit = ageOk && att1 && att2 && att3 && !submitting;

    const handleM = (e) => {
      const v = e.target.value.replace(/\D/g, '').slice(0, 2);
      setM(v); setTouched(true);
      if (v.length === 2) refD.current?.focus();
    };
    const handleD = (e) => {
      const v = e.target.value.replace(/\D/g, '').slice(0, 2);
      setD(v); setTouched(true);
      if (v.length === 2) refY.current?.focus();
    };
    const handleY = (e) => {
      setY(e.target.value.replace(/\D/g, '').slice(0, 4));
      setTouched(true);
    };

    const submit = async (e) => {
      e.preventDefault();
      if (!canSubmit) return;
      setSubmitting(true);
      const record = {
        dob: isoDob(m, d, y),
        age,
        attestations: { age_21: att1, research_use: att2, qualified: att3 },
      };
      await logAttestation(record);  // best-effort audit log
      markVerified(record);
      onAccept();
    };

    return (
      <form className="av-gateway" onSubmit={submit}>
        <div className="av-head">
          <img className="av-logo" src="1_5058098532557259934/PNG/VV/Asset 1@4x.png" alt="PeakForm Bio" />
          <div className="av-eyebrow">
            <span className="av-dot"></span> Restricted Access
          </div>
          <h1 className="av-title">Age &amp; Research-Use Verification</h1>
          <p className="av-sub">
            Before entering the client portal, please verify your age and acknowledge the
            intended use of products offered on this site.
          </p>
        </div>

        <div className="av-body">
          <label className="av-field-label" htmlFor="av-dob-m">Date of birth</label>
          <div className="av-dob-row">
            <input ref={null} id="av-dob-m" className="av-dob-input" inputMode="numeric"
              placeholder="MM" value={m} onChange={handleM} autoComplete="bday-month" aria-label="Month" />
            <input ref={refD} className="av-dob-input" inputMode="numeric"
              placeholder="DD" value={d} onChange={handleD} autoComplete="bday-day" aria-label="Day" />
            <input ref={refY} className="av-dob-input" inputMode="numeric"
              placeholder="YYYY" value={y} onChange={handleY} autoComplete="bday-year" aria-label="Year" />
          </div>

          {touched && dobComplete && age !== null && !ageOk && (
            <div className="av-dob-error">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#ff6b6b" strokeWidth="1.4"/>
                <path d="M7 4v3.5M7 9.5v.5" stroke="#ff6b6b" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              You must be at least 21 years of age to access this portal.
            </div>
          )}
          {touched && dobComplete && age === null && (
            <div className="av-dob-error">Please enter a valid date.</div>
          )}
          {ageOk && (
            <div className="av-dob-ok">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#4ade80" strokeWidth="1.4"/>
                <path d="M4.5 7L6.3 8.8L9.5 5.5" stroke="#4ade80" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Age verified.
            </div>
          )}

          <div className="av-attestations">
            <Attestation checked={att1} onToggle={() => setAtt1(v => !v)}>
              I am at least <strong>21 years of age</strong> and legally able to enter into binding agreements.
            </Attestation>
            <Attestation checked={att2} onToggle={() => setAtt2(v => !v)}>
              I understand all products are sold strictly <strong>for laboratory and in&#8209;vitro research use only</strong>—
              <strong> not for human or animal consumption</strong>, diagnostic, or therapeutic use.
            </Attestation>
            <Attestation checked={att3} onToggle={() => setAtt3(v => !v)}>
              I am a <strong>qualified researcher</strong>, licensed professional, or affiliated with a research
              institution, and I assume full responsibility for the handling and use of any product purchased.
            </Attestation>
          </div>

          <div className="av-disclosure">
            <div className="av-disclosure-title">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5L1.5 12h11L7 1.5z" stroke="#ffb020" strokeWidth="1.3" strokeLinejoin="round"/>
                <path d="M7 5.5v3M7 10v.4" stroke="#ffb020" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              FDA Disclosure
            </div>
            Products listed on this site are research chemicals that have <strong style={{color:'#f5f5f7'}}>not been
            evaluated or approved by the U.S. Food and Drug Administration</strong>. They are not intended to
            diagnose, treat, cure, or prevent any disease, and are not for use in food, cosmetics, or
            pharmaceutical applications.
          </div>
        </div>

        <div className="av-foot">
          <div className="av-btns">
            <button type="button" className="av-btn-decline" onClick={onDecline}>
              Decline &amp; Exit
            </button>
            <button type="submit" className="av-btn-enter" disabled={!canSubmit}>
              <Lock />
              {submitting ? 'Verifying…' : 'Verify & Enter Portal'}
            </button>
          </div>
          <p className="av-micro">
            By entering, you agree to our <a href="/terms">Terms of Service</a>, <a href="/privacy">Privacy Policy</a>,
            and <a href="/research-use-license">Research-Use License</a>. This attestation is logged and remains valid for 30 days.
          </p>
        </div>
      </form>
    );
  };

  // ── Declined screen ──────────────────────────────────────────────────────
  const Declined = ({ onRetry }) => (
    <div className="av-gateway">
      <div className="av-declined">
        <div className="av-declined-icon">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="11" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 9l8 8M17 9l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3>Access not permitted</h3>
        <p>
          You must affirm the age and research-use requirements to access the client portal.
          If you reached this page in error, you may try again.
        </p>
        <button className="av-btn-secondary" onClick={onRetry}>Try again</button>
      </div>
    </div>
  );

  // ── Top-level wrapper component (scrim + state machine) ──────────────────
  const AgeGateway = ({ onAccept, onDecline }) => {
    const [state, setState] = React.useState('gateway'); // 'gateway' | 'declined'

    const decline = () => {
      setState('declined');
      onDecline && onDecline();
    };

    return (
      <div className="av-scrim" role="dialog" aria-modal="true" aria-labelledby="av-title">
        {state === 'gateway' && <Gateway onAccept={onAccept} onDecline={decline} />}
        {state === 'declined' && <Declined onRetry={() => setState('gateway')} />}
      </div>
    );
  };

  // ── Inject styles once ───────────────────────────────────────────────────
  if (!document.getElementById('av-styles')) {
    const style = document.createElement('style');
    style.id = 'av-styles';
    style.textContent = `
      .av-scrim {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.72);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
        display: flex; align-items: center; justify-content: center;
        padding: 24px; z-index: 9999;
        overflow-y: auto;
        font-family: "Inter", system-ui, -apple-system, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .av-gateway {
        width: 100%; max-width: 520px;
        background: #141416;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 22px;
        overflow: hidden;
        box-shadow:
          0 1px 0 0 rgba(255,255,255,0.04) inset,
          0 30px 80px -20px rgba(0,0,0,0.7),
          0 0 0 1px rgba(255,255,255,0.02);
        animation: avIn 0.32s cubic-bezier(0.2, 0.8, 0.2, 1);
        margin: auto; color: #f5f5f7;
      }
      @keyframes avIn {
        from { opacity: 0; transform: translateY(12px) scale(0.985); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .av-head {
        padding: 36px 36px 24px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        text-align: center;
      }
      .av-logo { height: 64px; margin: 0 auto 18px; display: block; }
      .av-eyebrow {
        display: inline-flex; align-items: center; gap: 8px;
        padding: 5px 12px; border-radius: 980px;
        background: rgba(255,176,32,0.10);
        border: 1px solid rgba(255,176,32,0.28);
        color: #ffb020;
        font-size: 11px; font-weight: 600;
        letter-spacing: 0.08em; text-transform: uppercase;
        margin-bottom: 14px;
      }
      .av-dot { width: 6px; height: 6px; border-radius: 50%; background: #ffb020; box-shadow: 0 0 8px rgba(255,176,32,0.7); }
      .av-title { font-size: 24px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; color: #f5f5f7; margin-bottom: 10px; }
      .av-sub { font-size: 14px; line-height: 1.55; color: rgba(255,255,255,0.55); max-width: 380px; margin: 0 auto; }
      .av-body { padding: 28px 36px 8px; }
      .av-field-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: rgba(255,255,255,0.55); margin-bottom: 10px; }
      .av-dob-row { display: grid; grid-template-columns: 1.2fr 1fr 1.3fr; gap: 10px; }
      .av-dob-input {
        width: 100%;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 10px;
        padding: 13px 14px;
        color: #f5f5f7; font-size: 15px;
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
        text-align: center;
        font-variant-numeric: tabular-nums;
        font-family: inherit;
      }
      .av-dob-input::placeholder { color: rgba(255,255,255,0.28); letter-spacing: 0.04em; }
      .av-dob-input:focus {
        border-color: #2997ff;
        box-shadow: 0 0 0 3px rgba(41,151,255,0.14);
        background: rgba(255,255,255,0.06);
      }
      .av-dob-error { margin-top: 10px; font-size: 13px; color: #ff6b6b; display: flex; align-items: center; gap: 6px; }
      .av-dob-ok    { margin-top: 10px; font-size: 13px; color: #4ade80; display: flex; align-items: center; gap: 6px; }
      .av-attestations { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }
      .av-att {
        display: flex; gap: 12px; align-items: flex-start;
        padding: 14px;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        user-select: none;
        position: relative;
      }
      .av-att:hover { background: rgba(255,255,255,0.035); border-color: rgba(255,255,255,0.10); }
      .av-att.checked { background: rgba(0,102,204,0.07); border-color: rgba(41,151,255,0.35); }
      .av-att-box {
        flex-shrink: 0;
        width: 20px; height: 20px;
        border-radius: 6px;
        border: 1.5px solid rgba(255,255,255,0.22);
        background: rgba(255,255,255,0.02);
        display: flex; align-items: center; justify-content: center;
        margin-top: 1px;
        transition: all 0.15s;
      }
      .av-att.checked .av-att-box { background: #0066cc; border-color: #0066cc; }
      .av-att-box svg { opacity: 0; transform: scale(0.6); transition: all 0.15s; }
      .av-att.checked .av-att-box svg { opacity: 1; transform: scale(1); }
      .av-att-text { font-size: 14px; line-height: 1.5; color: rgba(255,255,255,0.82); letter-spacing: -0.005em; }
      .av-att-text strong { color: #f5f5f7; font-weight: 600; }
      .av-att input { position: absolute; opacity: 0; pointer-events: none; }
      .av-disclosure {
        margin-top: 22px;
        padding: 16px 18px;
        background: rgba(255,176,32,0.06);
        border: 1px solid rgba(255,176,32,0.18);
        border-radius: 12px;
        font-size: 12.5px; line-height: 1.55;
        color: rgba(255,255,255,0.72);
      }
      .av-disclosure-title { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #ffb020; margin-bottom: 6px; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; }
      .av-foot { padding: 20px 36px 28px; display: flex; flex-direction: column; gap: 14px; }
      .av-btns { display: flex; gap: 10px; }
      .av-btn-enter {
        flex: 1;
        background: #0066cc; color: #fff;
        border: none; border-radius: 12px;
        padding: 14px 20px;
        font-size: 15px; font-weight: 500; letter-spacing: -0.01em;
        cursor: pointer;
        transition: background 0.15s, transform 0.1s, opacity 0.15s;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        font-family: inherit;
      }
      .av-btn-enter:hover:not(:disabled) { background: #1a78d6; }
      .av-btn-enter:active:not(:disabled) { transform: scale(0.985); }
      .av-btn-enter:disabled { opacity: 0.4; cursor: not-allowed; }
      .av-btn-decline {
        background: transparent; color: rgba(255,255,255,0.55);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 12px;
        padding: 14px 20px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
      }
      .av-btn-decline:hover { color: #f5f5f7; border-color: rgba(255,255,255,0.18); background: rgba(255,255,255,0.02); }
      .av-micro { font-size: 11px; line-height: 1.55; color: rgba(255,255,255,0.4); text-align: center; letter-spacing: -0.005em; }
      .av-micro a { color: rgba(255,255,255,0.6); text-decoration: underline; text-decoration-color: rgba(255,255,255,0.2); }
      .av-micro a:hover { color: #2997ff; text-decoration-color: #2997ff; }
      .av-declined { text-align: center; padding: 56px 36px; }
      .av-declined-icon {
        width: 56px; height: 56px; margin: 0 auto 22px;
        border-radius: 50%;
        background: rgba(255,107,107,0.12);
        border: 1px solid rgba(255,107,107,0.3);
        display: flex; align-items: center; justify-content: center;
        color: #ff6b6b;
      }
      .av-declined h3 { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; margin-bottom: 10px; }
      .av-declined p  { font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.55); max-width: 360px; margin: 0 auto 24px; }
      .av-btn-secondary {
        background: rgba(255,255,255,0.06); color: #f5f5f7;
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 980px;
        padding: 10px 22px; font-size: 14px;
        cursor: pointer; transition: background 0.15s;
        font-family: inherit;
      }
      .av-btn-secondary:hover { background: rgba(255,255,255,0.10); }
      @media (max-width: 540px) {
        .av-head, .av-body, .av-foot { padding-left: 22px; padding-right: 22px; }
        .av-btns { flex-direction: column-reverse; }
        .av-title { font-size: 21px; }
      }
    `;
    document.head.appendChild(style);
  }

  // ── Expose globals ───────────────────────────────────────────────────────
  window.AgeGateway = AgeGateway;
  window.ageVerification = { isVerified, clear };
})();
