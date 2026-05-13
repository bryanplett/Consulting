// ─── Nutrition Editor ─────────────────────────────────────────────────────────
// Edits nutrition_plans.plan_data as 7-day grid.
// Day shape: { day, meals: [{ name, items: [{ ingredient, qty, unit, calories, protein, carbs, fat }] }] }

const NDAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const MEAL_SLOTS = ['Breakfast','Lunch','Snack','Dinner'];
const DEFAULT_SPLITS = [30, 30, 10, 30];  // Breakfast / Lunch / Snack / Dinner

// ─── Per-client meal-recommender settings ────────────────────────────────────
// Authoritative copy lives in nutrition_plans.meal_settings (Supabase column).
// localStorage is a legacy fallback for clients whose plan hasn't been re-saved
// since the migration; we read it on first load and write back to the DB next save.
const NE_SETTINGS_KEY = (cid) => 'pfb_nutri_settings_' + cid;
const loadLegacyNeSettings = (cid) => {
  try { return JSON.parse(localStorage.getItem(NE_SETTINGS_KEY(cid)) || '{}'); }
  catch { return {}; }
};

// Map a slot name → recipe meal-type key
const SLOT_TYPE_MAP = { breakfast:'breakfast', lunch:'lunch', dinner:'dinner', snack:'snack' };
const mealTypeFor = (slotName) => {
  const k = (slotName||'').toLowerCase();
  if (SLOT_TYPE_MAP[k]) return SLOT_TYPE_MAP[k];
  // Try keyword detection
  for (const key of Object.keys(SLOT_TYPE_MAP)) if (k.includes(key)) return key;
  return '';
};

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

