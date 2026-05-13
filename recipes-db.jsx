// ─── Recipe Database ──────────────────────────────────────────────────────────
// Admin-side CRUD over a localStorage-backed recipe library, plus shared helper
// functions the Nutrition Editor uses to recommend recipes for meal slots.
//
// Storage key: pfb_recipes_v1  → array of recipes
// Photos are stored as data URLs (kept small via downscale + JPEG re-encode).
//
// Exports on window:
//   window.RecipesDB          — admin CRUD UI
//   window.loadRecipes()      — sync read, seeds on first load
//   window.saveRecipes(arr)   — sync write
//   window.recommendForSlot({recipes, slotMacros, mealType, client, tolerance})
//   window.recommendSimilar({recipes, currentMacros, mealType, client, pct=0.15})
//   window.MEAL_TYPE_OPTIONS, DIET_TAG_OPTIONS, DEFAULT_TOLERANCE

const RECIPES_KEY = 'pfb_recipes_v1';
const RECIPES_SEEDED_KEY = 'pfb_recipes_seeded_v1';

window.MEAL_TYPE_OPTIONS = ['breakfast','lunch','dinner','snack'];
window.DIET_TAG_OPTIONS = ['vegan','vegetarian','pescatarian','gluten-free','dairy-free','nut-free','halal','kosher','low-carb','high-protein'];
window.DEFAULT_TOLERANCE = { protein: 10, carbs: 15, fat: 5 };

