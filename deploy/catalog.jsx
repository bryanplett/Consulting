// catalog.jsx — PeakForm Bio Product Catalog (public site)
// Renders categorized product reveal cards. Excludes Semaglutide, Tirzepatide,
// Retatrutide from public display (they remain available in the client portal).
// Exports: ProductCatalog

const CATALOG = [
  {
    id: 'metabolic',
    title: 'Metabolic / Weight Management',
    tint: '#ff9f0a',
    blurb: 'Compounds that support metabolic health, appetite regulation, and body composition.',
    products: [
      // Semaglutide, Tirzepatide, Retatrutide intentionally hidden on public site
      { name: 'Cagrilintide', strength: '10mg', category: 'Metabolic', blurb: 'Long-acting amylin analog supporting satiety and weight management.', photo: 'assets/product-cagrilintide.png' },
      { name: '5 Amino 1MQ', strength: '50mg', category: 'Metabolic', blurb: 'Targets NNMT to support fat metabolism and metabolic flexibility.', photo: 'assets/product-5amino1mq.png' },
      { name: 'KLOW', strength: '80mg', category: 'Metabolic', blurb: 'Multi-peptide blend formulated for metabolic and recovery support.', photo: 'assets/product-klow.png' },
      { name: 'Lipo-C', strength: 'injection', category: 'Metabolic', blurb: 'Lipotropic blend (methionine, inositol, choline + B vitamins) supporting fat metabolism and energy.' },
      { name: 'Supershred', strength: 'injection', category: 'Metabolic', blurb: 'Advanced lipotropic formula combining fat-mobilizing compounds for accelerated body composition support.' },
      { name: 'B12', strength: 'injection', category: 'Wellness', blurb: 'Methylcobalamin B12 — supports energy, metabolism, red blood cell production, and neurological function.' },
    ],
  },
  {
    id: 'growth',
    title: 'Growth Hormone / Recovery / Muscle',
    tint: '#34c759',
    blurb: 'Peptides that support endogenous growth hormone, lean tissue, and recovery.',
    products: [
      { name: 'CJC-1295', strength: '10mg', category: 'Growth', blurb: 'GHRH analog supporting endogenous GH pulses and recovery.', photo: 'assets/product-cjc1295.png' },
      { name: 'Ipamorelin', strength: '10mg', category: 'Growth', blurb: 'Selective GH secretagogue with minimal cortisol impact.', photo: 'assets/product-ipamorelin.png' },
      { name: 'CJC-1295 + Ipamorelin', strength: '10mg', category: 'Growth', blurb: 'Synergistic blend for sustained GH support and recovery.', photo: 'assets/product-cjc1295-ipamorelin.png' },
      { name: 'Tesamorelin', strength: '10mg', category: 'Growth', blurb: 'GHRH analog for visceral fat reduction and metabolic health.', photo: 'assets/product-tesamorelin.png' },
      { name: 'GHRP-2', strength: '10mg', category: 'Growth', blurb: 'Growth hormone releasing peptide supporting GH and IGF-1.', photo: 'assets/product-ghrp2.png' },
      { name: 'GHRP-6', strength: '10mg', category: 'Growth', blurb: 'GH secretagogue with appetite-stimulating properties.', photo: 'assets/product-ghrp6.png' },
      { name: 'IGF-LR3', strength: '1mg', category: 'Growth', blurb: 'Long-acting IGF-1 analog for tissue repair and lean muscle support.', photo: 'assets/product-igflr3.png' },
      { name: 'BPC-157', strength: '10mg', category: 'Recovery', blurb: 'Body protection compound — accelerates tissue repair, reduces inflammation.', photo: 'assets/product-bpc157.png' },
      { name: 'TB-500', strength: '10mg', category: 'Recovery', blurb: 'Thymosin beta-4 fragment for cellular regeneration and flexibility.', photo: 'assets/product-tb500.png' },
      { name: 'Wolverine', strength: '10mg', category: 'Recovery', blurb: 'Recovery-focused peptide blend for connective tissue and inflammation.', photo: 'assets/product-wolverine.png' },
    ],
  },
  {
    id: 'longevity',
    title: 'Longevity / Cellular Health / Mitochondrial',
    tint: '#bf5af2',
    blurb: 'Compounds targeting cellular energetics, mitochondrial function, and healthspan.',
    products: [
      { name: 'NAD+', strength: '500mg', category: 'Longevity', blurb: 'Foundational coenzyme for cellular energy and DNA repair. Supports accelerated fat loss, energy & focus, metabolism, and muscle preservation.', photo: 'assets/product-nad.png' },
      { name: 'SS-31', strength: '10mg', category: 'Mitochondrial', blurb: 'Cardiolipin-binding peptide that protects and optimizes mitochondria. Improves mitochondrial function, reduces oxidative stress, and supports neuroprotection.', photo: 'assets/product-ss31.png' },
      { name: 'MOTS-c', strength: '10mg', category: 'Mitochondrial', blurb: 'Mitochondrial-derived peptide supporting metabolic health, insulin sensitivity, physical performance, and cellular longevity.', photo: 'assets/product-motsc.png' },
      { name: 'Epithalon', strength: '10mg', category: 'Longevity', blurb: 'Telomerase activator studied for telomere extension, improved sleep and pineal function, anti-aging, and immune support.', photo: 'assets/product-epithalon.png' },
    ],
  },
  {
    id: 'cognitive',
    title: 'Cognitive / Mood / Sleep',
    tint: '#2997ff',
    blurb: 'Peptides supporting cognition, mood regulation, and restorative sleep.',
    products: [
      { name: 'Selank', strength: '10mg', category: 'Cognitive', blurb: 'Anxiolytic peptide supporting anxiety and stress reduction, cognitive enhancement, and mood stabilization.', photo: 'assets/product-selank.png' },
      { name: 'Semax', strength: '10mg', category: 'Cognitive', blurb: 'Nootropic peptide supporting cognitive enhancement, mental health, stress reduction, and neuroprotection.', photo: 'assets/product-semax.png' },
      { name: 'Semax / Selank Blend', strength: '10mg', category: 'Cognitive', blurb: 'Combined formula for increased mental energy and productivity, enhanced cognitive function, and reduced anxiety and stress.', photo: 'assets/product-semax-selank.png' },
      { name: 'DSIP', strength: '10mg', category: 'Sleep', blurb: 'Delta sleep-inducing peptide supporting endocrine system regulation, sleep optimization, and stress & anxiety reduction.', photo: 'assets/product-dsip.png' },
    ],
  },
  {
    id: 'beauty',
    title: 'Skin / Beauty / Anti-Aging',
    tint: '#ff375f',
    blurb: 'Topical and systemic peptides for skin health, repair, and aesthetic outcomes.',
    products: [
      { name: 'GHK-Cu', strength: '50mg', category: 'Beauty', blurb: 'Copper peptide for collagen synthesis, skin repair, and anti-aging.', photo: 'assets/product-ghkcu.png' },
      { name: 'KLOW', strength: '80mg', category: 'Beauty', blurb: 'Multi-peptide blend for accelerated tissue repair, inflammation reduction, and skin rejuvenation.', photo: 'assets/product-klow.png' },
      { name: 'SNAP-8', strength: '10mg', category: 'Beauty', blurb: 'Topical peptide that softens expression lines — a non-invasive alternative for skin elasticity and firmness.', photo: 'assets/product-snap8.png' },
      { name: 'KPV', strength: '10mg', category: 'Beauty', blurb: 'Anti-inflammatory tripeptide for skin conditions, healing, and immune support.', photo: 'assets/product-kpv.png' },
    ],
  },
  {
    id: 'hormonal',
    title: 'Hormonal / Sexual Wellness',
    tint: '#ff6482',
    blurb: 'Compounds for hormonal balance and sexual wellness.',
    products: [
      { name: 'HCG', strength: '5000iu', category: 'Hormonal', blurb: 'Human chorionic gonadotropin for TRT support, testosterone & fertility support, and fertility enhancement.', photo: 'assets/product-hcg.png' },
      { name: 'PT-141', strength: '10mg', category: 'Sexual Wellness', blurb: 'Melanocortin agonist supporting sexual desire, function, and performance — versatile for both partners.', photo: 'assets/product-pt141.png' },
    ],
  },
  {
    id: 'programs',
    title: 'Programs / Services',
    tint: '#5ac8fa',
    blurb: 'Personalized coaching plans built on bloodwork, lifestyle, and goals.',
    products: [
      { name: 'Nutrition Plan', strength: '30 days', category: 'Service', blurb: 'Custom calorie & macro calculations, 7-day meal plan, and habit framework — built from your stats, goals, and activity level.', photo: 'assets/program-nutrition.png', photoPosition: '14% center' },
      { name: 'Workout Plan', strength: '12 weeks', category: 'Service', blurb: 'Periodized training protocol — volume, intensity, and progression engineered around your goals, schedule, and biomechanics.', photo: 'assets/program-workout.png', photoPosition: '14% center' },
    ],
  },
];

