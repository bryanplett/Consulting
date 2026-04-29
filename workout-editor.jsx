// ─── Workout Editor ───────────────────────────────────────────────────────────
// Edits workout_plans.plan_data as a structured JSON array of 7 days.
// Day shape:
//   { day: 'Monday', focus: 'Chest & Triceps', restDay: false,
//     warmup: '5 min row + dynamic stretch',
//     cooldown: 'Foam roll 5 min',
//     exercises: [{ name, sets, reps, rest, weight, tempo, notes }] }

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const emptyExercise = () => ({ name:'', sets:'', reps:'', rest:'', weight:'', tempo:'', notes:'' });
const emptyDay = (day) => ({ day, focus:'', restDay:false, warmup:'', cooldown:'', exercises:[] });
const emptyWeek = () => DAYS.map(emptyDay);

// Normalize incoming plan_data to the new shape (handles legacy without restDay/warmup/cooldown)
const normalizeWeek = (raw) => {
  if (!Array.isArray(raw) || raw.length === 0) return emptyWeek();
  return DAYS.map((d, i) => {
    const src = raw[i] || {};
    return {
      day: src.day || d,
      focus: src.focus || '',
      restDay: src.restDay ?? (Array.isArray(src.exercises) && src.exercises.length === 0 && /rest/i.test(src.focus || '')),
      restMessage: src.restMessage || '',
      warmup: src.warmup || '',
      cooldown: src.cooldown || '',
      exercises: (src.exercises || []).map(ex => ({
        name: ex.name || '', sets: ex.sets ?? '', reps: ex.reps || '', rest: ex.rest || '',
        weight: ex.weight || '', tempo: ex.tempo || '', notes: ex.notes || '',
      })),
    };
  });
};