// ── Seed library ──────────────────────────────────────────────────────────────
const SEED_RECIPES = [
  // Breakfasts
  { name: 'Oatmeal Power Bowl', meal_types: ['breakfast'], calories: 450, protein: 32, carbs: 58, fat: 10, prep_minutes: 8,
    dietary_tags: ['vegetarian','high-protein'], instructions: 'Cook 60g rolled oats in water or milk. Stir in 1 scoop whey, top with banana, blueberries, and a dab of almond butter.',
    ingredients: [{name:'Rolled oats',qty:'60',unit:'g'},{name:'Whey protein',qty:'1',unit:'scoop'},{name:'Banana',qty:'1',unit:'medium'},{name:'Blueberries',qty:'80',unit:'g'},{name:'Almond butter',qty:'10',unit:'g'}] },
  { name: 'Greek Yogurt Parfait', meal_types: ['breakfast','snack'], calories: 380, protein: 30, carbs: 45, fat: 8, prep_minutes: 5,
    dietary_tags: ['vegetarian','gluten-free','high-protein'], instructions: 'Layer Greek yogurt with granola, mixed berries and a drizzle of honey.',
    ingredients: [{name:'Greek yogurt (2%)',qty:'250',unit:'g'},{name:'Granola',qty:'40',unit:'g'},{name:'Mixed berries',qty:'100',unit:'g'},{name:'Honey',qty:'10',unit:'g'}] },
  { name: 'Egg White Veggie Scramble', meal_types: ['breakfast'], calories: 320, protein: 38, carbs: 18, fat: 10, prep_minutes: 12,
    dietary_tags: ['vegetarian','gluten-free','dairy-free','high-protein','low-carb'], instructions: 'Sauté spinach, peppers, onion. Pour in egg whites + 1 whole egg, scramble. Side of whole-grain toast.',
    ingredients: [{name:'Egg whites',qty:'200',unit:'g'},{name:'Whole egg',qty:'1',unit:'large'},{name:'Spinach',qty:'60',unit:'g'},{name:'Bell pepper',qty:'80',unit:'g'},{name:'Whole-grain toast',qty:'1',unit:'slice'}] },
  { name: 'Protein Pancakes', meal_types: ['breakfast'], calories: 480, protein: 40, carbs: 55, fat: 12, prep_minutes: 15,
    dietary_tags: ['vegetarian','high-protein'], instructions: 'Blend oats, banana, eggs, whey. Cook on non-stick skillet. Top with berries and Greek yogurt.',
    ingredients: [{name:'Rolled oats',qty:'50',unit:'g'},{name:'Banana',qty:'1',unit:'medium'},{name:'Whole eggs',qty:'2',unit:'large'},{name:'Whey protein',qty:'1',unit:'scoop'},{name:'Greek yogurt',qty:'80',unit:'g'}] },
  { name: 'Avocado Toast + Eggs', meal_types: ['breakfast'], calories: 520, protein: 28, carbs: 42, fat: 24, prep_minutes: 10,
    dietary_tags: ['vegetarian'], instructions: 'Mash avocado on sourdough toast. Top with 2 poached eggs, salt, pepper, chili flakes.',
    ingredients: [{name:'Sourdough bread',qty:'2',unit:'slices'},{name:'Avocado',qty:'0.5',unit:'medium'},{name:'Whole eggs',qty:'2',unit:'large'}] },
  { name: 'Berry Protein Smoothie', meal_types: ['breakfast','snack'], calories: 340, protein: 35, carbs: 38, fat: 6, prep_minutes: 4,
    dietary_tags: ['vegetarian','gluten-free','high-protein'], instructions: 'Blend whey, frozen berries, banana, milk, ice. Drink cold.',
    ingredients: [{name:'Whey protein',qty:'1.5',unit:'scoop'},{name:'Frozen berries',qty:'120',unit:'g'},{name:'Banana',qty:'0.5',unit:'medium'},{name:'Skim milk',qty:'300',unit:'ml'}] },
  { name: 'Overnight Oats with Whey', meal_types: ['breakfast'], calories: 420, protein: 35, carbs: 52, fat: 8, prep_minutes: 5,
    dietary_tags: ['vegetarian','high-protein'], instructions: 'Combine oats, milk, chia, whey, and cinnamon in a jar overnight. Top with fruit in the morning.',
    ingredients: [{name:'Rolled oats',qty:'50',unit:'g'},{name:'Skim milk',qty:'200',unit:'ml'},{name:'Chia seeds',qty:'10',unit:'g'},{name:'Whey protein',qty:'1',unit:'scoop'},{name:'Apple',qty:'1',unit:'medium'}] },

  // Lunches
  { name: 'Grilled Chicken & Rice Bowl', meal_types: ['lunch','dinner'], calories: 580, protein: 50, carbs: 65, fat: 12, prep_minutes: 25,
    dietary_tags: ['gluten-free','dairy-free','nut-free','high-protein'], instructions: 'Grill seasoned chicken breast. Serve over jasmine rice with steamed broccoli and a squeeze of lime.',
    ingredients: [{name:'Chicken breast',qty:'180',unit:'g'},{name:'Jasmine rice (cooked)',qty:'200',unit:'g'},{name:'Broccoli',qty:'150',unit:'g'},{name:'Olive oil',qty:'5',unit:'ml'}] },
  { name: 'Turkey Lettuce Wraps', meal_types: ['lunch'], calories: 420, protein: 42, carbs: 22, fat: 16, prep_minutes: 15,
    dietary_tags: ['gluten-free','dairy-free','nut-free','high-protein','low-carb'], instructions: 'Brown ground turkey with garlic, ginger, soy. Spoon into butter lettuce cups with shredded carrot and scallion.',
    ingredients: [{name:'Ground turkey (lean)',qty:'170',unit:'g'},{name:'Butter lettuce',qty:'6',unit:'leaves'},{name:'Carrot',qty:'60',unit:'g'},{name:'Soy sauce',qty:'10',unit:'ml'}] },
  { name: 'Tuna Salad on Greens', meal_types: ['lunch'], calories: 380, protein: 45, carbs: 12, fat: 18, prep_minutes: 10,
    dietary_tags: ['pescatarian','gluten-free','dairy-free','nut-free','high-protein','low-carb'], instructions: 'Mix tuna with Greek yogurt, mustard, celery. Serve over mixed greens with cherry tomatoes.',
    ingredients: [{name:'Tuna (canned, in water)',qty:'140',unit:'g'},{name:'Greek yogurt',qty:'40',unit:'g'},{name:'Mixed greens',qty:'100',unit:'g'},{name:'Cherry tomatoes',qty:'80',unit:'g'}] },
  { name: 'Salmon Quinoa Bowl', meal_types: ['lunch','dinner'], calories: 620, protein: 48, carbs: 58, fat: 22, prep_minutes: 25,
    dietary_tags: ['pescatarian','gluten-free','dairy-free','high-protein'], instructions: 'Bake salmon at 200°C for 12 min. Serve on quinoa with roasted zucchini and a drizzle of tahini.',
    ingredients: [{name:'Salmon fillet',qty:'170',unit:'g'},{name:'Quinoa (cooked)',qty:'180',unit:'g'},{name:'Zucchini',qty:'150',unit:'g'},{name:'Tahini',qty:'10',unit:'g'}] },
  { name: 'Lean Beef Stir-Fry', meal_types: ['lunch','dinner'], calories: 560, protein: 48, carbs: 52, fat: 18, prep_minutes: 20,
    dietary_tags: ['dairy-free','high-protein'], instructions: 'Stir-fry lean beef strips with garlic, ginger, soy. Toss with peppers and broccoli. Serve over rice.',
    ingredients: [{name:'Beef sirloin (lean)',qty:'160',unit:'g'},{name:'Brown rice (cooked)',qty:'180',unit:'g'},{name:'Bell pepper',qty:'100',unit:'g'},{name:'Broccoli',qty:'120',unit:'g'},{name:'Soy sauce',qty:'10',unit:'ml'}] },
  { name: 'Chickpea Power Salad', meal_types: ['lunch'], calories: 480, protein: 22, carbs: 60, fat: 16, prep_minutes: 12,
    dietary_tags: ['vegan','vegetarian','gluten-free','dairy-free'], instructions: 'Toss chickpeas with cucumber, tomato, red onion, parsley, olive oil and lemon. Add quinoa for staying power.',
    ingredients: [{name:'Chickpeas (cooked)',qty:'200',unit:'g'},{name:'Quinoa (cooked)',qty:'120',unit:'g'},{name:'Cucumber',qty:'100',unit:'g'},{name:'Cherry tomatoes',qty:'80',unit:'g'},{name:'Olive oil',qty:'10',unit:'ml'},{name:'Lemon',qty:'0.5',unit:'each'}] },
  { name: 'Chicken Caesar (light)', meal_types: ['lunch'], calories: 440, protein: 45, carbs: 18, fat: 22, prep_minutes: 12,
    dietary_tags: ['nut-free','high-protein','low-carb'], instructions: 'Grill chicken, slice. Toss romaine with light Caesar dressing, parmesan and a small handful of croutons.',
    ingredients: [{name:'Chicken breast',qty:'170',unit:'g'},{name:'Romaine lettuce',qty:'150',unit:'g'},{name:'Light Caesar dressing',qty:'25',unit:'ml'},{name:'Parmesan',qty:'15',unit:'g'},{name:'Croutons',qty:'20',unit:'g'}] },

  // Dinners
  { name: 'Baked Salmon + Sweet Potato', meal_types: ['dinner'], calories: 620, protein: 46, carbs: 55, fat: 22, prep_minutes: 30,
    dietary_tags: ['pescatarian','gluten-free','dairy-free','nut-free','high-protein'], instructions: 'Roast salmon and sweet potato wedges with olive oil, paprika, salt. Side of sautéed greens.',
    ingredients: [{name:'Salmon fillet',qty:'170',unit:'g'},{name:'Sweet potato',qty:'250',unit:'g'},{name:'Kale',qty:'100',unit:'g'},{name:'Olive oil',qty:'10',unit:'ml'}] },
  { name: 'Steak & Asparagus', meal_types: ['dinner'], calories: 580, protein: 52, carbs: 12, fat: 38, prep_minutes: 25,
    dietary_tags: ['gluten-free','dairy-free','nut-free','high-protein','low-carb'], instructions: 'Sear a lean sirloin to medium-rare. Roast asparagus with olive oil and lemon zest.',
    ingredients: [{name:'Sirloin steak',qty:'180',unit:'g'},{name:'Asparagus',qty:'200',unit:'g'},{name:'Olive oil',qty:'10',unit:'ml'}] },
  { name: 'Chicken Pasta Primavera', meal_types: ['dinner'], calories: 640, protein: 50, carbs: 70, fat: 16, prep_minutes: 25,
    dietary_tags: ['nut-free','high-protein'], instructions: 'Toss whole-grain pasta with grilled chicken, sautéed zucchini, cherry tomatoes, garlic, parmesan and basil.',
    ingredients: [{name:'Whole-grain pasta (cooked)',qty:'200',unit:'g'},{name:'Chicken breast',qty:'160',unit:'g'},{name:'Zucchini',qty:'120',unit:'g'},{name:'Cherry tomatoes',qty:'100',unit:'g'},{name:'Parmesan',qty:'15',unit:'g'}] },
  { name: 'Shrimp Stir-Fry + Rice', meal_types: ['dinner'], calories: 540, protein: 42, carbs: 62, fat: 12, prep_minutes: 20,
    dietary_tags: ['pescatarian','gluten-free','dairy-free','high-protein'], instructions: 'Stir-fry shrimp with garlic, snap peas, peppers and ginger. Serve over jasmine rice.',
    ingredients: [{name:'Shrimp',qty:'180',unit:'g'},{name:'Jasmine rice (cooked)',qty:'200',unit:'g'},{name:'Snap peas',qty:'80',unit:'g'},{name:'Bell pepper',qty:'80',unit:'g'}] },
  { name: 'Turkey Chili', meal_types: ['dinner','lunch'], calories: 480, protein: 45, carbs: 42, fat: 14, prep_minutes: 35,
    dietary_tags: ['gluten-free','dairy-free','nut-free','high-protein'], instructions: 'Brown ground turkey, simmer with kidney beans, crushed tomato, peppers and chili spices.',
    ingredients: [{name:'Ground turkey (lean)',qty:'170',unit:'g'},{name:'Kidney beans',qty:'120',unit:'g'},{name:'Crushed tomato',qty:'150',unit:'g'},{name:'Bell pepper',qty:'80',unit:'g'}] },
  { name: 'Vegan Lentil Curry', meal_types: ['dinner'], calories: 520, protein: 24, carbs: 70, fat: 14, prep_minutes: 30,
    dietary_tags: ['vegan','vegetarian','gluten-free','dairy-free'], instructions: 'Simmer red lentils in tomato, coconut milk, curry spices. Serve with basmati rice and cilantro.',
    ingredients: [{name:'Red lentils (cooked)',qty:'200',unit:'g'},{name:'Coconut milk (light)',qty:'120',unit:'ml'},{name:'Basmati rice (cooked)',qty:'150',unit:'g'},{name:'Spinach',qty:'80',unit:'g'}] },
  { name: 'Cod with Roasted Veg', meal_types: ['dinner'], calories: 420, protein: 40, carbs: 32, fat: 14, prep_minutes: 25,
    dietary_tags: ['pescatarian','gluten-free','dairy-free','nut-free','high-protein'], instructions: 'Bake cod with lemon and herbs. Roast carrots, cauliflower and onion alongside.',
    ingredients: [{name:'Cod fillet',qty:'200',unit:'g'},{name:'Carrots',qty:'120',unit:'g'},{name:'Cauliflower',qty:'150',unit:'g'},{name:'Olive oil',qty:'8',unit:'ml'}] },

  // Snacks
  { name: 'Cottage Cheese + Berries', meal_types: ['snack'], calories: 220, protein: 24, carbs: 18, fat: 4, prep_minutes: 3,
    dietary_tags: ['vegetarian','gluten-free','high-protein','low-carb'], instructions: 'Top low-fat cottage cheese with mixed berries and a sprinkle of cinnamon.',
    ingredients: [{name:'Cottage cheese (low-fat)',qty:'200',unit:'g'},{name:'Mixed berries',qty:'80',unit:'g'}] },
  { name: 'Whey Protein Shake', meal_types: ['snack'], calories: 180, protein: 30, carbs: 10, fat: 2, prep_minutes: 2,
    dietary_tags: ['vegetarian','gluten-free','high-protein','low-carb'], instructions: 'Shake 1 scoop whey with 300 ml water or skim milk.',
    ingredients: [{name:'Whey protein',qty:'1',unit:'scoop'},{name:'Water or skim milk',qty:'300',unit:'ml'}] },
  { name: 'Hard-Boiled Eggs + Apple', meal_types: ['snack'], calories: 260, protein: 18, carbs: 22, fat: 12, prep_minutes: 10,
    dietary_tags: ['vegetarian','gluten-free','dairy-free','nut-free'], instructions: 'Boil eggs 9 min, cool. Pair with a crisp apple.',
    ingredients: [{name:'Whole eggs',qty:'2',unit:'large'},{name:'Apple',qty:'1',unit:'medium'}] },
  { name: 'Almonds + Banana', meal_types: ['snack'], calories: 280, protein: 8, carbs: 32, fat: 16, prep_minutes: 1,
    dietary_tags: ['vegan','vegetarian','gluten-free','dairy-free'], instructions: 'Pair raw almonds with a ripe banana.',
    ingredients: [{name:'Raw almonds',qty:'25',unit:'g'},{name:'Banana',qty:'1',unit:'medium'}] },
  { name: 'Edamame + Sea Salt', meal_types: ['snack'], calories: 180, protein: 17, carbs: 14, fat: 6, prep_minutes: 5,
    dietary_tags: ['vegan','vegetarian','gluten-free','dairy-free','nut-free','high-protein'], instructions: 'Steam edamame pods, sprinkle with sea salt.',
    ingredients: [{name:'Edamame (in pods)',qty:'150',unit:'g'},{name:'Sea salt',qty:'1',unit:'pinch'}] },
];

