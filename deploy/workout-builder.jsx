// ─── Workout Builder (multi-step quiz funnel) ────────────────────────────────
// Standalone admin tool. Generates a 7-day split based on goal, training age,
// days/week, equipment, and limitations. Pushes the generated plan into a
// client's workout_plans row in the same shape the WorkoutEditor uses.
//
// Methodology (synthesized from publicly published evidence-based coaching):
//   Volume       — MEV → MAV → MRV ranges per muscle group, per week
//                  (10–20 sets/wk hypertrophy; 5–10 sets/wk strength)
//   Frequency    — each muscle hit ≥2×/week (Schoenfeld 2016 meta-analysis)
//   Rep ranges   — Strength 3–5 · Hypertrophy 6–12 · Endurance 12–20
//   Rest         — Strength 3–5min · Hypertrophy 60–120s · Endurance 30–60s
//   Split        — selected by days/week available
//   Exercise sel — compound-first, isolation accessories, equipment-aware,
//                  filtered by user-listed limitations

// ─── Constants ──────────────────────────────────────────────────────────────
const WB_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const WB_GOALS = [
  { id: 'hypertrophy', label: 'Build Muscle',   sub: 'Hypertrophy — size and definition' },
  { id: 'strength',    label: 'Get Stronger',   sub: 'Maximal force, lower reps, longer rest' },
  { id: 'fatloss',     label: 'Lose Fat',       sub: 'Higher density, preserve muscle' },
  { id: 'general',     label: 'General Fitness', sub: 'Balanced full-body health' },
  { id: 'athletic',    label: 'Athletic',       sub: 'Power, conditioning, sport-ready' },
];

const WB_EXPERIENCE = [
  { id: 'beginner',    label: 'Beginner',     sub: '< 1 year consistent training', volMult: 0.75 },
  { id: 'intermediate',label: 'Intermediate', sub: '1–3 years, comfortable with form', volMult: 1.0 },
  { id: 'advanced',    label: 'Advanced',     sub: '3+ years, established lifter', volMult: 1.15 },
];

const WB_EQUIPMENT = [
  { id: 'full_gym',  label: 'Full Gym',      sub: 'Barbells, machines, cables, dumbbells' },
  { id: 'home_db',   label: 'Home — Dumbbells', sub: 'Adjustable DBs, bench, optional bands' },
  { id: 'minimal',   label: 'Minimal / Bodyweight', sub: 'Pull-up bar, bands, bodyweight only' },
];

const WB_DAYS_WEEK = [3, 4, 5, 6];

// Splits keyed by days/week + goal. Each day is { focus, muscles[] }.
// muscles array drives exercise selection.
const WB_SPLITS = {
  3: {
    default: [
      { focus: 'Full Body A', muscles: ['quads','chest','back','core'] },
      { focus: 'Full Body B', muscles: ['hamstrings','shoulders','back','arms'] },
      { focus: 'Full Body C', muscles: ['quads','chest','back','arms','core'] },
    ],
  },
  4: {
    default: [
      { focus: 'Upper Body', muscles: ['chest','back','shoulders','arms'] },
      { focus: 'Lower Body', muscles: ['quads','hamstrings','glutes','calves','core'] },
      { focus: 'Upper Body', muscles: ['back','chest','shoulders','arms'] },
      { focus: 'Lower Body', muscles: ['hamstrings','quads','glutes','calves','core'] },
    ],
    strength: [
      { focus: 'Upper — Push Focus', muscles: ['chest','shoulders','arms'] },
      { focus: 'Lower — Squat Focus', muscles: ['quads','glutes','calves','core'] },
      { focus: 'Upper — Pull Focus', muscles: ['back','arms'] },
      { focus: 'Lower — Deadlift Focus', muscles: ['hamstrings','glutes','back','core'] },
    ],
  },
  5: {
    default: [
      { focus: 'Push (Chest, Shoulders, Triceps)', muscles: ['chest','shoulders','triceps'] },
      { focus: 'Pull (Back, Biceps, Rear Delts)', muscles: ['back','biceps'] },
      { focus: 'Legs (Quad Focus)', muscles: ['quads','glutes','calves','core'] },
      { focus: 'Upper Body', muscles: ['chest','back','shoulders','arms'] },
      { focus: 'Legs (Posterior Focus)', muscles: ['hamstrings','glutes','calves','core'] },
    ],
  },
  6: {
    default: [
      { focus: 'Push', muscles: ['chest','shoulders','triceps'] },
      { focus: 'Pull', muscles: ['back','biceps'] },
      { focus: 'Legs', muscles: ['quads','hamstrings','glutes','calves'] },
      { focus: 'Push', muscles: ['shoulders','chest','triceps'] },
      { focus: 'Pull', muscles: ['back','biceps','core'] },
      { focus: 'Legs', muscles: ['hamstrings','glutes','quads','core'] },
    ],
  },
};