// ─── Meal Recommender Modal ───────────────────────────────────────────────────
// mode: 'find'  → filters by slot macro target + tolerance
// mode: 'swap'  → filters within ±pct of currentMacros
const MealRecommenderModal = ({
  open, onClose, mode, slotMacros, currentMacros, currentRecipeId,
  mealType, client, tolerance: tolProp, onAssign, onAddAlternative, canAddAlt, addingAlt,
}) => {
  const [tolerance, setTolerance] = React.useState(tolProp || window.DEFAULT_TOLERANCE);
  const [includeAll, setIncludeAll] = React.useState(false);
  const recipes = React.useMemo(() => (open ? (window.loadRecipes ? window.loadRecipes() : []) : []), [open]);

  React.useEffect(() => { if (open) { setTolerance(tolProp || window.DEFAULT_TOLERANCE); setIncludeAll(false); } }, [open]);

  if (!open) return null;

  const matches = mode === 'find'
    ? (slotMacros && window.recommendForSlot ? window.recommendForSlot({ recipes, slotMacros, mealType, client, tolerance, includeAll }) : [])
    : (window.recommendSimilar ? window.recommendSimilar({ recipes, currentMacros, mealType, client, pct: 0.15, currentId: currentRecipeId }) : []);

  const target = mode === 'find' ? (slotMacros || { calories:0, protein:0, carbs:0, fat:0 }) : currentMacros;
  const tolDisplay = mode === 'find' ? `±${tolerance.protein}P · ±${tolerance.carbs}C · ±${tolerance.fat}F` : '±15% of current';

  const macroDelta = (recipe) => {
    const dp = (recipe.protein||0) - (target.protein||0);
    const dc = (recipe.carbs||0) - (target.carbs||0);
    const df = (recipe.fat||0) - (target.fat||0);
    return { dp, dc, df };
  };
  const dStr = (n) => (n>0?'+':'') + Math.round(n);
  const dColor = (n, tol) => Math.abs(n) <= tol ? '#34c759' : Math.abs(n) <= tol*2 ? '#ff9f0a' : '#ff453a';

  const stop = e => e.stopPropagation();
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', zIndex:220, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'40px 20px', overflowY:'auto' }}>
      <div onClick={stop} className="card fade-in" style={{ width:'100%', maxWidth:920, padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, gap:12, flexWrap:'wrap' }}>
          <div>
            <p style={{ fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.45)', fontWeight:600 }}>
              {addingAlt ? 'Add alternative' : (mode === 'find' ? 'Find meals' : 'Swap meal')}
            </p>
            <h3 style={{ fontSize:20, fontWeight:600, marginTop:4, letterSpacing:'-0.02em' }}>
              {mode === 'find'
                ? <>Target: <span style={{ color:'#2997ff' }}>{target.calories} kcal</span> · P{target.protein} · C{target.carbs} · F{target.fat}</>
                : <>Find a swap for similar macros</>}
            </h3>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:4 }}>
              {mealType ? `${mealType[0].toUpperCase()+mealType.slice(1)} · ` : ''}{tolDisplay}
              {client?.dietary_pref ? ` · ${client.dietary_pref}` : ''}
              {client?.allergies ? ` · avoiding: ${client.allergies.slice(0,40)}${client.allergies.length>40?'…':''}` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', fontSize:24, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {mode === 'find' && (
          <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:10, padding:'10px 14px', marginBottom:14, display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Tolerance</span>
            {[['protein','P'],['carbs','C'],['fat','F']].map(([k,lbl])=>(
              <label key={k} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(255,255,255,0.75)' }}>
                <span style={{ fontFamily:'ui-monospace,monospace', width:14 }}>±{lbl}</span>
                <input type="number" value={tolerance[k]} onChange={e=>setTolerance({...tolerance, [k]: Number(e.target.value)||0})}
                  style={{ width:54, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:6, color:'#fff', padding:'4px 6px', fontSize:13, textAlign:'center', fontFamily:'inherit' }} />
              </label>
            ))}
            <label style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'rgba(255,255,255,0.7)', marginLeft:'auto', cursor:'pointer' }}>
              <input type="checkbox" checked={includeAll} onChange={e=>setIncludeAll(e.target.checked)} style={{ accentColor:'#0066cc' }} />
              Show closest if none within tolerance
            </label>
          </div>
        )}

        {matches.length === 0 ? (
          <div style={{ padding:'48px 20px', textAlign:'center', color:'rgba(255,255,255,0.5)', border:'1px dashed rgba(255,255,255,0.10)', borderRadius:12 }}>
            <p style={{ fontSize:15, marginBottom:8 }}>No recipes match.</p>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.4)' }}>
              {mode === 'find'
                ? 'Try loosening the tolerance, or check "Show closest" above.'
                : 'No similar recipes for this meal type within ±15%. Try editing macros manually.'}
            </p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:14 }}>
            {matches.map(r => {
              const d = macroDelta(r);
              return (
                <div key={r.id} style={{ background:'#0e0e10', border:'1px solid rgba(255,255,255,0.08)', borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column' }}>
                  <div style={{ aspectRatio:'16/10', background:'#1a1a1c', position:'relative', overflow:'hidden' }}>
                    {r.photo_url
                      ? <img src={r.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                      : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:11, fontFamily:'ui-monospace,monospace', background:'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 12px, rgba(255,255,255,0.06) 12px 24px)' }}>recipe photo</div>}
                    <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(6px)', borderRadius:980, padding:'3px 9px', fontSize:11, color:'#fff', fontFamily:'ui-monospace,monospace' }}>⏱ {r.prep_minutes||'—'}m</div>
                  </div>
                  <div style={{ padding:'12px 14px 14px', display:'flex', flexDirection:'column', gap:8, flex:1 }}>
                    <h4 style={{ fontSize:15, fontWeight:600, letterSpacing:'-0.01em', lineHeight:1.3 }}>{r.name}</h4>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', fontSize:11 }}>
                      <span style={{ background:'rgba(255,255,255,0.06)', padding:'3px 8px', borderRadius:980, fontFamily:'ui-monospace,monospace' }}>{r.calories} kcal</span>
                      <span style={{ background:'rgba(255,255,255,0.06)', padding:'3px 8px', borderRadius:980, fontFamily:'ui-monospace,monospace' }}>
                        P{r.protein} <span style={{ color: dColor(d.dp, tolerance.protein||10) }}>({dStr(d.dp)})</span>
                      </span>
                      <span style={{ background:'rgba(255,255,255,0.06)', padding:'3px 8px', borderRadius:980, fontFamily:'ui-monospace,monospace' }}>
                        C{r.carbs} <span style={{ color: dColor(d.dc, tolerance.carbs||15) }}>({dStr(d.dc)})</span>
                      </span>
                      <span style={{ background:'rgba(255,255,255,0.06)', padding:'3px 8px', borderRadius:980, fontFamily:'ui-monospace,monospace' }}>
                        F{r.fat} <span style={{ color: dColor(d.df, tolerance.fat||5) }}>({dStr(d.df)})</span>
                      </span>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                      {(r.dietary_tags||[]).slice(0,4).map(t => <span key={t} style={{ fontSize:10, padding:'2px 7px', borderRadius:980, background:'rgba(41,151,255,0.14)', color:'#2997ff', fontWeight:600 }}>{t}</span>)}
                    </div>
                    <div style={{ marginTop:'auto', display:'flex', gap:6, paddingTop:6 }}>
                      <button onClick={()=>onAssign(r)} className="btn-blue" style={{ flex:1, padding:'8px 12px', fontSize:13 }}>
                        {addingAlt ? '+ Add as alternative' : (mode === 'swap' ? 'Swap to this' : 'Use this meal')}
                      </button>
                      {canAddAlt && mode === 'find' && !addingAlt && (
                        <button onClick={()=>onAddAlternative(r)} title="Add as client-pickable alternative"
                          style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.7)', borderRadius:980, padding:'8px 12px', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>+ Alt</button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
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

  // Meal recommender state. Authoritative copy is nutrition_plans.meal_settings;
  // loaded above in the main fetch effect, persisted on Save.
  const [splits, setSplits] = React.useState(DEFAULT_SPLITS);
  const [tolerance, setTolerance] = React.useState(window.DEFAULT_TOLERANCE || { protein:10, carbs:15, fat:5 });
  const [clientCanChoose, setClientCanChoose] = React.useState(false);
  const [showSplits, setShowSplits] = React.useState(false);
  const [recOpen, setRecOpen] = React.useState(null); // { mode, mi, currentMacros, currentRecipeId }
  const updateSplits = (next) => setSplits(next);
  const updateTolerance = (next) => setTolerance(next);
  const updateClientCanChoose = (next) => setClientCanChoose(next);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // Kick off recipe refresh in parallel (cached for the recommender modal)
      if (window.refreshRecipes) { window.refreshRecipes(sb).catch(()=>{}); }
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
          // Meal-recommender settings: prefer DB column; fall back to legacy localStorage
          const ms = (p.meal_settings && typeof p.meal_settings === 'object') ? p.meal_settings : {};
          const legacy = loadLegacyNeSettings(client.id);
          const splits = Array.isArray(ms.splits) ? ms.splits
            : Array.isArray(legacy.splits) ? legacy.splits : DEFAULT_SPLITS;
          const tol = ms.tolerance || legacy.tolerance || (window.DEFAULT_TOLERANCE || { protein:10, carbs:15, fat:5 });
          const canChoose = typeof ms.clientCanChoose === 'boolean' ? ms.clientCanChoose
            : typeof legacy.clientCanChoose === 'boolean' ? legacy.clientCanChoose : false;
          setSplits(splits); setTolerance(tol); setClientCanChoose(canChoose);
        } else {
          const legacy = loadLegacyNeSettings(client.id);
          if (Array.isArray(legacy.splits) && legacy.splits.length) setSplits(legacy.splits);
          if (legacy.tolerance) setTolerance(legacy.tolerance);
          if (typeof legacy.clientCanChoose === 'boolean') setClientCanChoose(legacy.clientCanChoose);
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

  // ── Meal-recommender helpers ───────────────────────────────────────────────
  // Convert a recipe into a single line-item that fills the meal's macros.
  const recipeToItems = (recipe) => ([{
    ingredient: recipe.name + ' (1 serving)',
    qty: '1', unit: 'serving',
    calories: recipe.calories || 0, protein: recipe.protein || 0,
    carbs: recipe.carbs || 0, fat: recipe.fat || 0,
  }]);
  const assignRecipe = (di, mi, recipe) => {
    updateMeal(di, mi, {
      recipe_id: recipe.id, recipe_name: recipe.name,
      recipe_photo: recipe.photo_url || '', recipe_prep: recipe.prep_minutes || 0,
      recipe_tags: recipe.dietary_tags || [],
      items: recipeToItems(recipe),
      alternatives: week[di].meals[mi].alternatives || [],
    });
    setRecOpen(null);
  };
  const addAlternative = (di, mi, recipe) => {
    const cur = week[di].meals[mi].alternatives || [];
    if (cur.some(a => a.recipe_id === recipe.id)) return;
    updateMeal(di, mi, { alternatives: [...cur, {
      recipe_id: recipe.id, recipe_name: recipe.name, recipe_photo: recipe.photo_url || '',
      recipe_prep: recipe.prep_minutes || 0,
      calories: recipe.calories || 0, protein: recipe.protein || 0,
      carbs: recipe.carbs || 0, fat: recipe.fat || 0,
    }] });
  };
  const removeAlternative = (di, mi, recipe_id) => {
    const cur = week[di].meals[mi].alternatives || [];
    updateMeal(di, mi, { alternatives: cur.filter(a => a.recipe_id !== recipe_id) });
  };
  const clearRecipe = (di, mi) => {
    updateMeal(di, mi, { recipe_id: null, recipe_name: null, recipe_photo: null, recipe_prep: null, recipe_tags: null, items: [] });
  };

  // Slot target macros from daily target + split percentages
  const slotTarget = (mi) => {
    const pct = splits[mi];
    if (pct == null || !tt.calories) return null;
    return {
      calories: Math.round((tt.calories * pct) / 100),
      protein: Math.round((tt.protein * pct) / 100),
      carbs: Math.round((tt.carbs * pct) / 100),
      fat: Math.round((tt.fat * pct) / 100),
    };
  };
  const splitsSum = splits.reduce((a,b)=>a+(Number(b)||0),0);

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
        meal_settings: { splits, tolerance, clientCanChoose },
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
          await fetch('https://formspree.io/f/mnjwvgan', { method:'POST',
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

      {/* Macro split + recommender settings */}
      <div className="card" style={{ marginBottom: 18, padding: showSplits ? 28 : '18px 28px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', flexWrap:'wrap', gap:10 }}
          onClick={()=>setShowSplits(s=>!s)}>
          <div>
            <h3 style={{ fontSize:15, fontWeight:600, letterSpacing:'-0.01em' }}>Macro split &amp; recommender</h3>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:2 }}>
              {MEAL_SLOTS.map((s,i)=>`${s.slice(0,3)} ${splits[i]||0}%`).join(' · ')}
              {splitsSum !== 100 && <span style={{ color:'#ff9f0a', marginLeft:8 }}>· sums to {splitsSum}%</span>}
              {clientCanChoose && <span style={{ color:'#34c759', marginLeft:8 }}>· client can choose alternatives</span>}
            </p>
          </div>
          <span style={{ fontSize:12, color:'#2997ff' }}>{showSplits ? 'Hide' : 'Edit'}</span>
        </div>

        {showSplits && (
          <div style={{ marginTop:18 }}>
            <p style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginBottom:10 }}>
              How daily targets divide across meal slots. Used to compute the per-slot target shown on each meal below.
            </p>
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${MEAL_SLOTS.length},1fr) auto`, gap:10, alignItems:'flex-end' }}>
              {MEAL_SLOTS.map((slot, i) => {
                const t = tt.calories ? Math.round((tt.calories * (splits[i]||0)) / 100) : 0;
                return (
                  <div key={slot}>
                    <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{slot}</label>
                    <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:6 }}>
                      <input className="field-input" type="number" min="0" max="100" value={splits[i] ?? 0}
                        onChange={e=>{ const next = splits.slice(); next[i] = Number(e.target.value)||0; updateSplits(next); }}
                        style={{ padding:'8px 10px', fontSize:14 }} />
                      <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>%</span>
                    </div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:4, fontFamily:'ui-monospace,monospace' }}>≈ {t} kcal</div>
                  </div>
                );
              })}
              <button className="btn-ghost" style={{ padding:'8px 14px', fontSize:12 }}
                onClick={()=>updateSplits([30,30,10,30])} title="Reset to default 30/30/10/30">Reset</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginTop:18, alignItems:'flex-end' }}>
              <div style={{ gridColumn:'span 4' }}>
                <p style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Default fit tolerance</p>
                <p style={{ fontSize:11, color:'rgba(255,255,255,0.45)', marginTop:2 }}>How close a recipe's macros must be to count as a match.</p>
              </div>
              {[['protein','± Protein (g)'],['carbs','± Carbs (g)'],['fat','± Fat (g)']].map(([k,lbl])=>(
                <div key={k}>
                  <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{lbl}</label>
                  <input className="field-input" type="number" value={tolerance[k]}
                    onChange={e=>updateTolerance({...tolerance, [k]: Number(e.target.value)||0})}
                    style={{ padding:'8px 10px', fontSize:14, marginTop:6 }} />
                </div>
              ))}
            </div>

            <label style={{ display:'flex', alignItems:'center', gap:10, marginTop:18, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', cursor:'pointer' }}>
              <input type="checkbox" checked={clientCanChoose} onChange={e=>updateClientCanChoose(e.target.checked)} style={{ accentColor:'#0066cc', width:16, height:16 }} />
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>Let this client choose alternatives</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>
                  When on, you can attach 2–3 alternatives per meal. The client sees them in their portal and picks which one they'll eat that day.
                </div>
              </div>
            </label>
          </div>
        )}
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
          const target = slotTarget(mi);
          const hasRecipe = !!meal.recipe_id;
          const mealType = mealTypeFor(meal.name);
          return (
            <div key={mi} style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, gap:10, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <input className="field-input" value={meal.name} onChange={e=>updateMeal(activeDay, mi, {name:e.target.value})}
                    style={{ maxWidth:200, padding:'7px 10px', fontSize:14, fontWeight:600 }} />
                  {target && (
                    <span title="Per-slot target from your macro split"
                      style={{ fontSize:11, fontFamily:'ui-monospace,monospace', color:'rgba(255,255,255,0.55)', background:'rgba(41,151,255,0.10)', border:'1px solid rgba(41,151,255,0.25)', padding:'4px 8px', borderRadius:980 }}>
                      target {target.calories}kcal · P{target.protein} C{target.carbs} F{target.fat}
                    </span>
                  )}
                </div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', fontFamily:'ui-monospace,monospace' }}>
                  <span style={{ color: target ? macroVarColor(mTotals.calories, target.calories) : 'rgba(255,255,255,0.5)' }}>{Math.round(mTotals.calories)} kcal</span>
                  {' · '}<span style={{ color: target ? macroVarColor(mTotals.protein, target.protein) : 'rgba(255,255,255,0.5)' }}>P{Math.round(mTotals.protein)}</span>
                  {' '}<span style={{ color: target ? macroVarColor(mTotals.carbs, target.carbs) : 'rgba(255,255,255,0.5)' }}>C{Math.round(mTotals.carbs)}</span>
                  {' '}<span style={{ color: target ? macroVarColor(mTotals.fat, target.fat) : 'rgba(255,255,255,0.5)' }}>F{Math.round(mTotals.fat)}</span>
                </div>
              </div>

              {/* Assigned recipe card */}
              {hasRecipe && (
                <div style={{ display:'flex', gap:12, background:'rgba(191,90,242,0.06)', border:'1px solid rgba(191,90,242,0.25)', borderRadius:12, padding:10, marginBottom:10 }}>
                  <div style={{ width:64, height:64, borderRadius:10, overflow:'hidden', flexShrink:0, background:'#0e0e10', position:'relative' }}>
                    {meal.recipe_photo
                      ? <img src={meal.recipe_photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.3)', fontSize:9, fontFamily:'ui-monospace,monospace' }}>photo</div>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:600, letterSpacing:'-0.01em' }}>{meal.recipe_name}</div>
                        <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>
                          From recipe library · ⏱ {meal.recipe_prep||'—'} min
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button onClick={()=>setRecOpen({ mode:'swap', mi, currentMacros: mTotals, currentRecipeId: meal.recipe_id })}
                          style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)', borderRadius:980, padding:'5px 12px', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}
                          title="Swap for a similar meal">⇄ Swap</button>
                        <button onClick={()=>clearRecipe(activeDay, mi)}
                          style={{ background:'transparent', border:'1px solid rgba(255,69,58,0.3)', color:'#ff453a', borderRadius:980, padding:'5px 12px', fontSize:12, cursor:'pointer', fontFamily:'inherit' }}
                          title="Remove this recipe from the slot">Clear</button>
                      </div>
                    </div>
                    {/* Alternatives row */}
                    {(meal.alternatives||[]).length > 0 && (
                      <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                        <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600, alignSelf:'center' }}>Client alts:</span>
                        {meal.alternatives.map(alt => (
                          <span key={alt.recipe_id} style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:11, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', padding:'3px 4px 3px 10px', borderRadius:980 }}>
                            {alt.recipe_name}
                            <span style={{ color:'rgba(255,255,255,0.4)', fontFamily:'ui-monospace,monospace' }}>{alt.calories}kcal</span>
                            <button onClick={()=>removeAlternative(activeDay, mi, alt.recipe_id)} style={{ background:'rgba(255,59,48,0.15)', color:'#ff453a', border:'none', width:18, height:18, borderRadius:'50%', cursor:'pointer', fontSize:11, lineHeight:1 }}>×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Find-meals empty state for unassigned slots */}
              {!hasRecipe && meal.items.length === 0 && (
                <div style={{ border:'1px dashed rgba(41,151,255,0.3)', borderRadius:12, padding:'14px 16px', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap', background:'rgba(41,151,255,0.04)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600 }}>Empty slot</div>
                    <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', marginTop:2 }}>
                      {target ? <>We'll find recipes near <b>{target.calories}kcal · P{target.protein} C{target.carbs} F{target.fat}</b></> : 'Set daily targets above to enable recommendations'}
                    </div>
                  </div>
                  <button className="btn-blue" style={{ padding:'8px 16px', fontSize:13 }}
                    onClick={()=>setRecOpen({ mode:'find', mi, currentMacros: mTotals })}
                    disabled={!target}>
                    ⌕ Find meals
                  </button>
                </div>
              )}

              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
                  <thead>
                    <tr><th></th>{['Ingredient','Qty','Unit','Cal','P','C','F',''].map((h,i)=>(
                      <th key={i} style={{ padding:'6px', textAlign:'left', fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {meal.items.length === 0 && !hasRecipe && (
                      <tr><td colSpan={9} style={{ padding:14, textAlign:'center', color:'rgba(255,255,255,0.4)', fontSize:13 }}>No items. Use "Find meals" above, or add ingredients manually below.</td></tr>
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
              <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
                <button className="btn-ghost" onClick={()=>addItem(activeDay, mi)} style={{ padding:'7px 14px', fontSize:13 }}>+ Add ingredient</button>
                {!hasRecipe && meal.items.length > 0 && target && (
                  <button className="btn-ghost" onClick={()=>setRecOpen({ mode:'find', mi, currentMacros: mTotals })} style={{ padding:'7px 14px', fontSize:13 }}>⌕ Find meals</button>
                )}
                {hasRecipe && clientCanChoose && (
                  <button className="btn-ghost" onClick={()=>setRecOpen({ mode:'find', mi, currentMacros: mTotals, addingAlt: true })} style={{ padding:'7px 14px', fontSize:13 }}>+ Add alternative</button>
                )}
              </div>
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

      <MealRecommenderModal
        open={!!recOpen}
        mode={recOpen?.mode}
        addingAlt={!!recOpen?.addingAlt}
        slotMacros={recOpen ? slotTarget(recOpen.mi) : null}
        currentMacros={recOpen?.currentMacros}
        currentRecipeId={recOpen?.currentRecipeId}
        mealType={recOpen ? mealTypeFor(day.meals[recOpen.mi]?.name) : ''}
        client={client}
        tolerance={tolerance}
        canAddAlt={clientCanChoose}
        onClose={()=>setRecOpen(null)}
        onAssign={(r)=>{
          if (recOpen?.addingAlt) { addAlternative(activeDay, recOpen.mi, r); setRecOpen(null); }
          else assignRecipe(activeDay, recOpen.mi, r);
        }}
        onAddAlternative={(r)=>{ addAlternative(activeDay, recOpen.mi, r); }}
      />

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