const genId = () => 'rcp_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-3);
const seedWithIds = () => SEED_RECIPES.map(r => ({ ...r, id: genId(), photo_url: '', created_at: new Date().toISOString() }));

// ── Persistence ──────────────────────────────────────────────────────────────
// Recipes live in the Supabase `recipes` table. We keep a synchronous in-memory
// cache so the recommender modal can read recipes without async plumbing, and
// fall back to a legacy localStorage copy if Supabase is unreachable.

let _recipesCache = [];
try {
  const raw = localStorage.getItem(RECIPES_KEY);
  if (raw) { const a = JSON.parse(raw); if (Array.isArray(a)) _recipesCache = a; }
} catch (e) {}

// Strip client-only fields before sending to Supabase
const cleanForDb = (r) => ({
  name: r.name, meal_types: r.meal_types || [],
  calories: Number(r.calories)||0, protein: Number(r.protein)||0,
  carbs: Number(r.carbs)||0, fat: Number(r.fat)||0,
  prep_minutes: Number(r.prep_minutes)||0,
  dietary_tags: r.dietary_tags || [], photo_url: r.photo_url || '',
  ingredients: (r.ingredients||[]).filter(i => i?.name?.trim()),
  instructions: r.instructions || '',
});

// Sync read — returns the current cache. Hydrate first via refreshRecipes(sb).
window.loadRecipes = function loadRecipes() { return _recipesCache; };

