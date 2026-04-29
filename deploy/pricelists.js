// Shared pricelists for both Admin (reference) and ClientPortal (order form).
// Two pricelists: 'standard' (default — retail clients) and 'wholesale'
// (discounted — for resellers / VIP / bulk buyers).
//
// To change a price: edit the number next to the product name and redeploy.
// To add a product: add it to BOTH pricelists with the appropriate price.
// To rename a pricelist: change the `name` field — but DO NOT change the
// key (e.g. 'standard') because that's what's stored on each client row.

window.PRICELISTS = {
  standard: {
    name: 'Standard',
    description: 'Retail pricing — default for new clients.',
    products: [
      // Consulting Services
      { name: 'Nutrition Plan — 1 Month',                       price: 350, category: 'Consulting' },
      { name: 'Workout Routine — 1 Month',                      price: 250, category: 'Consulting' },
      { name: 'Hormone / Bloodwork Consultation — 1 Month',     price: 250, category: 'Consulting' },
      { name: 'Nutrition / Workout / Hormone Bundle — 1 Month', price: 600, category: 'Consulting' },
      // Peptides
      { name: 'Selank — 10mg',         price: 150, category: 'Peptides' },
      { name: 'Semax — 10mg',          price: 150, category: 'Peptides' },
      { name: 'KPV — 10mg',            price: 125, category: 'Peptides' },
      { name: 'DSIP — 10mg',           price: 175, category: 'Peptides' },
      { name: 'SS-31 — 10mg',          price: 125, category: 'Peptides' },
      { name: 'SS-31 — 30mg',          price: 175, category: 'Peptides' },
      { name: 'CJC 1295 DAC — 5mg',    price: 150, category: 'Peptides' },
      { name: 'BPC — 10mg',            price: 175, category: 'Peptides' },
      { name: '5 Amino — 50mg',        price: 175, category: 'Peptides' },
      { name: 'SNAP-8 — 8mg',          price: 100, category: 'Peptides' },
      { name: 'TB-500 — 10mg',         price: 175, category: 'Peptides' },
      { name: 'PT-141 — 10mg',         price: 125, category: 'Peptides' },
      { name: 'HGH — 10IU',            price: 150, category: 'Peptides' },
      { name: 'HGH — 36IU',            price: 200, category: 'Peptides' },
      { name: 'MOTS — 10mg',           price: 125, category: 'Peptides' },
      { name: 'MOTS — 40mg',           price: 200, category: 'Peptides' },
      { name: 'Epithalon — 50mg',      price: 225, category: 'Peptides' },
      { name: 'GHRP-2 — 10mg',         price: 150, category: 'Peptides' },
      { name: 'GHRP-6 — 10mg',         price: 150, category: 'Peptides' },
      { name: 'HCG — 5000IU',          price: 150, category: 'Peptides' },
      { name: 'CJC/IPA — 5+5mg',       price: 175, category: 'Peptides' },
      { name: 'IPA — 10mg',            price: 125, category: 'Peptides' },
      { name: 'IGF LR3 — 1mg',         price: 200, category: 'Peptides' },
      { name: 'Cagrilintide — 10mg',   price: 150, category: 'Peptides' },
      { name: 'KLOW — 80mg',           price: 200, category: 'Peptides' },
      { name: 'NAD+ — 1000mg',         price: 150, category: 'Peptides' },
      { name: 'Glutathione — 1200mg',  price: 125, category: 'Peptides' },
      // GLP-1 / Weight Loss
      { name: 'Semaglutide — 10mg',    price: 150, category: 'GLP-1' },
      { name: 'Semaglutide — 15mg',    price: 175, category: 'GLP-1' },
      { name: 'Tirzepatide — 10mg',    price: 150, category: 'GLP-1' },
      { name: 'Tirzepatide — 20mg',    price: 175, category: 'GLP-1' },
      { name: 'Tirzepatide — 30mg',    price: 200, category: 'GLP-1' },
      { name: 'Tirzepatide — 40mg',    price: 225, category: 'GLP-1' },
      { name: 'Tirzepatide — 60mg',    price: 250, category: 'GLP-1' },
      { name: 'Retatrutide — 10mg',    price: 160, category: 'GLP-1' },
      { name: 'Retatrutide — 12mg',    price: 170, category: 'GLP-1' },
      { name: 'Retatrutide — 15mg',    price: 180, category: 'GLP-1' },
      { name: 'Retatrutide — 20mg',    price: 200, category: 'GLP-1' },
      { name: 'Retatrutide — 30mg',    price: 225, category: 'GLP-1' },
      { name: 'Retatrutide — 60mg',    price: 275, category: 'GLP-1' },
    ],
  },

  wholesale: {
    name: 'Wholesale',
    description: 'Discounted pricing — for resellers, VIPs, or bulk buyers.',
    products: [
      // Consulting Services
      { name: 'Nutrition Plan — 1 Month',                       price: 250, category: 'Consulting' },
      { name: 'Workout Routine — 1 Month',                      price: 175, category: 'Consulting' },
      { name: 'Hormone / Bloodwork Referral — 1 Month',     price: 175, category: 'Consulting' },
      { name: 'Nutrition / Workout / Hormone Bundle — 1 Month', price: 450, category: 'Consulting' },
      // Peptides
      { name: 'Selank — 10mg',         price: 65, category: 'Peptides' },
      { name: 'Semax — 10mg',          price: 65, category: 'Peptides' },
      { name: 'KPV — 10mg',            price:  65, category: 'Peptides' },
      { name: 'DSIP — 10mg',           price: 65, category: 'Peptides' },
      { name: 'SS-31 — 10mg',          price:  60, category: 'Peptides' },
      { name: 'SS-31 — 30mg',          price: 75, category: 'Peptides' },
      { name: 'CJC 1295 DAC — 5mg',    price: 75, category: 'Peptides' },
      { name: 'BPC — 10mg',            price: 100, category: 'Peptides' },
      { name: '5 Amino — 50mg',        price: 75, category: 'Peptides' },
      { name: 'SNAP-8 — 8mg',          price:  75, category: 'Peptides' },
      { name: 'TB-500 — 10mg',         price: 100, category: 'Peptides' },
      { name: 'PT-141 — 10mg',         price:  65, category: 'Peptides' },
      { name: 'HGH — 10IU',            price: 110, category: 'Peptides' },
      { name: 'HGH — 36IU',            price: 150, category: 'Peptides' },
      { name: 'MOTS — 10mg',           price:  50, category: 'Peptides' },
      { name: 'MOTS — 40mg',           price: 100, category: 'Peptides' },
      { name: 'Epithalon — 50mg',      price: 100, category: 'Peptides' },
      { name: 'GHRP-2 — 10mg',         price: 75, category: 'Peptides' },
      { name: 'GHRP-6 — 10mg',         price: 75, category: 'Peptides' },
      { name: 'HCG — 5000IU',          price: 110, category: 'Peptides' },
      { name: 'CJC/IPA — 5+5mg',       price: 130, category: 'Peptides' },
      { name: 'IPA — 10mg',            price:  95, category: 'Peptides' },
      { name: 'IGF LR3 — 1mg',         price: 100, category: 'Peptides' },
      { name: 'Cagrilintide — 10mg',   price: 110, category: 'Peptides' },
      { name: 'KLOW — 80mg',           price: 75, category: 'Peptides' },
      { name: 'NAD+ — 1000mg',         price: 75, category: 'Peptides' },
      { name: 'Glutathione — 1200mg',  price:  75, category: 'Peptides' },
      // GLP-1 / Weight Loss
      { name: 'Semaglutide — 10mg',    price: 100, category: 'GLP-1' },
      { name: 'Semaglutide — 15mg',    price: 115, category: 'GLP-1' },
      { name: 'Tirzepatide — 10mg',    price: 100, category: 'GLP-1' },
      { name: 'Tirzepatide — 20mg',    price: 125, category: 'GLP-1' },
      { name: 'Tirzepatide — 30mg',    price: 125, category: 'GLP-1' },
      { name: 'Tirzepatide — 40mg',    price: 135, category: 'GLP-1' },
      { name: 'Tirzepatide — 60mg',    price: 145, category: 'GLP-1' },
      { name: 'Retatrutide — 10mg',    price: 100, category: 'GLP-1' },
      { name: 'Retatrutide — 12mg',    price: 100, category: 'GLP-1' },
      { name: 'Retatrutide — 15mg',    price: 115, category: 'GLP-1' },
      { name: 'Retatrutide — 20mg',    price: 125, category: 'GLP-1' },
      { name: 'Retatrutide — 30mg',    price: 135, category: 'GLP-1' },
      { name: 'Retatrutide — 60mg',    price: 210, category: 'GLP-1' },
    ],
  },
};

// Helper used by ClientPortal: get the right product list for a client.
// Falls back to 'standard' if pricelist is missing or unknown.
window.getPricelist = function(key) {
  return window.PRICELISTS[key] || window.PRICELISTS.standard;
};

// Helper: flat list of "Name — $price" strings, for the simple <select> dropdown.
window.getPricelistAsLabels = function(key) {
  const pl = window.getPricelist(key);
  return pl.products.map(p => `${p.name} — $${p.price}`);
};

// Convenience: list of pricelist keys + names for dropdowns.
window.getPricelistOptions = function() {
  return Object.entries(window.PRICELISTS).map(([key, pl]) => ({
    value: key, label: pl.name,
  }));
};
