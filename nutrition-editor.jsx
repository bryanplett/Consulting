// ─── Nutrition Editor ─────────────────────────────────────────────────────────
// Edits nutrition_plans.plan_data as 7-day grid.
// Day shape: { day, meals: [{ name, items: [{ ingredient, qty, unit, calories, protein, carbs, fat }] }] }

const NDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEAL_SLOTS = ['Breakfast','Lunch','Snack','Dinner'];

const emptyItem = () => ({ ingredient:'', qty:'', unit:'g', calories:'', protein:'', carbs:'', fat:'' });
const emptyMeal = (name) => ({ name, items: [] });
const emptyNDay = (day) => ({ day, meals: MEAL_SLOTS.map(emptyMeal) });
const emptyNWeek = () => NDAYS.map(emptyNDay);

const normalizeNWeek = (raw) => {
  if (!Array.isArray(raw) || raw.length === 0) return emptyNWeek();
  return NDAYS.map((d, i) => {
    const src = raw[i] || {};
    // legacy: { day, meals: [string, string, ...] } — convert to structured
    if (Array.isArray(src.meals) && src.meals.length && typeof src.meals[0] === 'string') {
      return { day: src.day || d, meals: src.meals.map((m, j) => ({
        name: MEAL_SLOTS[j] || `Meal ${j+1}`,
        items: [{ ingredient: m, qty:'', unit:'', calories:'', protein:'', carbs:'', fat:'' }],
      })) };
    }
    return {
      day: src.day || d,
      meals: (src.meals && src.meals.length ? src.meals : MEAL_SLOTS.map(emptyMeal)).map(m => ({
        name: m.name || 'Meal',
        items: (m.items || []).map(it => ({
          ingredient: it.ingredient || '', qty: it.qty ?? '', unit: it.unit || 'g',
          calories: it.calories ?? '', protein: it.protein ?? '', carbs: it.carbs ?? '', fat: it.fat ?? '',
        })),
      })),
    };
  });
};

const num = (v) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