// Async hydrate — fetches from Supabase. On first run with an empty table,
// seeds it from any legacy localStorage data or the built-in starter library.
window.refreshRecipes = async function refreshRecipes(sb) {
  if (!sb) return _recipesCache;
  try {
    const { data, error } = await sb.from('recipes').select('*').order('name');
    if (error) throw error;
    if (Array.isArray(data) && data.length === 0) {
      // Seed from legacy localStorage if present, else from SEED_RECIPES.
      const local = (() => { try { return JSON.parse(localStorage.getItem(RECIPES_KEY) || 'null'); } catch { return null; } })();
      const seedSource = (Array.isArray(local) && local.length) ? local : SEED_RECIPES;
      const payload = seedSource.map(cleanForDb);
      const ins = await sb.from('recipes').insert(payload).select();
      if (ins.error) { _recipesCache = []; return _recipesCache; }
      _recipesCache = ins.data || [];
      try { localStorage.removeItem(RECIPES_KEY); } catch (e) {} // migrated
    } else {
      _recipesCache = data || [];
    }
  } catch (e) {
    // Offline / RLS denial — keep whatever cache we already have.
    console.warn('refreshRecipes failed:', e?.message || e);
  }
  return _recipesCache;
};

window.upsertRecipe = async function upsertRecipe(sb, recipe) {
  const body = cleanForDb(recipe);
  let res;
  if (recipe.id) {
    res = await sb.from('recipes').update(body).eq('id', recipe.id).select().single();
  } else {
    res = await sb.from('recipes').insert(body).select().single();
  }
  if (res.error) throw res.error;
  const saved = res.data;
  const idx = _recipesCache.findIndex(r => r.id === saved.id);
  if (idx >= 0) _recipesCache = _recipesCache.map(r => r.id === saved.id ? saved : r);
  else _recipesCache = [saved, ..._recipesCache];
  return saved;
};