// ─── Placeholder visual (CSS vial). Will be replaced by uploaded photos. ────
const VialMark = ({ name, strength, tint, size = 140 }) => (
  <div style={{
    width: size, height: size * 1.5, position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    pointerEvents: 'none',
  }}>
    <div style={{
      width: size * 0.4, height: size * 0.18,
      background: 'linear-gradient(180deg, #d4d4d8 0%, #71717a 50%, #3f3f46 100%)',
      borderRadius: '6px 6px 2px 2px',
      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
    }} />
    <div style={{ width: size * 0.45, height: size * 0.05, background: '#52525b' }} />
    <div style={{
      width: size * 0.7, height: size * 0.95,
      background: `linear-gradient(135deg, rgba(255,255,255,0.18) 0%, ${tint}33 40%, ${tint}55 100%)`,
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: '4px 4px 12px 12px',
      position: 'relative', overflow: 'hidden',
      boxShadow: `inset -8px 0 16px rgba(0,0,0,0.3), inset 8px 0 12px rgba(255,255,255,0.1), 0 8px 24px rgba(0,0,0,0.4)`,
    }}>
      <div style={{
        position: 'absolute', top: '6%', left: '12%', width: '14%', height: '60%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 100%)',
        borderRadius: '50%', filter: 'blur(2px)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '70%',
        background: `linear-gradient(180deg, ${tint}99 0%, ${tint}cc 100%)`,
      }} />
      <div style={{
        position: 'absolute', bottom: '15%', left: '50%', transform: 'translateX(-50%)',
        width: '82%', padding: '6px 4px',
        background: 'rgba(255,255,255,0.94)',
        borderRadius: 4, textAlign: 'center', color: '#1a1a1c',
        fontSize: size * 0.085, fontWeight: 700, letterSpacing: 0.3, lineHeight: 1.15,
      }}>
        <div style={{ fontSize: size * 0.07, color: '#2997ff', fontWeight: 800 }}>PFB</div>
        <div style={{ fontSize: size * 0.075 }}>{name.length > 14 ? name.slice(0, 14) + '…' : name}</div>
        <div style={{ fontSize: size * 0.065, fontWeight: 500, color: '#52525b' }}>{strength}</div>
      </div>
    </div>
  </div>
);