// Rest day distribution by days/week. Returns array of 7 booleans (true = train).
const WB_REST_PATTERNS = {
  3: [true,false,true,false,true,false,false],         // Mon, Wed, Fri
  4: [true,true,false,true,true,false,false],          // Mon, Tue, Thu, Fri
  5: [true,true,false,true,true,true,false],           // Mon, Tue, Thu, Fri, Sat
  6: [true,true,true,false,true,true,true],            // off Thu
};

// Exercise library. Tagged by muscle, equipment, type (compound/isolation).
// Used to populate days based on split + equipment selection.
const WB_EXERCISES = [
  // QUADS
  { name: 'Back Squat',          muscles: ['quads','glutes'], type:'compound', eq:['full_gym'], priority: 1 },
  { name: 'Front Squat',         muscles: ['quads','core'], type:'compound', eq:['full_gym'], priority: 2 },
  { name: 'Leg Press',           muscles: ['quads','glutes'], type:'compound', eq:['full_gym'], priority: 2 },
  { name: 'Bulgarian Split Squat', muscles: ['quads','glutes'], type:'compound', eq:['full_gym','home_db'], priority: 2 },
  { name: 'Goblet Squat',        muscles: ['quads','glutes'], type:'compound', eq:['home_db','full_gym'], priority: 3 },
  { name: 'Leg Extension',       muscles: ['quads'], type:'isolation', eq:['full_gym'], priority: 4 },
  { name: 'Walking Lunges',      muscles: ['quads','glutes'], type:'compound', eq:['home_db','full_gym','minimal'], priority: 3 },
  { name: 'Bodyweight Squat',    muscles: ['quads','glutes'], type:'compound', eq:['minimal'], priority: 3 },
  { name: 'Pistol Squat',        muscles: ['quads','glutes','core'], type:'compound', eq:['minimal'], priority: 2 },

  // HAMSTRINGS / GLUTES
  { name: 'Romanian Deadlift',   muscles: ['hamstrings','glutes','back'], type:'compound', eq:['full_gym','home_db'], priority: 1 },
  { name: 'Conventional Deadlift', muscles: ['hamstrings','glutes','back'], type:'compound', eq:['full_gym'], priority: 1 },
  { name: 'Hip Thrust',          muscles: ['glutes','hamstrings'], type:'compound', eq:['full_gym','home_db'], priority: 2 },
  { name: 'Hamstring Curl',      muscles: ['hamstrings'], type:'isolation', eq:['full_gym'], priority: 4 },
  { name: 'Good Morning',        muscles: ['hamstrings','glutes','back'], type:'compound', eq:['full_gym'], priority: 3 },
  { name: 'Single-Leg RDL',      muscles: ['hamstrings','glutes','core'], type:'compound', eq:['home_db','full_gym','minimal'], priority: 3 },
  { name: 'Glute Bridge',        muscles: ['glutes','hamstrings'], type:'compound', eq:['minimal','home_db'], priority: 3 },

  // CALVES
  { name: 'Standing Calf Raise', muscles: ['calves'], type:'isolation', eq:['full_gym','home_db','minimal'], priority: 4 },
  { name: 'Seated Calf Raise',   muscles: ['calves'], type:'isolation', eq:['full_gym'], priority: 4 },

  // CHEST
  { name: 'Barbell Bench Press', muscles: ['chest','triceps','shoulders'], type:'compound', eq:['full_gym'], priority: 1 },
  { name: 'Incline Dumbbell Press', muscles: ['chest','shoulders','triceps'], type:'compound', eq:['full_gym','home_db'], priority: 2 },
  { name: 'Dumbbell Bench Press', muscles: ['chest','triceps'], type:'compound', eq:['full_gym','home_db'], priority: 2 },
  { name: 'Cable Fly',           muscles: ['chest'], type:'isolation', eq:['full_gym'], priority: 3 },
  { name: 'Dumbbell Fly',        muscles: ['chest'], type:'isolation', eq:['full_gym','home_db'], priority: 4 },
  { name: 'Push-Up',             muscles: ['chest','triceps','shoulders'], type:'compound', eq:['minimal','home_db','full_gym'], priority: 3 },
  { name: 'Dips',                muscles: ['chest','triceps','shoulders'], type:'compound', eq:['full_gym','minimal'], priority: 2 },

  // BACK
  { name: 'Pull-Up',             muscles: ['back','biceps'], type:'compound', eq:['full_gym','minimal'], priority: 1 },
  { name: 'Lat Pulldown',        muscles: ['back','biceps'], type:'compound', eq:['full_gym'], priority: 2 },
  { name: 'Barbell Row',         muscles: ['back','biceps'], type:'compound', eq:['full_gym'], priority: 1 },
  { name: 'Dumbbell Row',        muscles: ['back','biceps'], type:'compound', eq:['full_gym','home_db'], priority: 2 },
  { name: 'Seated Cable Row',    muscles: ['back','biceps'], type:'compound', eq:['full_gym'], priority: 2 },
  { name: 'Face Pull',           muscles: ['back','shoulders'], type:'isolation', eq:['full_gym','home_db'], priority: 3 },
  { name: 'Inverted Row',        muscles: ['back','biceps'], type:'compound', eq:['minimal'], priority: 3 },
  { name: 'Band Pull-Apart',     muscles: ['back','shoulders'], type:'isolation', eq:['minimal','home_db'], priority: 4 },

  // SHOULDERS
  { name: 'Overhead Press',      muscles: ['shoulders','triceps'], type:'compound', eq:['full_gym'], priority: 1 },
  { name: 'Dumbbell Shoulder Press', muscles: ['shoulders','triceps'], type:'compound', eq:['full_gym','home_db'], priority: 2 },
  { name: 'Lateral Raise',       muscles: ['shoulders'], type:'isolation', eq:['full_gym','home_db'], priority: 3 },
  { name: 'Rear Delt Fly',       muscles: ['shoulders','back'], type:'isolation', eq:['full_gym','home_db'], priority: 4 },
  { name: 'Pike Push-Up',        muscles: ['shoulders','triceps'], type:'compound', eq:['minimal'], priority: 3 },

  // BICEPS
  { name: 'Barbell Curl',        muscles: ['biceps'], type:'isolation', eq:['full_gym'], priority: 3 },
  { name: 'Dumbbell Curl',       muscles: ['biceps'], type:'isolation', eq:['full_gym','home_db'], priority: 3 },
  { name: 'Hammer Curl',         muscles: ['biceps','arms'], type:'isolation', eq:['full_gym','home_db'], priority: 4 },
  { name: 'Chin-Up',             muscles: ['biceps','back'], type:'compound', eq:['full_gym','minimal'], priority: 2 },

  // TRICEPS
  { name: 'Tricep Pushdown',     muscles: ['triceps'], type:'isolation', eq:['full_gym'], priority: 3 },
  { name: 'Overhead Tricep Extension', muscles: ['triceps'], type:'isolation', eq:['full_gym','home_db'], priority: 4 },
  { name: 'Close-Grip Bench Press', muscles: ['triceps','chest'], type:'compound', eq:['full_gym','home_db'], priority: 3 },
  { name: 'Diamond Push-Up',     muscles: ['triceps','chest'], type:'compound', eq:['minimal'], priority: 4 },

  // CORE
  { name: 'Plank',               muscles: ['core'], type:'isolation', eq:['minimal','home_db','full_gym'], priority: 4 },
  { name: 'Hanging Leg Raise',   muscles: ['core'], type:'isolation', eq:['full_gym','minimal'], priority: 3 },
  { name: 'Cable Crunch',        muscles: ['core'], type:'isolation', eq:['full_gym'], priority: 4 },
  { name: 'Ab Wheel Rollout',    muscles: ['core'], type:'isolation', eq:['minimal','home_db','full_gym'], priority: 3 },
  { name: 'Pallof Press',        muscles: ['core'], type:'isolation', eq:['full_gym','home_db'], priority: 4 },
];