window.deleteRecipe = async function deleteRecipe(sb, id) {
  const res = await sb.from('recipes').delete().eq('id', id);
  if (res.error) throw res.error;
  _recipesCache = _recipesCache.filter(r => r.id !== id);
};

// Legacy compatibility — older callers used saveRecipes(arr) to write the whole
// list to localStorage. We just keep the cache in sync; Supabase is authoritative.
window.saveRecipes = function saveRecipes(arr) {
  _recipesCache = Array.isArray(arr) ? arr.slice() : [];
};

// ── Helpers: dietary matching & macro scoring ────────────────────────────────
const tagSet = (recipe) => new Set((recipe.dietary_tags || []).map(t => t.toLowerCase()));
const containsAllergen = (recipe, allergens) => {
  if (!allergens || !allergens.length) return false;
  const text = ((recipe.ingredients || []).map(i => i.name).join(' ') + ' ' + (recipe.name || '')).toLowerCase();
  return allergens.some(a => a && text.includes(a));
};
const parseAllergies = (str) => (str || '').toLowerCase().split(/[,;\n]/).map(s => s.trim()).filter(Boolean);

window.matchesDiet = function matchesDiet(recipe, client) {
  const tags = tagSet(recipe);
  const pref = (client?.dietary_pref || '').toLowerCase();
  if (pref === 'vegan' && !tags.has('vegan')) return false;
  if (pref === 'vegetarian' && !(tags.has('vegan') || tags.has('vegetarian'))) return false;
  if (pref === 'pescatarian' && !(tags.has('vegan') || tags.has('vegetarian') || tags.has('pescatarian'))) return false;
  if (pref === 'keto' && (recipe.carbs || 0) > 30) return false;
  const allergens = parseAllergies(client?.allergies);
  if (containsAllergen(recipe, allergens)) return false;
  return true;
};

// Slot recommender
window.recommendForSlot = function recommendForSlot({ recipes, slotMacros, mealType, client, tolerance, includeAll }) {
  const tol = tolerance || window.DEFAULT_TOLERANCE;
  const mt = (mealType || '').toLowerCase();
  const within = recipes.filter(r => {
    if (mt && !(r.meal_types || []).some(x => x.toLowerCase() === mt)) return false;
    if (!window.matchesDiet(r, client)) return false;
    if (slotMacros.protein && Math.abs((r.protein||0) - slotMacros.protein) > tol.protein) return false;
    if (slotMacros.carbs   && Math.abs((r.carbs  ||0) - slotMacros.carbs)   > tol.carbs)   return false;
    if (slotMacros.fat     && Math.abs((r.fat    ||0) - slotMacros.fat)     > tol.fat)     return false;
    return true;
  });
  const score = (r) => {
    const dp = Math.abs((r.protein||0) - (slotMacros.protein||0)) / Math.max(tol.protein,1);
    const dc = Math.abs((r.carbs  ||0) - (slotMacros.carbs  ||0)) / Math.max(tol.carbs,1);
    const df = Math.abs((r.fat    ||0) - (slotMacros.fat    ||0)) / Math.max(tol.fat,1);
    return dp + dc + df;
  };
  const pool = (within.length ? within : (includeAll ? recipes.filter(r => {
    if (mt && !(r.meal_types || []).some(x => x.toLowerCase() === mt)) return false;
    return window.matchesDiet(r, client);
  }) : []));
  return pool.slice().sort((a,b) => score(a) - score(b)).slice(0, 5);
};

// Swap (similar to current meal's macros)
window.recommendSimilar = function recommendSimilar({ recipes, currentMacros, mealType, client, pct, currentId }) {
  const p = pct ?? 0.15;
  const mt = (mealType || '').toLowerCase();
  const within = recipes.filter(r => {
    if (r.id === currentId) return false;
    if (mt && !(r.meal_types || []).some(x => x.toLowerCase() === mt)) return false;
    if (!window.matchesDiet(r, client)) return false;
    const ok = (a,b) => !b ? true : Math.abs(a - b) / Math.max(b,1) <= p;
    return ok(r.calories||0, currentMacros.calories||0)
        && ok(r.protein||0,  currentMacros.protein||0)
        && ok(r.carbs||0,    currentMacros.carbs||0)
        && ok(r.fat||0,      currentMacros.fat||0);
  });
  const score = (r) => Math.abs((r.calories||0)-(currentMacros.calories||0))
                     + Math.abs((r.protein||0) -(currentMacros.protein||0))*4
                     + Math.abs((r.carbs||0)   -(currentMacros.carbs||0))*2
                     + Math.abs((r.fat||0)     -(currentMacros.fat||0))*4;
  return within.slice().sort((a,b) => score(a) - score(b)).slice(0, 5);
};