// ─── Option 3 reveal card ───────────────────────────────────────────────────
const RevealCard = ({ product, tint, onSchedule }) => {
  const [hover, setHover] = React.useState(false);
  const panelRef = React.useRef(null);
  const [panelHeight, setPanelHeight] = React.useState(0);

  // Measure the slide-up panel so we can offset it consistently across all cards.
  React.useLayoutEffect(() => {
    if (panelRef.current) {
      setPanelHeight(panelRef.current.scrollHeight);
    }
  }, [product.blurb, product.name]);

  // Fixed card height keeps proportions identical across all cards.
  const CARD_HEIGHT = 460;
  // How much of the panel peeks at rest (header strip with category/name/strength).
  const PEEK_HEIGHT = 96;
  // Distance to slide down when not hovered.
  const slideOffset = Math.max(panelHeight - PEEK_HEIGHT, 0);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        width: '100%', height: CARD_HEIGHT,
        borderRadius: 24,
        background: `linear-gradient(180deg, #1a1a1c 0%, #0f0f10 100%)`,
        border: `1px solid ${hover ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        cursor: 'pointer', overflow: 'hidden',
        transition: 'border-color 0.3s',
      }}>
      {/* Aura */}
      <div style={{
        position: 'absolute', inset: '20% 15%',
        background: `radial-gradient(circle, ${tint}55 0%, transparent 70%)`,
        opacity: hover ? 0.7 : 0,
        transition: 'opacity 0.4s',
        filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />
      {/* Vial */}
      <div style={{
        position: 'absolute', top: product.photo ? '4%' : '14%', left: '50%',
        transform: `translate(-50%, ${hover ? '-20px' : '0'}) rotate(${hover ? '-3deg' : '0deg'})`,
        transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {product.photo ? (
          <img
            src={product.photo}
            alt={`${product.name} ${product.strength} vial`}
            style={{
              width: 220, height: 220, objectFit: 'cover',
              objectPosition: product.photoPosition || '32% center',
              borderRadius: 16,
              display: 'block',
              filter: hover ? 'brightness(1.05)' : 'brightness(0.95)',
              transition: 'filter 0.4s',
            }}
          />
        ) : (
          <VialMark name={product.name} strength={product.strength} tint={tint} size={140} />
        )}
      </div>
      {/* Slide-up panel */}
      <div
        ref={panelRef}
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(20,20,22,0) 0%, rgba(20,20,22,0.96) 30%, rgba(20,20,22,1) 100%)',
          padding: '48px 22px 22px',
          transform: hover ? 'translateY(0)' : `translateY(${slideOffset}px)`,
          transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        }}>
        <p style={{ fontSize: 11, letterSpacing: 1.5, color: tint, textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>{product.category}</p>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: '#f5f5f7', marginBottom: 4, letterSpacing: '-0.01em' }}>{product.name}</h3>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>{product.strength}</p>
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 16,
          opacity: hover ? 1 : 0, transition: 'opacity 0.3s 0.15s',
        }}>{product.blurb}</p>
        <button onClick={onSchedule} style={{
          background: 'transparent', color: '#fff',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: 980, padding: '7px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          opacity: hover ? 1 : 0, transition: 'opacity 0.3s 0.2s',
          fontFamily: 'inherit',
        }}>Inquire</button>
      </div>
    </div>
  );
};

// ─── Category section ───────────────────────────────────────────────────────
const CategorySection = ({ category, onSchedule }) => (
  <div style={{ marginBottom: 80 }}>
    <div style={{ marginBottom: 28, display: 'flex', alignItems: 'baseline', gap: 14, flexWrap: 'wrap' }}>
      <div style={{
        width: 6, height: 28, borderRadius: 3, background: category.tint,
        boxShadow: `0 0 16px ${category.tint}80`,
      }} />
      <h3 style={{
        fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 600, color: '#f5f5f7',
        letterSpacing: '-0.02em',
      }}>{category.title}</h3>
      <p style={{
        fontSize: 14, color: 'rgba(255,255,255,0.55)',
        maxWidth: 480, lineHeight: 1.45, marginLeft: 'auto',
      }}>{category.blurb}</p>
    </div>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 20,
    }}>
      {category.products.map(p => (
        <RevealCard key={p.name} product={p} tint={category.tint} onSchedule={onSchedule} />
      ))}
    </div>
  </div>
);

// ─── Catalog component ──────────────────────────────────────────────────────
const ProductCatalog = ({ onSchedule }) => {
  return (
    <section id="catalog" style={{
      background: '#0a0a0a',
      padding: '120px 24px',
      color: '#f5f5f7',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64, maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <p style={{
            fontSize: 12, letterSpacing: 2, color: '#2997ff', textTransform: 'uppercase',
            fontWeight: 600, marginBottom: 12,
          }}>Our Catalog</p>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 600,
            letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 18,
          }}>The toolkit, made specific.</h2>
          <p style={{
            fontSize: 18, color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.5, fontWeight: 300,
          }}>Hover any product to learn more. Every protocol is prescribed based on your bloodwork, goals, and a consultation — never off-the-shelf.</p>
        </div>

        {CATALOG.map(cat => <CategorySection key={cat.id} category={cat} onSchedule={onSchedule} />)}
      </div>
    </section>
  );
};

window.ProductCatalog = ProductCatalog;