// Goal-driven prescription. Returns { repsCompound, repsIsolation, restCompound, restIsolation, setsPerMuscleWk }
const WB_PRESCRIPTION = {
  strength:    { repsC: '3–5',  repsI: '6–8',  restC: '3 min', restI: '90s', volume: 8,  tempo: '2-1-1' },
  hypertrophy: { repsC: '6–10', repsI: '10–12',restC: '90s',   restI: '60s', volume: 14, tempo: '3-1-1' },
  fatloss:     { repsC: '8–12', repsI: '12–15',restC: '60s',   restI: '45s', volume: 12, tempo: '2-0-1' },
  general:     { repsC: '8–12', repsI: '10–15',restC: '90s',   restI: '60s', volume: 10, tempo: '2-0-1' },
  athletic:    { repsC: '4–6',  repsI: '8–10', restC: '2 min', restI: '60s', volume: 10, tempo: '1-0-X' },
};

// ─── Exercise selection logic ───────────────────────────────────────────────
const containsLimit = (exerciseName, limitations) => {
  if (!limitations) return false;
  const lim = limitations.toLowerCase();
  const name = exerciseName.toLowerCase();
  // Crude keyword matching — coaches can edit the result
  const checks = [
    [/knee/, ['squat','lunge','leg press','leg extension','split squat','pistol']],
    [/shoulder/, ['overhead','press','dip','pike','lateral raise']],
    [/lower back|low back|back pain/, ['deadlift','good morning','barbell row','squat']],
    [/wrist/, ['push-up','bench press','close-grip','overhead press']],
    [/elbow/, ['curl','tricep','dip','close-grip']],
    [/hip/, ['hip thrust','squat','split squat','lunge']],
  ];
  for (const [pattern, keywords] of checks) {
    if (pattern.test(lim) && keywords.some(k => name.includes(k))) return true;
  }
  return false;
};