// ── Image helpers ────────────────────────────────────────────────────────────
const fileToDataURL = (file, maxDim = 720, quality = 0.8) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const cvs = document.createElement('canvas');
      cvs.width = w; cvs.height = h;
      cvs.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(cvs.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = reader.result;
  };
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// ── Admin CRUD UI ────────────────────────────────────────────────────────────
const rdbStyles = {
  pageHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20, gap:12, flexWrap:'wrap' },
  filterBar: { display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr 1fr', gap:10, marginBottom:18 },
  filterBarSm: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 },
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14 },
  card: { background:'#1a1a1c', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column' },
  thumb: { width:'100%', aspectRatio:'16/10', background:'#0e0e10', position:'relative', overflow:'hidden' },
  thumbImg: { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  thumbPh: { position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center',
    background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 12px, rgba(255,255,255,0.06) 12px 24px)',
    color: 'rgba(255,255,255,0.35)', fontSize:11, fontFamily:'ui-monospace,monospace', letterSpacing:'0.05em' },
  body: { padding:14, display:'flex', flexDirection:'column', gap:8, flex:1 },
  macros: { display:'flex', gap:8, fontSize:12, color:'rgba(255,255,255,0.65)' },
  macroChip: { background:'rgba(255,255,255,0.06)', padding:'3px 8px', borderRadius:980, fontFamily:'ui-monospace,monospace' },
  tagsRow: { display:'flex', flexWrap:'wrap', gap:4 },
  tag: { fontSize:10, padding:'2px 7px', borderRadius:980, background:'rgba(41,151,255,0.14)', color:'#2997ff', fontWeight:600, letterSpacing:'0.02em' },
  tagMeal: { fontSize:10, padding:'2px 7px', borderRadius:980, background:'rgba(191,90,242,0.14)', color:'#bf5af2', fontWeight:600, textTransform:'uppercase' },
  rowActions: { display:'flex', gap:6, marginTop:'auto', paddingTop:8 },
  smallBtn: { background:'transparent', color:'rgba(255,255,255,0.75)', border:'1px solid rgba(255,255,255,0.10)', borderRadius:8, padding:'6px 10px', fontSize:12, cursor:'pointer', fontFamily:'inherit' },
};