const IngredientAutocomplete = ({ value, onPick, ingredients }) => {
  const [open, setOpen] = React.useState(false);
  const [hi, setHi] = React.useState(0);
  const ref = React.useRef(null);
  const matches = React.useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) return [];
    return ingredients.filter(i => i.name.toLowerCase().includes(q)).slice(0, 6);
  }, [value, ingredients]);
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input className="field-input" placeholder="Ingredient" value={value}
        onChange={e => { onPick({ ingredient: e.target.value }, false); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={e => {
          if (!open || matches.length === 0) return;
          if (e.key==='ArrowDown'){ e.preventDefault(); setHi(h=>Math.min(h+1,matches.length-1)); }
          else if (e.key==='ArrowUp'){ e.preventDefault(); setHi(h=>Math.max(h-1,0)); }
          else if (e.key==='Enter'){ e.preventDefault(); onPick(matches[hi], true); setOpen(false); }
        }}
        style={{ padding: '8px 10px', fontSize: 14 }} />
      {open && matches.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:50, background:'#1a1a1c',
          border:'1px solid rgba(255,255,255,0.10)', borderRadius:8, marginTop:4, padding:4,
          boxShadow:'0 8px 24px rgba(0,0,0,0.5)', maxHeight:220, overflowY:'auto' }}>
          {matches.map((m, i) => (
            <button key={m.id||m.name} type="button" onMouseDown={e=>e.preventDefault()}
              onClick={() => onPick(m, true)}
              style={{ display:'block', width:'100%', textAlign:'left', padding:'8px 10px', borderRadius:6,
                border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:14,
                background: i===hi ? 'rgba(41,151,255,0.18)' : 'transparent', color:'#f5f5f7' }}>
              {m.name}
              <span style={{ marginLeft:8, fontSize:11, color:'rgba(255,255,255,0.45)' }}>
                {m.calories_per_100g ? `${m.calories_per_100g}kcal/100${m.unit||'g'}` : ''}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const NModal = ({ open, onClose, title, children, width = 460 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)',
      backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}>
      <div onClick={e=>e.stopPropagation()} className="card fade-in" style={{ width:'100%', maxWidth:width }}>
        {title && <h3 style={{ fontSize:18, fontWeight:600, marginBottom:18, letterSpacing:'-0.02em' }}>{title}</h3>}
        {children}
      </div>
    </div>
  );
};

const macroVarColor = (actual, target) => {
  if (!target) return 'rgba(255,255,255,0.5)';
  const pct = Math.abs(actual - target) / target;
  if (pct <= 0.05) return '#34c759';
  if (pct <= 0.15) return '#ff9f0a';
  return '#ff453a';
};

const NutritionEditor = ({ sb, client, onBack }) => {
  const [planId, setPlanId] = React.useState(null);
  const [title, setTitle] = React.useState('');
  const [goal, setGoal] = React.useState('Maintenance');
  const [target, setTarget] = React.useState({ calories:'', protein:'', carbs:'', fat:'' });
  const [week, setWeek] = React.useState(emptyNWeek());
  const [activeDay, setActiveDay] = React.useState(0);
  const [ingredients, setIngredients] = React.useState([]);
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

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [planRes, ingRes, tmplRes] = await Promise.all([
          sb.from('nutrition_plans').select('*').eq('client_id', client.id).eq('active', true).order('created_at',{ascending:false}).limit(1),
          sb.from('ingredients').select('*').order('name'),
          sb.from('plan_templates').select('*').eq('kind','nutrition').order('name'),
        ]);
        if (cancelled) return;
        const p = (planRes.data || [])[0];
        if (p) {
          setPlanId(p.id);
          setTitle(p.title || '');
          setGoal(p.goal || 'Maintenance');
          setTarget({
            calories: p.daily_calories ?? '', protein: p.protein_g ?? '',
            carbs: p.carbs_g ?? '', fat: p.fats_g ?? '',
          });
          setWeek(normalizeNWeek(p.plan_data));
          setUpdatedAt(p.updated_at || p.created_at);
        }
        setIngredients(ingRes.data || []);
        setTemplates(tmplRes.data || []);
      } catch (err) { setSaveMsg('Error loading: ' + (err.message||err)); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [client.id, sb]);

  const updateDay = (i, patch) => setWeek(w => w.map((d,idx) => idx===i ? {...d,...patch} : d));
  const updateMeal = (di, mi, patch) => updateDay(di, { meals: week[di].meals.map((m,j)=>j===mi?{...m,...patch}:m) });
  const updateItem = (di, mi, ii, patch) => updateMeal(di, mi, {
    items: week[di].meals[mi].items.map((it,j)=>j===ii?{...it,...patch}:it)
  });
  const addItem = (di, mi) => updateMeal(di, mi, { items: [...week[di].meals[mi].items, emptyItem()] });
  const removeItem = (di, mi, ii) => updateMeal(di, mi, { items: week[di].meals[mi].items.filter((_,j)=>j!==ii) });
  const addMeal = (di) => updateDay(di, { meals: [...week[di].meals, emptyMeal('Meal')] });

  const pickIngredient = (di, mi, ii, picked, fillMacros) => {
    const patch = { ingredient: picked.name || picked.ingredient || '' };
    if (fillMacros && picked.calories_per_100g != null) {
      // Default 100g serving with macros from DB
      patch.qty = '100'; patch.unit = picked.unit || 'g';
      patch.calories = picked.calories_per_100g;
      patch.protein = picked.protein_per_100g ?? '';
      patch.carbs = picked.carbs_per_100g ?? '';
      patch.fat = picked.fat_per_100g ?? '';
    }
    updateItem(di, mi, ii, patch);
  };

  // Daily totals
  const dayTotals = (d) => d.meals.reduce((acc, m) => {
    m.items.forEach(it => {
      acc.calories += num(it.calories); acc.protein += num(it.protein);
      acc.carbs += num(it.carbs); acc.fat += num(it.fat);
    });
    return acc;
  }, { calories:0, protein:0, carbs:0, fat:0 });

  const dt = dayTotals(week[activeDay]);
  const tt = { calories:num(target.calories), protein:num(target.protein), carbs:num(target.carbs), fat:num(target.fat) };

  const weekTotals = week.reduce((acc, d) => {
    const dd = dayTotals(d);
    acc.calories += dd.calories; acc.protein += dd.protein; acc.carbs += dd.carbs; acc.fat += dd.fat;
    return acc;
  }, { calories:0, protein:0, carbs:0, fat:0 });

  const copyDay = (toIdx) => {
    const src = week[activeDay];
    setWeek(w => w.map((d,idx) => idx===toIdx ? { ...src, day: w[idx].day,
      meals: src.meals.map(m => ({...m, items: m.items.map(it=>({...it}))})) } : d));
    setCopyOpen(false);
  };

  const save = async () => {
    setSaving(true); setSaveMsg('');
    try {
      const payload = {
        client_id: client.id, title: title || 'Nutrition Plan', goal,
        daily_calories: num(target.calories) || null, protein_g: num(target.protein) || null,
        carbs_g: num(target.carbs) || null, fats_g: num(target.fat) || null,
        plan_data: week, active: true, updated_at: new Date().toISOString(),
      };
      const res = planId
        ? await sb.from('nutrition_plans').update(payload).eq('id', planId).select().single()
        : await sb.from('nutrition_plans').insert(payload).select().single();
      if (res.error) throw res.error;
      setPlanId(res.data.id); setUpdatedAt(res.data.updated_at);
      setSaveMsg('Saved.');
      if (notify) {
        try { await sb.from('client_notifications').insert({ client_id: client.id, kind:'nutrition_updated', message:'Your nutrition plan was updated.' }); } catch {}
        try {
          await fetch('https://formspree.io/f/xojyzgbq', { method:'POST',
            headers:{'Content-Type':'application/json','Accept':'application/json'},
            body: JSON.stringify({ _subject:`Nutrition plan updated for ${client.name}`,
              client_name: client.name, client_email: client.email, kind:'nutrition_updated' }) });
        } catch {}
      }
      setTimeout(()=>setSaveMsg(''), 2500);
    } catch (err) { setSaveMsg('Error: ' + (err.message||err)); }
    finally { setSaving(false); }
  };

  const saveTemplate = async () => {
    if (!tmplName.trim()) return;
    try {
      await sb.from('plan_templates').insert({ kind:'nutrition', name: tmplName.trim(),
        plan_data: week, meta: { goal, target } });
      const { data } = await sb.from('plan_templates').select('*').eq('kind','nutrition').order('name');
      setTemplates(data || []); setTmplSaveOpen(false); setTmplName('');
      setSaveMsg('Template saved.'); setTimeout(()=>setSaveMsg(''),2000);
    } catch (err) { setSaveMsg('Error: ' + (err.message||err)); }
  };
  const loadTemplate = (t) => {
    setWeek(normalizeNWeek(t.plan_data));
    if (t.meta?.goal) setGoal(t.meta.goal);
    if (t.meta?.target) setTarget(t.meta.target);
    setTmplLoadOpen(false);
    setSaveMsg('Template loaded — review then Save.'); setTimeout(()=>setSaveMsg(''),3000);
  };

  if (loading) return (
    <div className="fade-in">
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 20 }}>← Back</button>
      <div className="card" style={{ padding: 60, textAlign:'center', color:'rgba(255,255,255,0.4)' }}>Loading…</div>
    </div>
  );

  const day = week[activeDay];

  return (
    <div className="fade-in">
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 16 }}>← Back to client</button>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: 8, flexWrap:'wrap', gap:12 }}>
        <div>
          <p style={{ fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.45)', fontWeight:600 }}>Edit Nutrition · {client.name}</p>
          <h2 style={{ fontSize: 26, fontWeight: 600, letterSpacing:'-0.025em', marginTop: 4 }}>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Plan title (e.g. Cut Phase 1)"
              style={{ background:'transparent', border:'none', color:'#f5f5f7', fontSize:26, fontWeight:600,
                fontFamily:'inherit', letterSpacing:'-0.025em', outline:'none', minWidth:360,
                borderBottom:'1px dashed rgba(255,255,255,0.12)' }} />
          </h2>
          {updatedAt && <p style={{ fontSize:12, color:'rgba(255,255,255,0.45)', marginTop:6 }}>Last updated {new Date(updatedAt).toLocaleString()}</p>}
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn-ghost" onClick={()=>setTmplLoadOpen(true)}>Load template</button>
          <button className="btn-ghost" onClick={()=>setTmplSaveOpen(true)}>Save as template</button>
        </div>
      </div>

      {/* Targets */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.5fr repeat(4,1fr)', gap:12 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }}>Goal</label>
            <select className="field-input" value={goal} onChange={e=>setGoal(e.target.value)}>
              {['Cut','Maintenance','Lean Bulk','Bulk','Performance'].map(g=><option key={g}>{g}</option>)}
            </select>
          </div>
          {[['calories','Calories'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)']].map(([k,lbl])=>(
            <div key={k}>
              <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', display:'block', marginBottom:6 }}>{lbl}</label>
              <input className="field-input" type="number" value={target[k]} onChange={e=>setTarget({...target,[k]:e.target.value})} />
            </div>
          ))}
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom: 18 }}>
        {week.map((d, i) => (
          <button key={i} onClick={()=>setActiveDay(i)}
            style={{ borderRadius:980, padding:'8px 16px', fontSize:13, cursor:'pointer', border:'none',
              fontFamily:'inherit', fontWeight: activeDay===i?600:400,
              background: activeDay===i ? '#0066cc' : 'rgba(255,255,255,0.07)',
              color: activeDay===i ? '#fff' : 'rgba(255,255,255,0.7)' }}>
            {d.day.slice(0,3)}
          </button>
        ))}
      </div>

      {/* Day card */}
      <div className="card" style={{ marginBottom:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
          <h3 style={{ fontSize:17, fontWeight:600 }}>{day.day}</h3>
          <button className="btn-ghost" onClick={()=>setCopyOpen(true)} style={{ padding:'7px 14px', fontSize:13 }}>Copy day to…</button>
        </div>

        {/* Daily totals vs target */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:14 }}>
          {[['calories','Cal'],['protein','P'],['carbs','C'],['fat','F']].map(([k,lbl])=>(
            <div key={k} style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'10px 12px' }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.04em', fontWeight:600 }}>{lbl}</div>
              <div style={{ fontSize:18, fontWeight:600, color: macroVarColor(dt[k], tt[k]), marginTop:2 }}>
                {Math.round(dt[k])}{tt[k] ? <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13, fontWeight:400 }}> / {tt[k]}</span> : null}
              </div>
            </div>
          ))}
        </div>

        {/* Meals */}
        {day.meals.map((meal, mi) => {
          const mTotals = meal.items.reduce((a,it)=>({calories:a.calories+num(it.calories),protein:a.protein+num(it.protein),carbs:a.carbs+num(it.carbs),fat:a.fat+num(it.fat)}),{calories:0,protein:0,carbs:0,fat:0});
          return (
            <div key={mi} style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, gap:10, flexWrap:'wrap' }}>
                <input className="field-input" value={meal.name} onChange={e=>updateMeal(activeDay, mi, {name:e.target.value})}
                  style={{ maxWidth:200, padding:'7px 10px', fontSize:14, fontWeight:600 }} />
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>
                  {Math.round(mTotals.calories)} kcal · P{Math.round(mTotals.protein)} C{Math.round(mTotals.carbs)} F{Math.round(mTotals.fat)}
                </div>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
                  <thead>
                    <tr><th></th>{['Ingredient','Qty','Unit','Cal','P','C','F',''].map((h,i)=>(
                      <th key={i} style={{ padding:'6px', textAlign:'left', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {meal.items.length === 0 && (
                      <tr><td colSpan={9} style={{ padding:14, textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:13 }}>No items.</td></tr>
                    )}
                    {meal.items.map((it, ii) => (
                      <tr key={ii} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <td></td>
                        <td style={{ padding:'6px', minWidth:180 }}>
                          <IngredientAutocomplete value={it.ingredient} ingredients={ingredients}
                            onPick={(picked, fillMacros) => pickIngredient(activeDay, mi, ii, picked, fillMacros)} />
                        </td>
                        <td style={{ padding:'6px', width:70 }}><input className="field-input" value={it.qty} onChange={e=>updateItem(activeDay,mi,ii,{qty:e.target.value})} style={{ padding:'8px 10px', fontSize:14 }} /></td>
                        <td style={{ padding:'6px', width:70 }}><input className="field-input" value={it.unit} onChange={e=>updateItem(activeDay,mi,ii,{unit:e.target.value})} style={{ padding:'8px 10px', fontSize:14 }} /></td>
                        <td style={{ padding:'6px', width:70 }}><input className="field-input" value={it.calories} onChange={e=>updateItem(activeDay,mi,ii,{calories:e.target.value})} style={{ padding:'8px 10px', fontSize:14 }} /></td>
                        <td style={{ padding:'6px', width:60 }}><input className="field-input" value={it.protein} onChange={e=>updateItem(activeDay,mi,ii,{protein:e.target.value})} style={{ padding:'8px 10px', fontSize:14 }} /></td>
                        <td style={{ padding:'6px', width:60 }}><input className="field-input" value={it.carbs} onChange={e=>updateItem(activeDay,mi,ii,{carbs:e.target.value})} style={{ padding:'8px 10px', fontSize:14 }} /></td>
                        <td style={{ padding:'6px', width:60 }}><input className="field-input" value={it.fat} onChange={e=>updateItem(activeDay,mi,ii,{fat:e.target.value})} style={{ padding:'8px 10px', fontSize:14 }} /></td>
                        <td style={{ padding:'6px', width:36, textAlign:'right' }}>
                          <button onClick={()=>removeItem(activeDay,mi,ii)} style={{ background:'rgba(255,59,48,0.12)', color:'#ff453a', border:'none', borderRadius:6, width:28, height:28, cursor:'pointer' }}>×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn-ghost" onClick={()=>addItem(activeDay, mi)} style={{ marginTop:10, padding:'7px 14px', fontSize:13 }}>+ Add ingredient</button>
            </div>
          );
        })}
        <button className="btn-ghost" onClick={()=>addMeal(activeDay)}>+ Add meal slot</button>
      </div>

      {/* Weekly summary */}
      <div className="card" style={{ marginBottom:18 }}>
        <h3 style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:12 }}>Weekly average</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[['calories','Cal/day'],['protein','P/day'],['carbs','C/day'],['fat','F/day']].map(([k,lbl])=>{
            const avg = weekTotals[k] / 7;
            return (
              <div key={k} style={{ background:'rgba(255,255,255,0.05)', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', fontWeight:600 }}>{lbl}</div>
                <div style={{ fontSize:18, fontWeight:600, color: macroVarColor(avg, tt[k]), marginTop:2 }}>
                  {Math.round(avg)}{tt[k] ? <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13, fontWeight:400 }}> / {tt[k]}</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
        <button onClick={save} disabled={saving} className="btn-blue" style={{ opacity: saving?0.6:1 }}>{saving?'Saving…':'Save plan'}</button>
        <label style={{ display:'inline-flex', alignItems:'center', gap:8, fontSize:13, color:'rgba(255,255,255,0.7)', cursor:'pointer' }}>
          <input type="checkbox" checked={notify} onChange={e=>setNotify(e.target.checked)} style={{ accentColor:'#0066cc' }} /> Notify client
        </label>
        {saveMsg && <span style={{ fontSize:13, color: saveMsg.startsWith('Error')?'#ff453a':'#34c759' }}>{saveMsg}</span>}
      </div>

      <NModal open={copyOpen} onClose={()=>setCopyOpen(false)} title={`Copy ${day.day} to…`} width={380}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:8 }}>
          {NDAYS.map((d,i)=> i!==activeDay && <button key={i} className="btn-ghost" onClick={()=>copyDay(i)}>{d}</button>)}
        </div>
      </NModal>
      <NModal open={tmplSaveOpen} onClose={()=>setTmplSaveOpen(false)} title="Save week as template" width={400}>
        <input className="field-input" autoFocus placeholder="e.g. 2200 kcal Cut" value={tmplName} onChange={e=>setTmplName(e.target.value)} style={{ marginBottom:14 }} />
        <div style={{ display:'flex', gap:10 }}>
          <button className="btn-blue" onClick={saveTemplate} disabled={!tmplName.trim()}>Save template</button>
          <button className="btn-ghost" onClick={()=>setTmplSaveOpen(false)}>Cancel</button>
        </div>
      </NModal>
      <NModal open={tmplLoadOpen} onClose={()=>setTmplLoadOpen(false)} title="Load template" width={460}>
        {templates.length === 0 ? (
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.45)' }}>No nutrition templates yet.</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:320, overflowY:'auto' }}>
            {templates.map(t => (
              <button key={t.id} onClick={()=>loadTemplate(t)}
                style={{ textAlign:'left', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.07)',
                  borderRadius:10, padding:'12px 14px', cursor:'pointer', fontFamily:'inherit', color:'#f5f5f7' }}>
                <div style={{ fontWeight:500, fontSize:14 }}>{t.name}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>
                  {t.meta?.goal || ''} · {t.meta?.target?.calories ? `${t.meta.target.calories} kcal` : ''} · {new Date(t.created_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}
      </NModal>
    </div>
  );
};

window.NutritionEditor = NutritionEditor;