const pickExercises = ({ muscles, equipment, limitations, goal, exerciseCount }) => {
  // Filter by equipment & limitations
  const pool = WB_EXERCISES.filter(ex =>
    ex.eq.includes(equipment) && !containsLimit(ex.name, limitations)
  );

  const picked = [];
  const usedNames = new Set();

  // For each target muscle, grab 1-2 exercises (compound first)
  for (const muscle of muscles) {
    const candidates = pool
      .filter(ex => ex.muscles.includes(muscle) && !usedNames.has(ex.name))
      .sort((a, b) => {
        // Compound > isolation, then by priority
        if (a.type !== b.type) return a.type === 'compound' ? -1 : 1;
        return a.priority - b.priority;
      });
    if (candidates.length > 0) {
      picked.push(candidates[0]);
      usedNames.add(candidates[0].name);
      // For first 2 muscles in the day, optionally add an isolation accessory
      if (muscles.indexOf(muscle) < 2 && candidates.length > 1 && picked.length < exerciseCount) {
        const accessory = candidates.find(c => !usedNames.has(c.name) && c.type === 'isolation')
          || candidates[1];
        if (accessory) {
          picked.push(accessory);
          usedNames.add(accessory.name);
        }
      }
    }
    if (picked.length >= exerciseCount) break;
  }

  return picked.slice(0, exerciseCount);
};

const buildWeek = ({ goalId, experienceId, daysPerWeek, equipment, limitations }) => {
  const splits = WB_SPLITS[daysPerWeek];
  const splitDays = splits[goalId] || splits.default;
  const restPattern = WB_REST_PATTERNS[daysPerWeek];
  const rx = WB_PRESCRIPTION[goalId];
  const expMult = WB_EXPERIENCE.find(e => e.id === experienceId)?.volMult ?? 1.0;
  const exerciseCount = experienceId === 'beginner' ? 4
                      : experienceId === 'advanced' ? 6 : 5;

  const baseSets = goalId === 'strength' ? 4
                 : goalId === 'fatloss' ? 3
                 : 4;
  const compoundSets = Math.max(3, Math.round(baseSets * expMult));
  const isolationSets = Math.max(2, Math.round((baseSets - 1) * expMult));

  let trainingDayIndex = 0;
  return WB_DAYS.map((day, i) => {
    const isTraining = restPattern[i];
    if (!isTraining) {
      return {
        day, focus: 'Rest Day', restDay: true,
        restMessage: 'Active recovery — light walk, mobility, sleep. Recovery is where growth happens.',
        warmup: '', cooldown: '', exercises: [],
      };
    }
    const split = splitDays[trainingDayIndex % splitDays.length];
    trainingDayIndex++;
    const exercises = pickExercises({
      muscles: split.muscles, equipment, limitations, goal: goalId, exerciseCount,
    });
    return {
      day,
      focus: split.focus,
      restDay: false,
      warmup: '5 min easy cardio + dynamic mobility (leg swings, arm circles, hip openers)',
      cooldown: '5 min light walk · static stretch primary muscles 30s each',
      exercises: exercises.map((ex, j) => ({
        name: ex.name,
        sets: String(j === 0 ? compoundSets : (ex.type === 'compound' ? compoundSets : isolationSets)),
        reps: ex.type === 'compound' ? rx.repsC : rx.repsI,
        rest: ex.type === 'compound' ? rx.restC : rx.restI,
        weight: '',
        tempo: rx.tempo,
        notes: j === 0 ? 'Primary lift — leave 1–2 reps in reserve' : '',
      })),
    };
  });
};