function RecipeEditor({ recipe, onSave, onCancel, onDelete }) {
  const [r, setR] = React.useState(() => recipe || {
    name:'', meal_types:[], calories:'', protein:'', carbs:'', fat:'',
    prep_minutes:'', dietary_tags:[], photo_url:'', instructions:'', ingredients:[{name:'',qty:'',unit:'g'}],
  });
  const [savingPhoto, setSavingPhoto] = React.useState(false);
  const setF = (k,v) => setR(s => ({...s, [k]: v}));
  const toggleArr = (k, val) => setR(s => {
    const cur = new Set(s[k]||[]);
    cur.has(val) ? cur.delete(val) : cur.add(val);
    return {...s, [k]: [...cur]};
  });
  const setIng = (i, patch) => setR(s => ({...s, ingredients: s.ingredients.map((x,j)=>j===i?{...x,...patch}:x)}));
  const addIng = () => setR(s => ({...s, ingredients: [...(s.ingredients||[]), {name:'',qty:'',unit:'g'}]}));
  const removeIng = (i) => setR(s => ({...s, ingredients: s.ingredients.filter((_,j)=>j!==i)}));

  const onPhoto = async (file) => {
    if (!file) return;
    setSavingPhoto(true);
    try { setF('photo_url', await fileToDataURL(file)); }
    catch { alert('Could not read image.'); }
    finally { setSavingPhoto(false); }
  };

  const valid = r.name.trim() && r.meal_types.length && r.calories !== '' && r.protein !== '';

  return (
    <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-start', justifyContent:'center', zIndex:200, padding:'40px 20px', overflowY:'auto' }}>
      <div onClick={e=>e.stopPropagation()} className="card fade-in" style={{ width:'100%', maxWidth:720 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h3 style={{ fontSize:20, fontWeight:600, letterSpacing:'-0.02em' }}>{recipe ? 'Edit recipe' : 'New recipe'}</h3>
          <button onClick={onCancel} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', fontSize:22, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:18 }}>
          {/* Photo */}
          <div>
            <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Photo</label>
            <div style={{ marginTop:6, aspectRatio:'1/1', borderRadius:12, overflow:'hidden', background:'#0e0e10', position:'relative' }}>
              {r.photo_url
                ? <img src={r.photo_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.35)', fontSize:11, fontFamily:'ui-monospace,monospace', background:'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0 12px, rgba(255,255,255,0.06) 12px 24px)' }}>upload photo</div>}
            </div>
            <label style={{ display:'block', marginTop:8, cursor:'pointer' }}>
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={e=>onPhoto(e.target.files?.[0])} />
              <div style={{...rdbStyles.smallBtn, textAlign:'center'}}>{savingPhoto ? 'Compressing…' : (r.photo_url ? 'Replace photo' : 'Upload photo')}</div>
            </label>
            {r.photo_url && <button onClick={()=>setF('photo_url','')} style={{ ...rdbStyles.smallBtn, width:'100%', marginTop:6, color:'#ff453a', borderColor:'rgba(255,69,58,0.3)' }}>Remove photo</button>}
          </div>

          {/* Right column */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Name</label>
              <input className="field-input" value={r.name} onChange={e=>setF('name', e.target.value)} placeholder="e.g. Greek Yogurt Parfait" style={{ marginTop:6 }} />
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Meal type (multi-select)</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                {window.MEAL_TYPE_OPTIONS.map(m => {
                  const on = (r.meal_types||[]).includes(m);
                  return <button key={m} onClick={()=>toggleArr('meal_types', m)} style={{ ...rdbStyles.smallBtn, background: on?'rgba(191,90,242,0.18)':'transparent', borderColor: on?'rgba(191,90,242,0.4)':'rgba(255,255,255,0.10)', color: on?'#bf5af2':'rgba(255,255,255,0.75)', textTransform:'capitalize' }}>{m}</button>;
                })}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr) 1fr', gap:8 }}>
              {[['calories','Cal'],['protein','P (g)'],['carbs','C (g)'],['fat','F (g)'],['prep_minutes','Prep (min)']].map(([k,lbl])=>(
                <div key={k}>
                  <label style={{ fontSize:11, fontWeight:600, color:'rgba(255,255,255,0.55)', textTransform:'uppercase' }}>{lbl}</label>
                  <input className="field-input" type="number" value={r[k]} onChange={e=>setF(k, e.target.value === '' ? '' : Number(e.target.value))} style={{ marginTop:4, padding:'8px 10px', fontSize:14 }} />
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Dietary tags</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                {window.DIET_TAG_OPTIONS.map(t => {
                  const on = (r.dietary_tags||[]).includes(t);
                  return <button key={t} onClick={()=>toggleArr('dietary_tags', t)} style={{ ...rdbStyles.smallBtn, background: on?'rgba(41,151,255,0.18)':'transparent', borderColor: on?'rgba(41,151,255,0.4)':'rgba(255,255,255,0.10)', color: on?'#2997ff':'rgba(255,255,255,0.75)' }}>{t}</button>;
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div style={{ marginTop:18 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Ingredients</label>
          <div style={{ marginTop:6 }}>
            {(r.ingredients||[]).map((it, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 80px 80px 32px', gap:6, marginBottom:6 }}>
                <input className="field-input" placeholder="Ingredient" value={it.name||''} onChange={e=>setIng(i,{name:e.target.value})} style={{ padding:'8px 10px', fontSize:14 }} />
                <input className="field-input" placeholder="Qty" value={it.qty||''} onChange={e=>setIng(i,{qty:e.target.value})} style={{ padding:'8px 10px', fontSize:14 }} />
                <input className="field-input" placeholder="Unit" value={it.unit||''} onChange={e=>setIng(i,{unit:e.target.value})} style={{ padding:'8px 10px', fontSize:14 }} />
                <button onClick={()=>removeIng(i)} style={{ background:'rgba(255,59,48,0.12)', color:'#ff453a', border:'none', borderRadius:6, cursor:'pointer' }}>×</button>
              </div>
            ))}
          </div>
          <button onClick={addIng} style={{ ...rdbStyles.smallBtn, marginTop:4 }}>+ Add ingredient</button>
        </div>

        {/* Instructions */}
        <div style={{ marginTop:14 }}>
          <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:'0.04em' }}>Instructions</label>
          <textarea className="field-input" value={r.instructions||''} onChange={e=>setF('instructions', e.target.value)} placeholder="Cook the…" style={{ marginTop:6, minHeight:90, fontFamily:'inherit', fontSize:14 }} />
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18, gap:10, flexWrap:'wrap' }}>
          {recipe && onDelete
            ? <button onClick={onDelete} style={{ ...rdbStyles.smallBtn, color:'#ff453a', borderColor:'rgba(255,69,58,0.3)' }}>Delete recipe</button>
            : <span />}
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="btn-blue" disabled={!valid} style={{ opacity: valid?1:0.5 }} onClick={()=>onSave(r)}>Save recipe</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecipesDB({ sb, onBack }) {
  const [recipes, setRecipes] = React.useState(() => window.loadRecipes());
  const [query, setQuery] = React.useState('');
  const [mealFilter, setMealFilter] = React.useState('');
  const [dietFilter, setDietFilter] = React.useState('');
  const [proteinMin, setProteinMin] = React.useState('');
  const [proteinMax, setProteinMax] = React.useState('');
  const [calorieMin, setCalorieMin] = React.useState('');
  const [calorieMax, setCalorieMax] = React.useState('');
  const [editing, setEditing] = React.useState(null); // recipe object | 'new' | null
  const [showFilters, setShowFilters] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState('');

  // Hydrate from Supabase on mount
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const arr = await window.refreshRecipes(sb);
      if (!cancelled) { setRecipes(arr.slice()); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [sb]);

  const onSave = async (rec) => {
    setBusy(true); setErr('');
    try {
      const saved = await window.upsertRecipe(sb, rec);
      setRecipes(window.loadRecipes().slice());
      setEditing(null);
    } catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };
  const onDelete = async () => {
    if (!editing?.id) return;
    if (!window.confirm(`Delete "${editing.name}"?`)) return;
    setBusy(true); setErr('');
    try {
      await window.deleteRecipe(sb, editing.id);
      setRecipes(window.loadRecipes().slice());
      setEditing(null);
    } catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter(r => {
      if (q) {
        const hay = (r.name + ' ' + (r.ingredients||[]).map(i=>i.name).join(' ') + ' ' + (r.dietary_tags||[]).join(' ')).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (mealFilter && !(r.meal_types||[]).includes(mealFilter)) return false;
      if (dietFilter && !(r.dietary_tags||[]).includes(dietFilter)) return false;
      if (proteinMin !== '' && (r.protein||0) < Number(proteinMin)) return false;
      if (proteinMax !== '' && (r.protein||0) > Number(proteinMax)) return false;
      if (calorieMin !== '' && (r.calories||0) < Number(calorieMin)) return false;
      if (calorieMax !== '' && (r.calories||0) > Number(calorieMax)) return false;
      return true;
    });
  }, [recipes, query, mealFilter, dietFilter, proteinMin, proteinMax, calorieMin, calorieMax]);

  const resetSeed = async () => {
    if (!window.confirm('Reset the library: delete ALL current recipes and re-seed with the 26 starters? This cannot be undone.')) return;
    setBusy(true); setErr('');
    try {
      // Delete every existing recipe row, then re-seed via refresh.
      const ids = recipes.map(r => r.id).filter(Boolean);
      if (ids.length) {
        const del = await sb.from('recipes').delete().in('id', ids);
        if (del.error) throw del.error;
      }
      _recipesCache = [];
      const arr = await window.refreshRecipes(sb);
      setRecipes(arr.slice());
    } catch (e) { setErr(e.message || String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="fade-in">
      <div style={rdbStyles.pageHeader}>
        <div>
          <button className="btn-ghost" onClick={onBack} style={{ marginBottom:14 }}>← Back</button>
          <h2 style={{ fontSize:28, fontWeight:600, letterSpacing:'-0.025em' }}>Recipe Database</h2>
          <p style={{ color:'rgba(255,255,255,0.5)', marginTop:4, fontSize:13 }}>
            {loading ? 'Loading recipes…' : `${recipes.length} recipes · shared across all coaches & devices`}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button className="btn-ghost" onClick={resetSeed} disabled={busy || loading}>Reset to starter library</button>
          <button className="btn-blue" onClick={()=>setEditing('new')} disabled={busy || loading}>+ New recipe</button>
        </div>
      </div>

      {err && (
        <div style={{ background:'rgba(255,69,58,0.10)', border:'1px solid rgba(255,69,58,0.3)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#ff453a', marginBottom:14 }}>
          {err}
        </div>
      )}

      <div className="card" style={{ marginBottom:18, padding:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr 1fr auto', gap:10 }}>
          <input className="field-input" placeholder="Search by name, ingredient, tag…" value={query} onChange={e=>setQuery(e.target.value)} />
          <select className="field-input" value={mealFilter} onChange={e=>setMealFilter(e.target.value)}>
            <option value="">All meal types</option>
            {window.MEAL_TYPE_OPTIONS.map(m => <option key={m} value={m}>{m[0].toUpperCase()+m.slice(1)}</option>)}
          </select>
          <select className="field-input" value={dietFilter} onChange={e=>setDietFilter(e.target.value)}>
            <option value="">All dietary tags</option>
            {window.DIET_TAG_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-ghost" onClick={()=>setShowFilters(s=>!s)}>{showFilters?'Hide ranges':'Macro ranges'}</button>
        </div>
        {showFilters && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:10 }}>
            <input className="field-input" placeholder="Protein min" type="number" value={proteinMin} onChange={e=>setProteinMin(e.target.value)} />
            <input className="field-input" placeholder="Protein max" type="number" value={proteinMax} onChange={e=>setProteinMax(e.target.value)} />
            <input className="field-input" placeholder="Calorie min" type="number" value={calorieMin} onChange={e=>setCalorieMin(e.target.value)} />
            <input className="field-input" placeholder="Calorie max" type="number" value={calorieMax} onChange={e=>setCalorieMax(e.target.value)} />
          </div>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'rgba(255,255,255,0.4)' }}>Loading recipes…</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'rgba(255,255,255,0.4)' }}>
          No recipes match. Try clearing filters or adding a new one.
        </div>
      ) : (
        <div style={rdbStyles.grid}>
          {filtered.map(r => (
            <div key={r.id} style={rdbStyles.card}>
              <div style={rdbStyles.thumb}>
                {r.photo_url
                  ? <img src={r.photo_url} alt="" style={rdbStyles.thumbImg} />
                  : <div style={rdbStyles.thumbPh}>recipe photo</div>}
              </div>
              <div style={rdbStyles.body}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}>
                  <h4 style={{ fontSize:15, fontWeight:600, letterSpacing:'-0.01em', lineHeight:1.3 }}>{r.name}</h4>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,0.45)', whiteSpace:'nowrap' }}>⏱ {r.prep_minutes||'—'}m</span>
                </div>
                <div style={rdbStyles.tagsRow}>
                  {(r.meal_types||[]).map(m => <span key={m} style={rdbStyles.tagMeal}>{m}</span>)}
                </div>
                <div style={rdbStyles.macros}>
                  <span style={rdbStyles.macroChip}>{r.calories} kcal</span>
                  <span style={rdbStyles.macroChip}>P{r.protein}</span>
                  <span style={rdbStyles.macroChip}>C{r.carbs}</span>
                  <span style={rdbStyles.macroChip}>F{r.fat}</span>
                </div>
                <div style={rdbStyles.tagsRow}>
                  {(r.dietary_tags||[]).slice(0,4).map(t => <span key={t} style={rdbStyles.tag}>{t}</span>)}
                  {(r.dietary_tags||[]).length > 4 && <span style={rdbStyles.tag}>+{r.dietary_tags.length-4}</span>}
                </div>
                <div style={rdbStyles.rowActions}>
                  <button style={rdbStyles.smallBtn} onClick={()=>setEditing(r)}>Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <RecipeEditor recipe={editing==='new'?null:editing} onSave={onSave} onDelete={editing==='new'?null:onDelete} onCancel={()=>setEditing(null)} />}
    </div>
  );
}

window.RecipesDB = RecipesDB;