// ─── Autocomplete Input ───────────────────────────────────────────────────────
const ExerciseAutocomplete = ({ value, onChange, exercises }) => {
  const [open, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(0);
  const ref = React.useRef(null);

  const matches = React.useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return [];
    return exercises.filter(e => e.name.toLowerCase().includes(q)).slice(0, 6);
  }, [value, exercises]);

  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (name) => { onChange(name); setOpen(false); };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input className="field-input" placeholder="Exercise name" value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (!open || matches.length === 0) return;
          if (e.key === 'ArrowDown') { e.preventDefault(); setHi(h => Math.min(h+1, matches.length-1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(h => Math.max(h-1, 0)); }
          else if (e.key === 'Enter') { e.preventDefault(); pick(matches[hi].name); }
          else if (e.key === 'Escape') { setOpen(false); }
        }}
        style={{ padding: '8px 10px', fontSize: 14 }} />
      {open && matches.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#1a1a1c', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8,
          marginTop: 4, padding: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: 220, overflowY: 'auto',
        }}>
          {matches.map((m, i) => (
            <button key={m.id || m.name} type="button" onMouseDown={(e)=>e.preventDefault()} onClick={() => pick(m.name)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 14,
                background: i === hi ? 'rgba(41,151,255,0.18)' : 'transparent',
                color: '#f5f5f7',
              }}>
              {m.name}
              {m.category && <span style={{ marginLeft: 8, fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{m.category}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Modal shell ──────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, width = 460 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} className="card fade-in" style={{ width: '100%', maxWidth: width }}>
        {title && <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 18, letterSpacing: '-0.02em' }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
};

// ─── Workout Editor ───────────────────────────────────────────────────────────
const WorkoutEditor = ({ sb, client, onBack }) => {
  const [planId, setPlanId] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [goal, setGoal] = React.useState('Hypertrophy');
  const [limitations, setLimitations] = React.useState('');
  const [week, setWeek] = React.useState(emptyWeek());
  const [activeDay, setActiveDay] = React.useState(0);
  const [exercises, setExercises] = React.useState([]);
  const [templates, setTemplates] = React.useState([]);
  const [updatedAt, setUpdatedAt] = React.useState(null);

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState('');
  const [notify, setNotify] = React.useState(false);

  const [copyOpen, setCopyOpen] = React.useState(false);
  const [tmplLoadOpen, setTmplLoadOpen] = React.useState(false);
  const [tmplSaveOpen, setTmplSaveOpen] = React.useState(false);
  const [tmplName, setTmplName] = React.useState('');

  // Drag-and-drop state for exercise rows
  const dragIdx = React.useRef(null);

  // Load everything
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [planRes, exRes, tmplRes] = await Promise.all([
          sb.from('workout_plans').select('*').eq('client_id', client.id).eq('active', true).order('created_at', { ascending:false }).limit(1),
          sb.from('exercises').select('*').order('name'),
          sb.from('plan_templates').select('*').eq('kind','workout').order('name'),
        ]);
        if (cancelled) return;
        const plan = (planRes.data || [])[0];
        if (plan) {
          setPlanId(plan.id);
          setTitle(plan.title || '');
          setGoal(plan.goal || 'Hypertrophy');
          setLimitations(plan.limitations || '');
          setWeek(normalizeWeek(plan.plan_data));
          setUpdatedAt(plan.updated_at || plan.created_at);
        } else {
          setWeek(emptyWeek());
        }
        setExercises(exRes.data || []);
        setTemplates(tmplRes.data || []);
      } catch (err) {
        console.error('Workout editor load failed:', err);
        setSaveMsg('Error loading: ' + (err.message || err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [client.id, sb]);

  // Day mutations
  const updateDay = (i, patch) => setWeek(w => w.map((d, idx) => idx === i ? { ...d, ...patch } : d));
  const updateExercise = (di, ei, patch) => {
    setWeek(w => w.map((d, idx) => {
      if (idx !== di) return d;
      return { ...d, exercises: d.exercises.map((ex, ej) => ej === ei ? { ...ex, ...patch } : ex) };
    }));
  };
  const addExercise = (di) => updateDay(di, { exercises: [...week[di].exercises, emptyExercise()] });
  const removeExercise = (di, ei) => updateDay(di, { exercises: week[di].exercises.filter((_, ej) => ej !== ei) });

  // Drag & drop reordering (within a day)
  const onDragStart = (i) => { dragIdx.current = i; };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (di, dropIdx) => {
    const from = dragIdx.current;
    if (from == null || from === dropIdx) return;
    const list = [...week[di].exercises];
    const [moved] = list.splice(from, 1);
    list.splice(dropIdx, 0, moved);
    updateDay(di, { exercises: list });
    dragIdx.current = null;
  };

  // Copy day to another
  const copyDay = (toIdx) => {
    const src = week[activeDay];
    setWeek(w => w.map((d, idx) => idx === toIdx ? {
      ...src, day: w[idx].day, exercises: src.exercises.map(e => ({...e})),
    } : d));
    setCopyOpen(false);
  };

  // Save plan
  const save = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const payload = {
        client_id: client.id,
        title: title || 'Workout Plan',
        goal,
        limitations: limitations || null,
        plan_data: week,
        active: true,
        updated_at: new Date().toISOString(),
      };
      let res;
      if (planId) {
        res = await sb.from('workout_plans').update(payload).eq('id', planId).select().single();
      } else {
        res = await sb.from('workout_plans').insert(payload).select().single();
      }
      if (res.error) throw res.error;
      setPlanId(res.data.id);
      setUpdatedAt(res.data.updated_at);
      setSaveMsg('Saved.');

      if (notify) {
        // 1. In-portal banner: insert a notification row (best effort)
        try {
          await sb.from('client_notifications').insert({
            client_id: client.id, kind: 'workout_updated',
            message: 'Your workout plan was updated.',
          });
        } catch (e) { console.warn('notif insert failed', e); }

        // 2. Email via Formspree
        try {
          await fetch('https://formspree.io/f/xojyzgbq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              _subject: `Workout plan updated for ${client.name}`,
              client_name: client.name, client_email: client.email,
              kind: 'workout_updated', updated_at: new Date().toISOString(),
            }),
          });
        } catch (e) { console.warn('formspree failed', e); }
      }

      setTimeout(() => setSaveMsg(''), 2500);
    } catch (err) {
      setSaveMsg('Error: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Templates
  const saveTemplate = async () => {
    if (!tmplName.trim()) return;
    try {
      await sb.from('plan_templates').insert({
        kind: 'workout', name: tmplName.trim(),
        plan_data: week,
        meta: { goal, limitations },
      });
      const { data } = await sb.from('plan_templates').select('*').eq('kind','workout').order('name');
      setTemplates(data || []);
      setTmplSaveOpen(false); setTmplName('');
      setSaveMsg('Template saved.');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg('Error: ' + (err.message || err));
    }
  };
  const loadTemplate = (t) => {
    setWeek(normalizeWeek(t.plan_data));
    if (t.meta?.goal) setGoal(t.meta.goal);
    setTmplLoadOpen(false);
    setSaveMsg('Template loaded — review then Save.');
    setTimeout(() => setSaveMsg(''), 3000);
  };

  if (loading) {
    return (
      <div className="fade-in">
        <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 20 }}>← Back</button>
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading…</div>
      </div>
    );
  }

  const day = week[activeDay];

  return (
    <div className="fade-in">
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 16 }}>← Back to client</button>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>Edit Workout · {client.name}</p>
          <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.025em', marginTop: 4 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Plan title (e.g. PPL Hypertrophy)"
              style={{
                background: 'transparent', border: 'none', color: '#f5f5f7', fontSize: 26, fontWeight: 600,
                fontFamily: 'inherit', letterSpacing: '-0.025em', outline: 'none', minWidth: 360, padding: '2px 0',
                borderBottom: '1px dashed rgba(255,255,255,0.12)',
              }} />
          </h2>
          {updatedAt && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>Last updated {new Date(updatedAt).toLocaleString()}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => setTmplLoadOpen(true)}>Load template</button>
          <button className="btn-ghost" onClick={() => setTmplSaveOpen(true)}>Save as template</button>
        </div>
      </div>

      {/* Goal + limitations */}
      <div className="card" style={{ marginBottom: 18, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.6)' }}>Training Goal</label>
          <select className="field-input" value={goal} onChange={e => setGoal(e.target.value)}>
            {['Strength','Hypertrophy','Fat Loss','Sport-Specific','General Fitness'].map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6, color: 'rgba(255,255,255,0.6)' }}>Injuries / Limitations</label>
          <input className="field-input" value={limitations} onChange={e => setLimitations(e.target.value)}
            placeholder="e.g. Avoid overhead pressing, left knee meniscus" />
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {week.map((d, i) => (
          <button key={i} onClick={() => setActiveDay(i)}
            style={{
              borderRadius: 980, padding: '8px 16px', fontSize: 13, cursor: 'pointer', border: 'none',
              fontFamily: 'inherit', fontWeight: activeDay === i ? 600 : 400,
              background: activeDay === i ? '#0066cc' : 'rgba(255,255,255,0.07)',
              color: activeDay === i ? '#fff' : 'rgba(255,255,255,0.7)',
              transition: 'all 0.12s',
            }}>
            <span>{d.day.slice(0,3)}</span>
            {d.restDay && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>•R</span>}
            {!d.restDay && d.exercises.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>{d.exercises.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Active day */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600 }}>{day.day}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
              <input type="checkbox" checked={day.restDay} onChange={e => updateDay(activeDay, { restDay: e.target.checked })}
                style={{ accentColor: '#0066cc' }} />
              Rest day
            </label>
            <button className="btn-ghost" onClick={() => setCopyOpen(true)} style={{ padding: '7px 14px', fontSize: 13 }}>Copy day to…</button>
          </div>
        </div>

        {!day.restDay ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Workout title / focus</label>
                <input className="field-input" value={day.focus} onChange={e => updateDay(activeDay, { focus: e.target.value })}
                  placeholder="e.g. Upper Body Push" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Warm-up</label>
                <input className="field-input" value={day.warmup} onChange={e => updateDay(activeDay, { warmup: e.target.value })}
                  placeholder="5 min row + dynamic stretch" />
              </div>
            </div>

            {/* Exercise rows */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {[' ','Exercise','Sets','Reps','Rest','Weight','Tempo','Notes',''].map((h, i) => (
                      <th key={i} style={{
                        padding: '8px 6px', textAlign: 'left', fontSize: 11, fontWeight: 600,
                        color: 'rgba(255,255,255,0.45)', letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 22, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                      No exercises yet. Click "Add exercise" below.
                    </td></tr>
                  )}
                  {day.exercises.map((ex, ei) => (
                    <tr key={ei}
                      draggable onDragStart={() => onDragStart(ei)} onDragOver={onDragOver} onDrop={() => onDrop(activeDay, ei)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '8px 6px', cursor: 'grab', color: 'rgba(255,255,255,0.3)', userSelect: 'none', textAlign: 'center', width: 24 }}>⋮⋮</td>
                      <td style={{ padding: '8px 6px', minWidth: 180 }}>
                        <ExerciseAutocomplete value={ex.name} onChange={v => updateExercise(activeDay, ei, { name: v })} exercises={exercises} />
                      </td>
                      <td style={{ padding: '8px 6px', width: 70 }}>
                        <input className="field-input" value={ex.sets} onChange={e => updateExercise(activeDay, ei, { sets: e.target.value })} style={{ padding: '8px 10px', fontSize: 14 }} />
                      </td>
                      <td style={{ padding: '8px 6px', width: 90 }}>
                        <input className="field-input" value={ex.reps} onChange={e => updateExercise(activeDay, ei, { reps: e.target.value })} placeholder="8–10" style={{ padding: '8px 10px', fontSize: 14 }} />
                      </td>
                      <td style={{ padding: '8px 6px', width: 80 }}>
                        <input className="field-input" value={ex.rest} onChange={e => updateExercise(activeDay, ei, { rest: e.target.value })} placeholder="90s" style={{ padding: '8px 10px', fontSize: 14 }} />
                      </td>
                      <td style={{ padding: '8px 6px', width: 90 }}>
                        <input className="field-input" value={ex.weight} onChange={e => updateExercise(activeDay, ei, { weight: e.target.value })} placeholder="—" style={{ padding: '8px 10px', fontSize: 14 }} />
                      </td>
                      <td style={{ padding: '8px 6px', width: 80 }}>
                        <input className="field-input" value={ex.tempo} onChange={e => updateExercise(activeDay, ei, { tempo: e.target.value })} placeholder="3-1-1" style={{ padding: '8px 10px', fontSize: 14 }} />
                      </td>
                      <td style={{ padding: '8px 6px', minWidth: 160 }}>
                        <input className="field-input" value={ex.notes} onChange={e => updateExercise(activeDay, ei, { notes: e.target.value })} placeholder="Focus on eccentric" style={{ padding: '8px 10px', fontSize: 14 }} />
                      </td>
                      <td style={{ padding: '8px 6px', width: 36, textAlign: 'right' }}>
                        <button onClick={() => removeExercise(activeDay, ei)} aria-label="Remove"
                          style={{ background: 'rgba(255,59,48,0.12)', color: '#ff453a', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', fontSize: 14 }}>
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => addExercise(activeDay)} className="btn-ghost" style={{ marginTop: 14 }}>+ Add exercise</button>

            <div style={{ marginTop: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>Cool-down / mobility</label>
              <input className="field-input" value={day.cooldown} onChange={e => updateDay(activeDay, { cooldown: e.target.value })}
                placeholder="Foam roll quads, hip flexor stretch 2×60s" />
            </div>
          </>
        ) : (
          <div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>
              This day is marked as a rest day. Optionally write a custom message the client will see.
            </p>
            <input className="field-input" value={day.restMessage || ''} onChange={e => updateDay(activeDay, { restMessage: e.target.value })}
              placeholder="Rest day. Recovery is training." />
          </div>
        )}
      </div>

      {/* Save bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button onClick={save} disabled={saving} className="btn-blue" style={{ opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : 'Save plan'}
        </button>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}>
          <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} style={{ accentColor: '#0066cc' }} />
          Notify client
        </label>
        {saveMsg && (
          <span style={{ fontSize: 13, color: saveMsg.startsWith('Error') ? '#ff453a' : '#34c759' }}>{saveMsg}</span>
        )}
      </div>

      {/* Copy day modal */}
      <Modal open={copyOpen} onClose={() => setCopyOpen(false)} title={`Copy ${day.day} to…`} width={380}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {DAYS.map((d, i) => i !== activeDay && (
            <button key={i} className="btn-ghost" onClick={() => copyDay(i)}>{d}</button>
          ))}
        </div>
      </Modal>

      {/* Save template modal */}
      <Modal open={tmplSaveOpen} onClose={() => setTmplSaveOpen(false)} title="Save week as template" width={400}>
        <input className="field-input" autoFocus placeholder="e.g. PPL 6-day Hypertrophy"
          value={tmplName} onChange={e => setTmplName(e.target.value)} style={{ marginBottom: 14 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-blue" onClick={saveTemplate} disabled={!tmplName.trim()}>Save template</button>
          <button className="btn-ghost" onClick={() => setTmplSaveOpen(false)}>Cancel</button>
        </div>
      </Modal>

      {/* Load template modal */}
      <Modal open={tmplLoadOpen} onClose={() => setTmplLoadOpen(false)} title="Load template" width={460}>
        {templates.length === 0 ? (
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>No workout templates yet. Build a week and click "Save as template".</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
            {templates.map(t => (
              <button key={t.id} onClick={() => loadTemplate(t)}
                style={{
                  textAlign: 'left', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit', color: '#f5f5f7',
                }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  {t.meta?.goal || ''} · saved {new Date(t.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

window.WorkoutEditor = WorkoutEditor;