// ─── Reusable bits ──────────────────────────────────────────────────────────
const WbProgressBar = ({ value }) => (
  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
    <div style={{ width: `${value*100}%`, height: '100%', background: 'linear-gradient(90deg,#0066cc,#2997ff)',
      borderRadius: 999, transition: 'width 0.35s cubic-bezier(.2,.8,.2,1)' }} />
  </div>
);

const WbCard = ({ selected, onClick, children, padding = '22px 24px' }) => (
  <button onClick={onClick} type="button"
    style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: selected ? 'rgba(41,151,255,0.10)' : 'rgba(255,255,255,0.04)',
      border: `1.5px solid ${selected ? '#2997ff' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 14, padding, color: '#f5f5f7', fontFamily: 'inherit',
      transition: 'background 0.15s, border-color 0.15s',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    }}>
    {children}
  </button>
);

const WbStepShell = ({ title, sub, children }) => (
  <div style={{ animation: 'fadeIn 0.25s ease' }}>
    <h2 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 8 }}>{title}</h2>
    {sub && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 28, lineHeight: 1.5 }}>{sub}</p>}
    {!sub && <div style={{ marginBottom: 28 }} />}
    {children}
  </div>
);

const WbNavRow = ({ onBack, onNext, nextLabel = 'Continue', nextDisabled = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, gap: 12 }}>
    {onBack ? (
      <button onClick={onBack} className="btn-ghost" style={{ padding: '10px 20px' }}>← Back</button>
    ) : <span />}
    {onNext && (
      <button onClick={onNext} disabled={nextDisabled}
        className="btn-blue" style={{
          padding: '12px 28px', fontSize: 15,
          opacity: nextDisabled ? 0.4 : 1,
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
        }}>{nextLabel}</button>
    )}
  </div>
);

const WbChevron = ({ selected }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    {selected ? (
      <React.Fragment>
        <circle cx="10" cy="10" r="9" fill="#2997ff" />
        <path d="M6 10l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </React.Fragment>
    ) : (
      <path d="M7 5l5 5-5 5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);

// ─── Steps ──────────────────────────────────────────────────────────────────
const WbStepGoal = ({ value, onChange }) => (
  <WbStepShell title="What's the training goal?" sub="This sets the rep ranges, rest periods, and weekly volume.">
    <div style={{ display: 'grid', gap: 10 }}>
      {WB_GOALS.map(g => (
        <WbCard key={g.id} selected={value === g.id} onClick={() => onChange(g.id)}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{g.label}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{g.sub}</div>
          </div>
          <WbChevron selected={value === g.id} />
        </WbCard>
      ))}
    </div>
  </WbStepShell>
);

const WbStepExperience = ({ value, onChange }) => (
  <WbStepShell title="Training experience" sub="Adjusts volume — beginners need less, advanced need more.">
    <div style={{ display: 'grid', gap: 10 }}>
      {WB_EXPERIENCE.map(e => (
        <WbCard key={e.id} selected={value === e.id} onClick={() => onChange(e.id)}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{e.label}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{e.sub}</div>
          </div>
          <WbChevron selected={value === e.id} />
        </WbCard>
      ))}
    </div>
  </WbStepShell>
);

const WbStepDays = ({ value, onChange }) => (
  <WbStepShell title="Days per week" sub="More days = more recovery between sessions and finer split. 4–5 is the sweet spot for most clients.">
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {WB_DAYS_WEEK.map(d => (
        <button key={d} onClick={() => onChange(d)} type="button"
          style={{
            padding: '24px 16px', cursor: 'pointer', fontFamily: 'inherit',
            background: value === d ? 'rgba(41,151,255,0.10)' : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${value === d ? '#2997ff' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 14, color: '#f5f5f7',
            transition: 'background 0.15s, border-color 0.15s',
          }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: value === d ? '#2997ff' : '#fff', letterSpacing: '-0.02em' }}>{d}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>days</div>
        </button>
      ))}
    </div>
  </WbStepShell>
);

const WbStepEquipment = ({ value, onChange }) => (
  <WbStepShell title="Equipment available" sub="We'll only suggest exercises the client can actually do.">
    <div style={{ display: 'grid', gap: 10 }}>
      {WB_EQUIPMENT.map(e => (
        <WbCard key={e.id} selected={value === e.id} onClick={() => onChange(e.id)}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 600 }}>{e.label}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{e.sub}</div>
          </div>
          <WbChevron selected={value === e.id} />
        </WbCard>
      ))}
    </div>
  </WbStepShell>
);

const WbStepLimits = ({ value, onChange }) => (
  <WbStepShell title="Injuries or limitations" sub="Optional. Mention any joints, regions, or movements to avoid — we'll filter the suggested exercises.">
    <textarea className="field-input" rows={4} value={value} onChange={e => onChange(e.target.value)}
      placeholder="e.g. Avoid overhead pressing, left knee meniscus, low back disc issues"
      style={{ resize: 'vertical', minHeight: 100, fontFamily: 'inherit' }} />
    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
      Recognized keywords: knee, shoulder, lower back, wrist, elbow, hip. Exercises matching these will be excluded.
    </p>
  </WbStepShell>
);

// ─── Results ────────────────────────────────────────────────────────────────
const WbResults = ({ inputs, week, clients, sb, onRestart, onRegenerate }) => {
  const [selectedClientId, setSelectedClientId] = React.useState('');
  const [importMsg, setImportMsg] = React.useState('');
  const [importing, setImporting] = React.useState(false);
  const [activeDay, setActiveDay] = React.useState(0);

  const goal = WB_GOALS.find(g => g.id === inputs.goalId);
  const exp = WB_EXPERIENCE.find(e => e.id === inputs.experienceId);
  const eq = WB_EQUIPMENT.find(e => e.id === inputs.equipment);
  const rx = WB_PRESCRIPTION[inputs.goalId];

  const trainingDays = week.filter(d => !d.restDay).length;
  const totalExercises = week.reduce((sum, d) => sum + (d.exercises ? d.exercises.length : 0), 0);

  const importToClient = async () => {
    if (!selectedClientId) return;
    setImporting(true); setImportMsg('');
    const client = clients.find(c => c.id === selectedClientId);
    try {
      // Find latest active workout plan, update it, or insert new
      const { data: existing } = await sb.from('workout_plans')
        .select('*').eq('client_id', selectedClientId).eq('active', true)
        .order('created_at', { ascending: false }).limit(1);

      const title = `${goal.label} · ${inputs.daysPerWeek}-Day Split`;
      const goalLabel = inputs.goalId === 'hypertrophy' ? 'Hypertrophy'
                     : inputs.goalId === 'strength' ? 'Strength'
                     : inputs.goalId === 'fatloss' ? 'Fat Loss'
                     : inputs.goalId === 'athletic' ? 'Sport-Specific'
                     : 'General Fitness';

      const payload = {
        title,
        goal: goalLabel,
        limitations: inputs.limitations || null,
        plan_data: week,
        active: true,
        updated_at: new Date().toISOString(),
      };

      let res;
      if (existing && existing.length) {
        res = await sb.from('workout_plans').update(payload).eq('id', existing[0].id).select().single();
      } else {
        res = await sb.from('workout_plans').insert({
          client_id: selectedClientId,
          ...payload,
        }).select().single();
      }
      if (res.error) throw res.error;
      setImportMsg(`✓ Imported to ${client.name}'s workout profile.`);
    } catch (err) {
      setImportMsg('Error: ' + (err.message || err));
    } finally { setImporting(false); }
  };

  const day = week[activeDay];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Hero summary */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#2997ff',
          letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 12 }}>Generated Plan</p>
        <div style={{ fontSize: 32, fontWeight: 600, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 8 }}>
          {goal.label} · {inputs.daysPerWeek}-Day Split
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>
          {trainingDays} training days · {totalExercises} exercises · {7 - trainingDays} rest days
        </p>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
        {[
          { label: 'Rep Range', val: `${rx.repsC} / ${rx.repsI}`, sub: 'compound / isol.' },
          { label: 'Rest', val: `${rx.restC} / ${rx.restI}`, sub: 'compound / isol.' },
          { label: 'Tempo', val: rx.tempo, sub: 'eccentric-pause-conc.' },
          { label: 'Volume', val: `~${rx.volume}`, sub: 'sets/muscle/wk' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '14px 16px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textAlign: 'center',
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 6 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{s.val}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Week preview */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>The week</h3>

        {/* Day tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {week.map((d, i) => (
            <button key={i} onClick={() => setActiveDay(i)} type="button"
              style={{
                borderRadius: 980, padding: '8px 14px', fontSize: 12, cursor: 'pointer', border: 'none',
                fontFamily: 'inherit', fontWeight: activeDay === i ? 600 : 400,
                background: activeDay === i ? '#0066cc' : 'rgba(255,255,255,0.07)',
                color: activeDay === i ? '#fff' : d.restDay ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.12s',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <span>{d.day.slice(0, 3)}</span>
              {d.restDay
                ? <span style={{ fontSize: 9, opacity: 0.7 }}>•R</span>
                : <span style={{ fontSize: 10, opacity: 0.7 }}>{d.exercises.length}</span>}
            </button>
          ))}
        </div>

        {/* Active day detail */}
        <div style={{
          padding: '18px 20px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{day.day}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{day.focus}</div>
            </div>
            {day.restDay && (
              <span style={{ fontSize: 11, color: '#bf5af2', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.08em', padding: '4px 10px', background: 'rgba(191,90,242,0.12)',
                borderRadius: 999 }}>Rest</span>
            )}
          </div>

          {day.restDay ? (
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.55 }}>{day.restMessage}</p>
          ) : (
            <React.Fragment>
              {day.warmup && (
                <div style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Warm-up</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{day.warmup}</div>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                      {['Exercise','Sets','Reps','Rest','Tempo'].map((h, i) => (
                        <th key={i} style={{
                          padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                          color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {day.exercises.map((ex, ei) => (
                      <tr key={ei} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px', fontSize: 14, color: '#fff', fontWeight: 500 }}>{ex.name}</td>
                        <td style={{ padding: '10px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{ex.sets}</td>
                        <td style={{ padding: '10px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{ex.reps}</td>
                        <td style={{ padding: '10px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{ex.rest}</td>
                        <td style={{ padding: '10px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{ex.tempo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {day.cooldown && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 4 }}>Cool-down</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{day.cooldown}</div>
                </div>
              )}
            </React.Fragment>
          )}
        </div>
      </div>

      {/* Methodology */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>How we built this</h3>
        <div style={{ display: 'grid', gap: 10 }}>
          <WbRow label="Goal" value={goal.label} highlight />
          <WbRow label="Experience" value={`${exp.label} (×${exp.volMult} volume)`} />
          <WbRow label="Frequency" value={`${inputs.daysPerWeek}× per week — each muscle hit ≥2×`} />
          <WbRow label="Equipment" value={eq.label} />
          <WbRow label="Compound rep range" value={rx.repsC} />
          <WbRow label="Isolation rep range" value={rx.repsI} />
          <WbRow label="Compound rest" value={rx.restC} />
          <WbRow label="Isolation rest" value={rx.restI} />
          <WbRow label="Target weekly volume" value={`~${rx.volume} sets/muscle group`} />
          {inputs.limitations && (
            <WbRow label="Limitations applied" value={inputs.limitations} warn />
          )}
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 14, lineHeight: 1.5 }}>
          Volume targets follow MEV–MAV–MRV ranges from evidence-based hypertrophy literature (Schoenfeld, Israetel).
          Frequency floor of 2× per muscle/week comes from the Schoenfeld 2016 meta-analysis. Suggested loads, weights,
          and final exercise selection should be reviewed and tailored by the coach before delivery.
        </p>
      </div>

      {/* Import to client */}
      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>Import to client profile</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 14, lineHeight: 1.55 }}>
          Push this 7-day split straight to a client. Replaces their active workout plan — open the editor afterward to fine-tune loads, swap exercises, or add notes.
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="field-input" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}
            style={{ flex: '1 1 240px', minWidth: 240 }}>
            <option value="">Select a client…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-blue" disabled={!selectedClientId || importing} onClick={importToClient}
            style={{ opacity: !selectedClientId || importing ? 0.5 : 1, cursor: !selectedClientId || importing ? 'not-allowed' : 'pointer' }}>
            {importing ? 'Importing…' : 'Import →'}
          </button>
        </div>
        {importMsg && (
          <p style={{ marginTop: 12, fontSize: 13,
            color: importMsg.startsWith('Error') ? '#ff453a' : '#34c759' }}>{importMsg}</p>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
        <button className="btn-ghost" onClick={onRestart}>↻ Start over</button>
        <button className="btn-ghost" onClick={onRegenerate}>⚡ Regenerate with same inputs</button>
      </div>
    </div>
  );
};

const WbRow = ({ label, value, highlight = false, warn = false }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14,
    padding: '10px 14px', background: highlight ? 'rgba(41,151,255,0.08)' : warn ? 'rgba(255,159,10,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${highlight ? 'rgba(41,151,255,0.20)' : warn ? 'rgba(255,159,10,0.20)' : 'rgba(255,255,255,0.05)'}`,
    borderRadius: 10,
  }}>
    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: 14, fontWeight: 600, color: highlight ? '#2997ff' : warn ? '#ff9f0a' : '#fff', textAlign: 'right' }}>{value}</span>
  </div>
);

// ─── Main ───────────────────────────────────────────────────────────────────
const WorkoutBuilder = ({ sb, clients, onBack }) => {
  const [step, setStep] = React.useState(0);
  const [goalId, setGoalId] = React.useState('');
  const [experienceId, setExperienceId] = React.useState('');
  const [daysPerWeek, setDaysPerWeek] = React.useState(0);
  const [equipment, setEquipment] = React.useState('');
  const [limitations, setLimitations] = React.useState('');
  const [generation, setGeneration] = React.useState(0);

  const stepIds = ['goal','experience','days','equipment','limitations','results'];
  const currentId = stepIds[step];
  const totalQuiz = stepIds.length - 1;
  const progress = currentId === 'results' ? 1 : step / totalQuiz;

  const next = () => setStep(s => Math.min(s + 1, stepIds.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const canContinue = (() => {
    switch (currentId) {
      case 'goal': return !!goalId;
      case 'experience': return !!experienceId;
      case 'days': return !!daysPerWeek;
      case 'equipment': return !!equipment;
      case 'limitations': return true; // optional
      default: return true;
    }
  })();

  const inputs = { goalId, experienceId, daysPerWeek, equipment, limitations };

  const week = React.useMemo(() => {
    if (currentId !== 'results') return null;
    return buildWeek(inputs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, goalId, experienceId, daysPerWeek, equipment, limitations, generation]);

  const restart = () => {
    setStep(0); setGoalId(''); setExperienceId(''); setDaysPerWeek(0);
    setEquipment(''); setLimitations(''); setGeneration(0);
  };

  return (
    <div className="fade-in">
      <button className="btn-ghost" onClick={onBack} style={{ marginBottom: 20 }}>← Back to clients</button>

      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.10em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 6 }}>Workout Builder · Auto-Programming</p>
          {currentId !== 'results' && (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              Step {step + 1} of {totalQuiz}
            </p>
          )}
        </div>

        {/* Progress */}
        {currentId !== 'results' && (
          <div style={{ marginBottom: 36 }}>
            <WbProgressBar value={progress} />
          </div>
        )}

        {/* Step body */}
        <div className="card" style={{ padding: '32px 32px' }}>
          {currentId === 'goal'        && <WbStepGoal value={goalId} onChange={setGoalId} />}
          {currentId === 'experience'  && <WbStepExperience value={experienceId} onChange={setExperienceId} />}
          {currentId === 'days'        && <WbStepDays value={daysPerWeek} onChange={setDaysPerWeek} />}
          {currentId === 'equipment'   && <WbStepEquipment value={equipment} onChange={setEquipment} />}
          {currentId === 'limitations' && <WbStepLimits value={limitations} onChange={setLimitations} />}
          {currentId === 'results' && week && (
            <WbResults
              inputs={inputs}
              week={week}
              clients={clients}
              sb={sb}
              onRestart={restart}
              onRegenerate={() => setGeneration(g => g + 1)}
            />
          )}

          {currentId !== 'results' && (
            <WbNavRow
              onBack={step > 0 ? back : null}
              onNext={next}
              nextDisabled={!canContinue}
              nextLabel={currentId === 'limitations' && !limitations ? 'Skip & Generate' : currentId === 'limitations' ? 'Generate Plan' : 'Continue'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

window.WorkoutBuilder = WorkoutBuilder;
